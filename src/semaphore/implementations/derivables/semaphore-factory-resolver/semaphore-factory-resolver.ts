/**
 * @module Semaphore
 */
import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import {
    type ISemaphoreFactoryResolver,
    type ISemaphoreFactory,
    type SemaphoreAdapterVariants,
} from "@/semaphore/contracts/_module.js";
import {
    SemaphoreFactory,
    type SemaphoreFactorySettingsBase,
} from "@/semaphore/implementations/derivables/semaphore-factory/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore"`
 * @group Derivables
 */
export type SemaphoreAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, SemaphoreAdapterVariants>
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore"`
 * @group Derivables
 */
export type SemaphoreFactoryResolverSettings<TAdapters extends string> =
    SemaphoreFactorySettingsBase & {
        adapters: SemaphoreAdapters<TAdapters>;

        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * The `SemaphoreFactoryResolver` class is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore"`
 * @group Derivables
 */
export class SemaphoreFactoryResolver<TAdapters extends string>
    implements ISemaphoreFactoryResolver<TAdapters>
{
    /**
     * @example
     * ```ts
     * import { SemaphoreFactoryResolver } from "@daiso-tech/core/semaphore";
     * import { MemorySemaphoreAdapter } from "@daiso-tech/core/semaphore/memory-semaphore-adapter";
     * import { RedisSemaphoreAdapter } from "@daiso-tech/core/semaphore/redis-semaphore-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Redis from "ioredis"
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const semaphoreFactoryResolver = new SemaphoreFactoryResolver({
     *   serde,
     *   adapters: {
     *     memory: new MemorySemaphoreAdapter(),
     *     redis: new RedisSemaphoreAdapter(new Redis("YOUR_REDIS_CONNECTION")),
     *   },
     *   defaultAdapter: "memory",
     * });
     * ```
     */
    constructor(
        private readonly settings: SemaphoreFactoryResolverSettings<TAdapters>,
    ) {}

    setNamespace(namespace: INamespace): SemaphoreFactoryResolver<TAdapters> {
        return new SemaphoreFactoryResolver({
            ...this.settings,
            namespace,
        });
    }

    setEventBus(eventBus: IEventBus): SemaphoreFactoryResolver<TAdapters> {
        return new SemaphoreFactoryResolver({
            ...this.settings,
            eventBus,
        });
    }

    setDefaultTtl(ttl: ITimeSpan | null): SemaphoreFactoryResolver<TAdapters> {
        return new SemaphoreFactoryResolver({
            ...this.settings,
            defaultTtl: ttl,
        });
    }

    setDefaultBlockingInterval(
        interval: ITimeSpan,
    ): SemaphoreFactoryResolver<TAdapters> {
        return new SemaphoreFactoryResolver({
            ...this.settings,
            defaultBlockingInterval: interval,
        });
    }

    setDefaultBlockingTime(
        time: ITimeSpan,
    ): SemaphoreFactoryResolver<TAdapters> {
        return new SemaphoreFactoryResolver({
            ...this.settings,
            defaultBlockingTime: time,
        });
    }

    setDefaultRefreshTime(
        time: ITimeSpan,
    ): SemaphoreFactoryResolver<TAdapters> {
        return new SemaphoreFactoryResolver({
            ...this.settings,
            defaultRefreshTime: time,
        });
    }
    /**
     * @example
     * ```ts
     * import { SemaphoreFactoryResolver } from "@daiso-tech/core/semaphore";
     * import { MemorySemaphoreAdapter } from "@daiso-tech/core/semaphore/memory-semaphore-adapter";
     * import { RedisSemaphoreAdapter } from "@daiso-tech/core/semaphore/redis-semaphore-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import { TimeSpan } from "@daiso-tech/core/time-span" from "@daiso-tech/core/time-span";
     * import Redis from "ioredis";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const semaphoreFactoryResolver = new SemaphoreFactoryResolver({
     *   serde,
     *   adapters: {
     *     memory: new MemorySemaphoreAdapter(),
     *     redis: new RedisSemaphoreAdapter(new Redis("YOUR_REDIS_CONNECTION")),
     *   },
     *   defaultAdapter: "memory",
     * });
     *
     * // Will acquire key using the default adapter which is MemorySemaphoreAdapter
     * await semaphoreFactoryResolver
     *   .use()
     *   .create("a")
     *   .acquire();
     *
     * // Will acquire key using the redis adapter
     * await semaphoreFactoryResolver
     *   .use("redis")
     *   .create("a")
     *   .acquire();
     * ```
     */
    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): ISemaphoreFactory {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                SemaphoreFactoryResolver.name,
            );
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(adapterName);
        }
        return new SemaphoreFactory({
            ...this.settings,
            adapter,
            serdeTransformerName: adapterName,
        });
    }
}
