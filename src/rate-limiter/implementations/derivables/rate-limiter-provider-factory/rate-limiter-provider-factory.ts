/**
 * @module RateLimiter
 */

import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import {
    type IRateLimiterProviderFactory,
    type IRateLimiterProvider,
    type IRateLimiterAdapter,
} from "@/rate-limiter/contracts/_module.js";
import {
    RateLimiterProvider,
    type RateLimiterProviderSettingsBase,
} from "@/rate-limiter/implementations/derivables/rate-limiter-provider/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    UnregisteredAdapterError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    DefaultAdapterNotDefinedError,
    type ErrorPolicy,
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
export type RateLimiterProviderFactorySettings<TAdapters extends string> =
    RateLimiterProviderSettingsBase & {
        adapters: RateLimiterAdapters<TAdapters>;

        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * The `RateLimiterProviderFactory` class is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter"`
 * @group Derivables
 */
export class RateLimiterProviderFactory<TAdapters extends string>
    implements IRateLimiterProviderFactory<TAdapters>
{
    /**
     * @example
     * ```ts
     * import { RateLimiterProviderFactory } from "@daiso-tech/core/rate-limiter";
     * import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storate-adapter";
     * import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
     * import { RedisRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/redis-rate-limiter-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Redis from "ioredis"
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const rateLimiterProviderFactory = new RateLimiterProviderFactory({
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
        private readonly settings: RateLimiterProviderFactorySettings<TAdapters>,
    ) {}

    setNamespace(namespace: INamespace): RateLimiterProviderFactory<TAdapters> {
        return new RateLimiterProviderFactory({
            ...this.settings,
            namespace,
        });
    }

    setEventBus(eventBus: IEventBus): RateLimiterProviderFactory<TAdapters> {
        return new RateLimiterProviderFactory({
            ...this.settings,
            eventBus,
        });
    }

    setOnlyError(onlyError?: boolean): RateLimiterProviderFactory<TAdapters> {
        return new RateLimiterProviderFactory({
            ...this.settings,
            onlyError,
        });
    }

    setDefaultErrorPolicy(
        errorPolicy: ErrorPolicy,
    ): RateLimiterProviderFactory<TAdapters> {
        return new RateLimiterProviderFactory({
            ...this.settings,
            defaultErrorPolicy: errorPolicy,
        });
    }

    /**
     * @example
     * ```ts
     * import { RateLimiterProviderFactory } from "@daiso-tech/core/rate-limiter";
     * import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storate-adapter";
     * import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
     * import { RedisRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/redis-rate-limiter-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Redis from "ioredis"
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const rateLimiterProviderFactory = new RateLimiterProviderFactory({
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
     * await rateLimiterProviderFactory
     *   .use()
     *   .create("a")
     *   .runOrFail(async () => {
     *     // ... code to apply rate limiter logic
     *   });
     *
     * // Will apply rate limiter logic the default adapter which is RedisRateLimiterAdapter
     * await rateLimiterProviderFactory
     *   .use("redis")
     *   .create("a")
     *   .runOrFail(async () => {
     *     // ... code to apply rate limiter logic
     *   });
     * ```
     */
    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): IRateLimiterProvider {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                RateLimiterProviderFactory.name,
            );
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(adapterName);
        }
        return new RateLimiterProvider({
            ...this.settings,
            adapter,
        });
    }
}
