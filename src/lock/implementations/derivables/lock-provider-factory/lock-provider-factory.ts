/**
 * @module Lock
 */
import { type IEventBus } from "@/event-bus/contracts/_module.js";
import {
    type ILockProviderFactory,
    type ILockProvider,
    type LockAdapterVariants,
} from "@/lock/contracts/_module.js";
import {
    LockProvider,
    type LockProviderSettingsBase,
} from "@/lock/implementations/derivables/lock-provider/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
    type Invokable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock"`
 * @group Derivables
 */
export type LockAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, LockAdapterVariants>
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock"`
 * @group Derivables
 */
export type LockProviderFactorySettings<TAdapters extends string> =
    LockProviderSettingsBase & {
        adapters: LockAdapters<TAdapters>;

        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * The `LockProviderFactory` class is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock"`
 * @group Derivables
 */
export class LockProviderFactory<TAdapters extends string>
    implements ILockProviderFactory<TAdapters>
{
    /**
     * @example
     * ```ts
     * import { LockProviderFactory } from "@daiso-tech/core/lock";
     * import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";
     * import { RedisLockAdapter } from "@daiso-tech/core/lock/redis-lock-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Redis from "ioredis"
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const lockProviderFactory = new LockProviderFactory({
     *   serde,
     *   adapters: {
     *     memory: new MemoryLockAdapter(),
     *     redis: new RedisLockAdapter(new Redis("YOUR_REDIS_CONNECTION")),
     *   },
     *   defaultAdapter: "memory",
     * });
     * ```
     */
    constructor(
        private readonly settings: LockProviderFactorySettings<TAdapters>,
    ) {}

    setNamespace(namespace: INamespace): LockProviderFactory<TAdapters> {
        return new LockProviderFactory({
            ...this.settings,
            namespace,
        });
    }

    setCreateLockId(
        createId: Invokable<[], string>,
    ): LockProviderFactory<TAdapters> {
        return new LockProviderFactory({
            ...this.settings,
            createLockId: createId,
        });
    }

    setEventBus(eventBus: IEventBus): LockProviderFactory<TAdapters> {
        return new LockProviderFactory({
            ...this.settings,
            eventBus,
        });
    }

    setDefaultTtl(ttl: ITimeSpan): LockProviderFactory<TAdapters> {
        return new LockProviderFactory({
            ...this.settings,
            defaultTtl: ttl,
        });
    }

    setDefaultBlockingInterval(
        interval: ITimeSpan,
    ): LockProviderFactory<TAdapters> {
        return new LockProviderFactory({
            ...this.settings,
            defaultBlockingInterval: interval,
        });
    }

    setDefaultBlockingTime(time: ITimeSpan): LockProviderFactory<TAdapters> {
        return new LockProviderFactory({
            ...this.settings,
            defaultBlockingTime: time,
        });
    }

    setDefaultRefreshTime(time: ITimeSpan): LockProviderFactory<TAdapters> {
        return new LockProviderFactory({
            ...this.settings,
            defaultRefreshTime: time,
        });
    }

    /**
     * @example
     * ```ts
     * import { LockProviderFactory } from "@daiso-tech/core/lock";
     * import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";
     * import { RedisLockAdapter } from "@daiso-tech/core/lock/redis-lock-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import { TimeSpan } from "@daiso-tech/core/time-span" from "@daiso-tech/core/time-span";
     * import Redis from "ioredis";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const lockProviderFactory = new LockProviderFactory({
     *   serde,
     *   adapters: {
     *     memory: new MemoryLockAdapter(),
     *     redis: new RedisLockAdapter(new Redis("YOUR_REDIS_CONNECTION")),
     *   },
     *   defaultAdapter: "memory",
     * });
     *
     * // Will acquire key using the default adapter which is MemoryLockAdapter
     * await lockProviderFactory
     *   .use()
     *   .create("a")
     *   .acquire();
     *
     * // Will acquire key using the redis adapter
     * await lockProviderFactory
     *   .use("redis")
     *   .create("a")
     *   .acquire();
     * ```
     */
    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): ILockProvider {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(LockProviderFactory.name);
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(adapterName);
        }
        return new LockProvider({
            ...this.settings,
            adapter,
            serdeTransformerName: adapterName,
        });
    }
}
