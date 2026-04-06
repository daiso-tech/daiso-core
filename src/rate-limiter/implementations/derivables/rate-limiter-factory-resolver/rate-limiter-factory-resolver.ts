/**
 * @module RateLimiter
 */

import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import {
    type IRateLimiterFactoryResolver,
    type IRateLimiterFactory,
    type IRateLimiterAdapter,
} from "@/rate-limiter/contracts/_module.js";
import {
    RateLimiterFactory,
    type RateLimiterFactorySettingsBase,
} from "@/rate-limiter/implementations/derivables/rate-limiter-factory/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    UnregisteredAdapterError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    DefaultAdapterNotDefinedError,
    type ErrorPolicy,
    type WaitUntil,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter"`
 * @group Derivables
 */
export type RateLimiterAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, IRateLimiterAdapter>
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter"`
 * @group Derivables
 */
export type RateLimiterFactoryResolverSettings<TAdapters extends string> =
    RateLimiterFactorySettingsBase & {
        adapters: RateLimiterAdapters<TAdapters>;

        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * The `RateLimiterFactoryResolver` class is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter"`
 * @group Derivables
 */
export class RateLimiterFactoryResolver<TAdapters extends string>
    implements IRateLimiterFactoryResolver<TAdapters>
{
    /**
     * @example
     * ```ts
     * import { RateLimiterFactoryResolver } from "@daiso-tech/core/rate-limiter";
     * import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storate-adapter";
     * import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
     * import { RedisRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/redis-rate-limiter-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Redis from "ioredis"
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const rateLimiterFactoryResolver = new RateLimiterFactoryResolver({
     *   serde,
     *   adapters: {
     *     memory: new DatabaseRateLimiterAdapter({
     *       adapter: new MemoryRateLimiterStorageAdapter()
     *     }),
     *     redis: new RedisRateLimiterAdapter({
     *       database: new Redis("YOUR_REDIS_CONNECTION")
     *     }),
     *   },
     *   defaultAdapter: "memory",
     * });
     * ```
     */
    constructor(
        private readonly settings: RateLimiterFactoryResolverSettings<TAdapters>,
    ) {}

    setNamespace(namespace: INamespace): RateLimiterFactoryResolver<TAdapters> {
        return new RateLimiterFactoryResolver({
            ...this.settings,
            namespace,
        });
    }

    setEventBus(eventBus: IEventBus): RateLimiterFactoryResolver<TAdapters> {
        return new RateLimiterFactoryResolver({
            ...this.settings,
            eventBus,
        });
    }

    setOnlyError(onlyError?: boolean): RateLimiterFactoryResolver<TAdapters> {
        return new RateLimiterFactoryResolver({
            ...this.settings,
            onlyError,
        });
    }

    setDefaultErrorPolicy(
        errorPolicy: ErrorPolicy,
    ): RateLimiterFactoryResolver<TAdapters> {
        return new RateLimiterFactoryResolver({
            ...this.settings,
            defaultErrorPolicy: errorPolicy,
        });
    }

    setWaitUntil(waitUntil: WaitUntil): RateLimiterFactoryResolver<TAdapters> {
        return new RateLimiterFactoryResolver({
            ...this.settings,
            waitUntil,
        });
    }

    setExecutionContext(
        executionContext: IExecutionContext,
    ): RateLimiterFactoryResolver<TAdapters> {
        return new RateLimiterFactoryResolver({
            ...this.settings,
            executionContext,
        });
    }

    /**
     * @example
     * ```ts
     * import { RateLimiterFactoryResolver } from "@daiso-tech/core/rate-limiter";
     * import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storate-adapter";
     * import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
     * import { RedisRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/redis-rate-limiter-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Redis from "ioredis"
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const rateLimiterFactoryResolver = new RateLimiterFactoryResolver({
     *   serde,
     *   adapters: {
     *     memory: new DatabaseRateLimiterAdapter({
     *       adapter: new MemoryRateLimiterStorageAdapter()
     *     }),
     *     redis: new RedisRateLimiterAdapter({
     *       database: new Redis("YOUR_REDIS_CONNECTION")
     *     }),
     *   },
     *   defaultAdapter: "memory",
     * });
     *
     * // Will apply rate limiter logic the default adapter which is MemoryRateLimiterStorageAdapter
     * await rateLimiterFactoryResolver
     *   .use()
     *   .create("a")
     *   .runOrFail(async () => {
     *     // ... code to apply rate limiter logic
     *   });
     *
     * // Will apply rate limiter logic the default adapter which is RedisRateLimiterAdapter
     * await rateLimiterFactoryResolver
     *   .use("redis")
     *   .create("a")
     *   .runOrFail(async () => {
     *     // ... code to apply rate limiter logic
     *   });
     * ```
     */
    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): IRateLimiterFactory {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                RateLimiterFactoryResolver.name,
            );
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(adapterName);
        }
        return new RateLimiterFactory({
            ...this.settings,
            adapter,
        });
    }
}
