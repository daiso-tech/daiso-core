/**
 * @module Lock
 */
import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import {
    type ILockFactoryResolver,
    type ILockFactory,
    type LockAdapterVariants,
} from "@/lock/contracts/_module.js";
import {
    LockFactory,
    type LockFactorySettingsBase,
} from "@/lock/implementations/derivables/lock-factory/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
    type Invokable,
    type WaitUntil,
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
export type LockFactoryResolverSettings<TAdapters extends string> =
    LockFactorySettingsBase & {
        adapters: LockAdapters<TAdapters>;

        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * The `LockFactoryResolver` class is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock"`
 * @group Derivables
 */
export class LockFactoryResolver<TAdapters extends string>
    implements ILockFactoryResolver<TAdapters>
{
    /**
     * @example
     * ```ts
     * import { LockFactoryResolver } from "@daiso-tech/core/lock";
     * import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";
     * import { RedisLockAdapter } from "@daiso-tech/core/lock/redis-lock-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Redis from "ioredis"
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const lockFactoryResolver = new LockFactoryResolver({
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
        private readonly settings: LockFactoryResolverSettings<TAdapters>,
    ) {}

    setNamespace(namespace: INamespace): LockFactoryResolver<TAdapters> {
        return new LockFactoryResolver({
            ...this.settings,
            namespace,
        });
    }

    setCreateLockId(
        createId: Invokable<[], string>,
    ): LockFactoryResolver<TAdapters> {
        return new LockFactoryResolver({
            ...this.settings,
            createLockId: createId,
        });
    }

    setEventBus(eventBus: IEventBus): LockFactoryResolver<TAdapters> {
        return new LockFactoryResolver({
            ...this.settings,
            eventBus,
        });
    }

    setDefaultTtl(ttl: ITimeSpan | null): LockFactoryResolver<TAdapters> {
        return new LockFactoryResolver({
            ...this.settings,
            defaultTtl: ttl,
        });
    }

    setDefaultBlockingInterval(
        interval: ITimeSpan,
    ): LockFactoryResolver<TAdapters> {
        return new LockFactoryResolver({
            ...this.settings,
            defaultBlockingInterval: interval,
        });
    }

    setDefaultBlockingTime(time: ITimeSpan): LockFactoryResolver<TAdapters> {
        return new LockFactoryResolver({
            ...this.settings,
            defaultBlockingTime: time,
        });
    }

    setDefaultRefreshTime(time: ITimeSpan): LockFactoryResolver<TAdapters> {
        return new LockFactoryResolver({
            ...this.settings,
            defaultRefreshTime: time,
        });
    }

    setWaitUntil(waitUntil: WaitUntil): LockFactoryResolver<TAdapters> {
        return new LockFactoryResolver({
            ...this.settings,
            waitUntil,
        });
    }

    setExecutionContext(
        executionContext: IExecutionContext,
    ): LockFactoryResolver<TAdapters> {
        return new LockFactoryResolver({
            ...this.settings,
            executionContext,
        });
    }

    /**
     * @example
     * ```ts
     * import { LockFactoryResolver } from "@daiso-tech/core/lock";
     * import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";
     * import { RedisLockAdapter } from "@daiso-tech/core/lock/redis-lock-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     * import Redis from "ioredis";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const lockFactoryResolver = new LockFactoryResolver({
     *   serde,
     *   adapters: {
     *     memory: new MemoryLockAdapter(),
     *     redis: new RedisLockAdapter(new Redis("YOUR_REDIS_CONNECTION")),
     *   },
     *   defaultAdapter: "memory",
     * });
     *
     * // Will acquire key using the default adapter which is MemoryLockAdapter
     * await lockFactoryResolver
     *   .use()
     *   .create("a")
     *   .acquire();
     *
     * // Will acquire key using the redis adapter
     * await lockFactoryResolver
     *   .use("redis")
     *   .create("a")
     *   .acquire();
     * ```
     */
    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): ILockFactory {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(LockFactoryResolver.name);
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(adapterName);
        }
        return new LockFactory({
            ...this.settings,
            adapter,
            serdeTransformerName: adapterName,
        });
    }
}
