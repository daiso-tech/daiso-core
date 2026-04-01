/**
 * @module SharedLock
 */

import { v4 } from "uuid";

import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { NoOpNamespace } from "@/namespace/implementations/_module.js";
import { type ISerderRegister } from "@/serde/contracts/_module.js";
import { NoOpSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import {
    type ISharedLock,
    type ISharedLockAdapter,
    type SharedLockEventMap,
    type SharedLockFactoryCreateSettings,
    type ISharedLockFactory,
    type SharedLockAdapterVariants,
    type ISharedLockListenable,
} from "@/shared-lock/contracts/_module.js";
import { resolveSharedLockAdapter } from "@/shared-lock/implementations/derivables/shared-lock-factory/resolve-shared-lock-adapter.js";
import { SharedLockSerdeTransformer } from "@/shared-lock/implementations/derivables/shared-lock-factory/shared-lock-serde-transformer.js";
import { SharedLock } from "@/shared-lock/implementations/derivables/shared-lock-factory/shared-lock.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    CORE,
    resolveOneOrMore,
    type Invokable,
    callInvokable,
    type OneOrMore,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock"`
 * @group Derivables
 */
export type SharedLockFactorySettingsBase = {
    /**
     * @default
     * ```ts
     * import { NoOpNamespace } from "@daiso-tech/core/namespace";
     *
     * new NoOpNamespace()
     * ```
     */
    namespace?: INamespace;

    /**
     * @default
     * ```ts
     * import { Serde } from "@daiso-tech/serde";
     * import { NoOpSerdeAdapter } from "@daiso-tech/serde/no-op-serde-adapter";
     *
     * new Serde(new NoOpSerdeAdapter())
     * ```
     */
    serde?: OneOrMore<ISerderRegister>;

    /**
     * @default ""
     */
    serdeTransformerName?: string;

    /**
     * You can pass your lock id id generator function.
     * @default
     * ```ts
     * import { v4 } from "uuid";
     *
     * () => v4
     */
    createLockId?: Invokable<[], string>;

    /**
     * @default
     * ```ts
     * import { EventBus } from "@daiso-tech/core/event-bus";
     * import { NoOpEventBusAdapter } from "@daiso-tech/core/event-bus/no-op-event-bus-adapter";
     *
     * new EventBus({
     *   adapter: new NoOpEventBusAdapter()
     * })
     * ```
     */
    eventBus?: IEventBus;

    /**
     * You can decide the default ttl value for {@link ISharedLock | `ISharedLock`} expiration. If null is passed then no ttl will be used by default.
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromMinutes(5);
     * ```
     */
    defaultTtl?: ITimeSpan | null;

    /**
     * The default refresh time used in the {@link ISharedLock | `ISharedLock`} `acquireBlocking` and `runBlocking` methods.
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromSeconds(1);
     * ```
     */
    defaultBlockingInterval?: ITimeSpan;

    /**
     * The default refresh time used in the {@link ISharedLock | `ISharedLock`} `acquireBlocking` and `runBlocking` methods.
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromMinutes(1);
     * ```
     */
    defaultBlockingTime?: ITimeSpan;

    /**
     * The default refresh time used in the {@link ISharedLock | `ISharedLock`} `refresh` method.
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromMinutes(5);
     * ```
     */
    defaultRefreshTime?: ITimeSpan;

    /**
     * @default
     * ```ts
     * (promise) => promise.then(() => {})
     * ```
     */
    waitUntil?: Invokable<[promise: PromiseLike<unknown>], void>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock"`
 * @group Derivables
 */
export type SharedLockFactorySettings = SharedLockFactorySettingsBase & {
    adapter: SharedLockAdapterVariants;
};

/**
 * `SharedLockFactory` class can be derived from any {@link ISharedLockAdapter | `ISharedLockAdapter`} or {@link IDatabaseSharedLockAdapter | `IDatabaseSharedLockAdapter`}.
 *
 * Note the {@link ISharedLock | `ISharedLock`} instances created by the `SharedLockFactory` class are serializable and deserializable,
 * allowing them to be seamlessly transferred across different servers, processes, and databases.
 * This can be done directly using {@link ISerderRegister | `ISerderRegister`} or indirectly through components that rely on {@link ISerderRegister | `ISerderRegister`} internally.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock"`
 * @group Derivables
 */
export class SharedLockFactory implements ISharedLockFactory {
    private readonly eventBus: IEventBus<SharedLockEventMap>;
    private readonly originalAdapter: SharedLockAdapterVariants;
    private readonly adapter: ISharedLockAdapter;
    private readonly namespace: INamespace;
    private readonly creatLockId: Invokable<[], string>;
    private readonly defaultTtl: TimeSpan | null;
    private readonly defaultBlockingInterval: TimeSpan;
    private readonly defaultBlockingTime: TimeSpan;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serde: OneOrMore<ISerderRegister>;
    private readonly serdeTransformerName: string;
    private readonly waitUntil: Invokable<
        [promise: PromiseLike<unknown>],
        void
    >;

    /**
     * @example
     * ```ts
     * import { KyselySharedLockAdapter } from "@daiso-tech/core/shared-lock/kysely-shared-lock-adapter";
     * import { SharedLockFactory } from "@daiso-tech/core/shared-lock";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const sharedLockAdapter = new KyselySharedLockAdapter({
     *   kysely: new Kysely({
     *     dialect: new SqliteDialect({
     *       database: new Sqlite("local.db"),
     *     }),
     *   });
     * });
     * // You need initialize the adapter once before using it.
     * await sharedLockAdapter.init();
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter())
     * const lockFactory = new SharedLockFactory({
     *   serde,
     *   adapter: sharedLockAdapter,
     * });
     * ```
     */
    constructor(settings: SharedLockFactorySettings) {
        const {
            defaultTtl = TimeSpan.fromMinutes(5),
            defaultBlockingInterval = TimeSpan.fromSeconds(1),
            defaultBlockingTime = TimeSpan.fromMinutes(1),
            defaultRefreshTime = TimeSpan.fromMinutes(5),
            createLockId = () => v4(),
            serde = new Serde(new NoOpSerdeAdapter()),
            namespace = new NoOpNamespace(),
            adapter,
            eventBus = new EventBus<any>({
                adapter: new NoOpEventBusAdapter(),
            }),
            serdeTransformerName = "",
            waitUntil = (promise) => promise.then(() => {}),
        } = settings;

        this.waitUntil = waitUntil;
        this.serde = serde;
        this.defaultBlockingInterval = TimeSpan.fromTimeSpan(
            defaultBlockingInterval,
        );
        this.defaultBlockingTime = TimeSpan.fromTimeSpan(defaultBlockingTime);
        this.defaultRefreshTime = TimeSpan.fromTimeSpan(defaultRefreshTime);
        this.creatLockId = createLockId;
        this.namespace = namespace;
        this.defaultTtl =
            defaultTtl === null ? null : TimeSpan.fromTimeSpan(defaultTtl);
        this.eventBus = eventBus;
        this.serdeTransformerName = serdeTransformerName;

        this.originalAdapter = adapter;
        this.adapter = resolveSharedLockAdapter(adapter);
        this.registerToSerde();
    }

    private registerToSerde(): void {
        const transformer = new SharedLockSerdeTransformer({
            waitUntil: this.waitUntil,
            originalAdapter: this.originalAdapter,
            adapter: this.adapter,
            defaultBlockingInterval: this.defaultBlockingInterval,
            defaultBlockingTime: this.defaultBlockingTime,
            defaultRefreshTime: this.defaultRefreshTime,
            eventBus: this.eventBus,
            namespace: this.namespace,
            serdeTransformerName: this.serdeTransformerName,
        });
        for (const serde of resolveOneOrMore(this.serde)) {
            serde.registerCustom(transformer, CORE);
        }
    }

    get events(): ISharedLockListenable {
        return this.eventBus;
    }

    /**
     * @example
     * ```ts
     * import { SharedLockFactory } from "@daiso-tech/core/shared-lock";
     * import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";
     * import { Namespace } from "@daiso-tech/core/namespace";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     *
     * const lockFactory = new SharedLockFactory({
     *   adapter: new MemorySharedLockAdapter(),
     *   namespace: new Namespace("shared_lock"),
     *   serde: new Serde(new SuperJsonSerdeAdapter())
     * });
     *
     * const sharedLock = lockFactory.create("a");
     * ```
     */
    create(
        key: string,
        settings: SharedLockFactoryCreateSettings,
    ): ISharedLock {
        const {
            ttl = this.defaultTtl,
            lockId = callInvokable(this.creatLockId),
            limit,
        } = settings;

        const keyObj = this.namespace.create(key);

        return new SharedLock({
            waitUntil: this.waitUntil,
            limit,
            namespace: this.namespace,
            adapter: this.adapter,
            originalAdapter: this.originalAdapter,
            eventDispatcher: this.eventBus,
            key: keyObj,
            lockId,
            ttl: ttl === null ? null : TimeSpan.fromTimeSpan(ttl),
            serdeTransformerName: this.serdeTransformerName,
            defaultBlockingInterval: this.defaultBlockingInterval,
            defaultBlockingTime: this.defaultBlockingTime,
            defaultRefreshTime: this.defaultRefreshTime,
        });
    }
}
