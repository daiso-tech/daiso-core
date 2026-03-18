/**
 * @module SharedLock
 */
import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import {
    type ISharedLockProviderFactory,
    type ISharedLockProvider,
    type SharedLockAdapterVariants,
} from "@/shared-lock/contracts/_module.js";
import {
    SharedLockProvider,
    type SharedLockProviderSettingsBase,
} from "@/shared-lock/implementations/derivables/shared-lock-provider/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
    type Invokable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock"`
 * @group Derivables
 */
export type SharedLockAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, SharedLockAdapterVariants>
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock"`
 * @group Derivables
 */
export type SharedLockProviderFactorySettings<TAdapters extends string> =
    SharedLockProviderSettingsBase & {
        adapters: SharedLockAdapters<TAdapters>;

        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * The `SharedLockProviderFactory` class is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock"`
 * @group Derivables
 */
export class SharedLockProviderFactory<TAdapters extends string>
    implements ISharedLockProviderFactory<TAdapters>
{
    /**
     * @example
     * ```ts
     * import { SharedLockProviderFactory } from "@daiso-tech/core/shared-lock";
     * import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";
     * import { RedisSharedLockAdapter } from "@daiso-tech/core/shared-lock/redis-shared-lock-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Redis from "ioredis"
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const lockProviderFactory = new SharedLockProviderFactory({
     *   serde,
     *   adapters: {
     *     memory: new MemorySharedLockAdapter(),
     *     redis: new RedisSharedLockAdapter(new Redis("YOUR_REDIS_CONNECTION")),
     *   },
     *   defaultAdapter: "memory",
     * });
     * ```
     */
    constructor(
        private readonly settings: SharedLockProviderFactorySettings<TAdapters>,
    ) {}

    setNamespace(namespace: INamespace): SharedLockProviderFactory<TAdapters> {
        return new SharedLockProviderFactory({
            ...this.settings,
            namespace,
        });
    }

    setCreateLockId(
        createId: Invokable<[], string>,
    ): SharedLockProviderFactory<TAdapters> {
        return new SharedLockProviderFactory({
            ...this.settings,
            createLockId: createId,
        });
    }

    setEventBus(eventBus: IEventBus): SharedLockProviderFactory<TAdapters> {
        return new SharedLockProviderFactory({
            ...this.settings,
            eventBus,
        });
    }

    setDefaultTtl(ttl: ITimeSpan): SharedLockProviderFactory<TAdapters> {
        return new SharedLockProviderFactory({
            ...this.settings,
            defaultTtl: ttl,
        });
    }

    setDefaultBlockingInterval(
        interval: ITimeSpan,
    ): SharedLockProviderFactory<TAdapters> {
        return new SharedLockProviderFactory({
            ...this.settings,
            defaultBlockingInterval: interval,
        });
    }

    setDefaultBlockingTime(
        time: ITimeSpan,
    ): SharedLockProviderFactory<TAdapters> {
        return new SharedLockProviderFactory({
            ...this.settings,
            defaultBlockingTime: time,
        });
    }

    setDefaultRefreshTime(
        time: ITimeSpan,
    ): SharedLockProviderFactory<TAdapters> {
        return new SharedLockProviderFactory({
            ...this.settings,
            defaultRefreshTime: time,
        });
    }

    /**
     * @example
     * ```ts
     * import { SharedLockProviderFactory } from "@daiso-tech/core/shared-lock";
     * import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";
     * import { RedisSharedLockAdapter } from "@daiso-tech/core/shared-lock/redis-shared-lock-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import { TimeSpan } from "@daiso-tech/core/time-span" from "@daiso-tech/core/time-span";
     * import Redis from "ioredis";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const lockProviderFactory = new SharedLockProviderFactory({
     *   serde,
     *   adapters: {
     *     memory: new MemorySharedLockAdapter(),
     *     redis: new RedisSharedLockAdapter(new Redis("YOUR_REDIS_CONNECTION")),
     *   },
     *   defaultAdapter: "memory",
     * });
     *
     * // Will acquire key using the default adapter which is MemorySharedLockAdapter
     * await lockProviderFactory
     *   .use()
     *   .create("a")
     *   .acquireWriter();
     *
     * // Will acquire key using the redis adapter
     * await lockProviderFactory
     *   .use("redis")
     *   .create("a")
     *   .acquireWriter();
     * ```
     */
    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): ISharedLockProvider {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                SharedLockProviderFactory.name,
            );
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(adapterName);
        }
        return new SharedLockProvider({
            ...this.settings,
            adapter,
            serdeTransformerName: adapterName,
        });
    }
}
