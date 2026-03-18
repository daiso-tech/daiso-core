/**
 * @module Semaphore
 */
import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import {
    type ISemaphoreProviderFactory,
    type ISemaphoreProvider,
    type SemaphoreAdapterVariants,
} from "@/semaphore/contracts/_module.js";
import {
    SemaphoreProvider,
    type SemaphoreProviderSettingsBase,
} from "@/semaphore/implementations/derivables/semaphore-provider/_module.js";
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
export type SemaphoreProviderFactorySettings<TAdapters extends string> =
    SemaphoreProviderSettingsBase & {
        adapters: SemaphoreAdapters<TAdapters>;

        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * The `SemaphoreProviderFactory` class is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore"`
 * @group Derivables
 */
export class SemaphoreProviderFactory<TAdapters extends string>
    implements ISemaphoreProviderFactory<TAdapters>
{
    /**
     * @example
     * ```ts
     * import { SemaphoreProviderFactory } from "@daiso-tech/core/semaphore";
     * import { MemorySemaphoreAdapter } from "@daiso-tech/core/semaphore/memory-semaphore-adapter";
     * import { RedisSemaphoreAdapter } from "@daiso-tech/core/semaphore/redis-semaphore-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Redis from "ioredis"
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const semaphoreProviderFactory = new SemaphoreProviderFactory({
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
        private readonly settings: SemaphoreProviderFactorySettings<TAdapters>,
    ) {}

    setNamespace(namespace: INamespace): SemaphoreProviderFactory<TAdapters> {
        return new SemaphoreProviderFactory({
            ...this.settings,
            namespace,
        });
    }

    setEventBus(eventBus: IEventBus): SemaphoreProviderFactory<TAdapters> {
        return new SemaphoreProviderFactory({
            ...this.settings,
            eventBus,
        });
    }

    setDefaultTtl(ttl: ITimeSpan): SemaphoreProviderFactory<TAdapters> {
        return new SemaphoreProviderFactory({
            ...this.settings,
            defaultTtl: ttl,
        });
    }

    setDefaultBlockingInterval(
        interval: ITimeSpan,
    ): SemaphoreProviderFactory<TAdapters> {
        return new SemaphoreProviderFactory({
            ...this.settings,
            defaultBlockingInterval: interval,
        });
    }

    setDefaultBlockingTime(
        time: ITimeSpan,
    ): SemaphoreProviderFactory<TAdapters> {
        return new SemaphoreProviderFactory({
            ...this.settings,
            defaultBlockingTime: time,
        });
    }

    setDefaultRefreshTime(
        time: ITimeSpan,
    ): SemaphoreProviderFactory<TAdapters> {
        return new SemaphoreProviderFactory({
            ...this.settings,
            defaultRefreshTime: time,
        });
    }
    /**
     * @example
     * ```ts
     * import { SemaphoreProviderFactory } from "@daiso-tech/core/semaphore";
     * import { MemorySemaphoreAdapter } from "@daiso-tech/core/semaphore/memory-semaphore-adapter";
     * import { RedisSemaphoreAdapter } from "@daiso-tech/core/semaphore/redis-semaphore-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import { TimeSpan } from "@daiso-tech/core/time-span" from "@daiso-tech/core/time-span";
     * import Redis from "ioredis";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const semaphoreProviderFactory = new SemaphoreProviderFactory({
     *   serde,
     *   adapters: {
     *     memory: new MemorySemaphoreAdapter(),
     *     redis: new RedisSemaphoreAdapter(new Redis("YOUR_REDIS_CONNECTION")),
     *   },
     *   defaultAdapter: "memory",
     * });
     *
     * // Will acquire key using the default adapter which is MemorySemaphoreAdapter
     * await semaphoreProviderFactory
     *   .use()
     *   .create("a")
     *   .acquire();
     *
     * // Will acquire key using the redis adapter
     * await semaphoreProviderFactory
     *   .use("redis")
     *   .create("a")
     *   .acquire();
     * ```
     */
    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): ISemaphoreProvider {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                SemaphoreProviderFactory.name,
            );
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(adapterName);
        }
        return new SemaphoreProvider({
            ...this.settings,
            adapter,
            serdeTransformerName: adapterName,
        });
    }
}
