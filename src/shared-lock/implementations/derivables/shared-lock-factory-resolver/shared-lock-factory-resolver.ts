/**
 * @module SharedLock
 */
import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import {
    type ISharedLockFactoryResolver,
    type ISharedLockFactory,
    type SharedLockAdapterVariants,
} from "@/shared-lock/contracts/_module.js";
import {
    SharedLockFactory,
    type SharedLockFactorySettingsBase,
} from "@/shared-lock/implementations/derivables/shared-lock-factory/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
    type Invokable,
    type WaitUntil,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock"`
 * @group Derivables
 */
export type SharedLockAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, SharedLockAdapterVariants>
>;

/**
 * Configuration for `SharedLockFactoryResolver`.
 * Registers named shared-lock adapters and optionally designates a default.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock"`
 * @group Derivables
 */
export type SharedLockFactoryResolverSettings<TAdapters extends string> =
    SharedLockFactorySettingsBase & {
        /**
         * Named registry of shared-lock adapters. Each key is an adapter alias and the corresponding value is the adapter instance.
         */
        adapters: SharedLockAdapters<TAdapters>;

        /**
         * The alias of the adapter to use when none is explicitly specified. Must be a key in the `adapters` map.
         */
        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * The `SharedLockFactoryResolver` class is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock"`
 * @group Derivables
 */
export class SharedLockFactoryResolver<TAdapters extends string>
    implements ISharedLockFactoryResolver<TAdapters>
{
    /**
     * @example
     * ```ts
     * import { SharedLockFactoryResolver } from "@daiso-tech/core/shared-lock";
     * import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";
     * import { RedisSharedLockAdapter } from "@daiso-tech/core/shared-lock/redis-shared-lock-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Redis from "ioredis"
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const lockProviderFactory = new SharedLockFactoryResolver({
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
        private readonly settings: SharedLockFactoryResolverSettings<TAdapters>,
    ) {}

    setNamespace(namespace: INamespace): SharedLockFactoryResolver<TAdapters> {
        return new SharedLockFactoryResolver({
            ...this.settings,
            namespace,
        });
    }

    setCreateLockId(
        createId: Invokable<[], string>,
    ): SharedLockFactoryResolver<TAdapters> {
        return new SharedLockFactoryResolver({
            ...this.settings,
            createLockId: createId,
        });
    }

    setEventBus(eventBus: IEventBus): SharedLockFactoryResolver<TAdapters> {
        return new SharedLockFactoryResolver({
            ...this.settings,
            eventBus,
        });
    }

    setDefaultTtl(ttl: ITimeSpan | null): SharedLockFactoryResolver<TAdapters> {
        return new SharedLockFactoryResolver({
            ...this.settings,
            defaultTtl: ttl,
        });
    }

    setDefaultRefreshTime(
        time: ITimeSpan,
    ): SharedLockFactoryResolver<TAdapters> {
        return new SharedLockFactoryResolver({
            ...this.settings,
            defaultRefreshTime: time,
        });
    }

    setWaitUntil(waitUntil: WaitUntil): SharedLockFactoryResolver<TAdapters> {
        return new SharedLockFactoryResolver({
            ...this.settings,
            waitUntil,
        });
    }

    setExecutionContext(
        executionContext: IExecutionContext,
    ): SharedLockFactoryResolver<TAdapters> {
        return new SharedLockFactoryResolver({
            ...this.settings,
            executionContext,
        });
    }

    /**
     * @example
     * ```ts
     * import { SharedLockFactoryResolver } from "@daiso-tech/core/shared-lock";
     * import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";
     * import { RedisSharedLockAdapter } from "@daiso-tech/core/shared-lock/redis-shared-lock-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     * import Redis from "ioredis";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const lockProviderFactory = new SharedLockFactoryResolver({
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
    ): ISharedLockFactory {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                SharedLockFactoryResolver.name,
            );
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(adapterName);
        }
        return new SharedLockFactory({
            ...this.settings,
            adapter,
            serdeTransformerName: adapterName,
        });
    }
}
