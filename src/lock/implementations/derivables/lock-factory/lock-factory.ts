/**
 * @module Lock
 */

import { v4 } from "uuid";

import {
    type EventBusInput,
    type IEventBus,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type IEventBusAdapter,
} from "@/event-bus/contracts/_module.js";
import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { resolveEventBusInput } from "@/event-bus/implementations/derivables/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    type ILock,
    type LockFactoryCreateSettings,
    type ILockFactory,
    type ILockAdapter,

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type IDatabaseLockAdapter,
    type LockAdapterVariants,
    type LockEventMap,
    type ILockListenable,
} from "@/lock/contracts/_module.js";
import { LockSerdeTransformer } from "@/lock/implementations/derivables/lock-factory/lock-serde-transformer.js";
import { Lock } from "@/lock/implementations/derivables/lock-factory/lock.js";
import { resolveLockAdapter } from "@/lock/implementations/derivables/lock-factory/resolve-lock-adapter.js";
import { useFactory, type Use } from "@/middleware/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { NoOpNamespace } from "@/namespace/implementations/_module.js";
import { type ISerderRegister } from "@/serde/contracts/_module.js";
import { NoOpSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    type OneOrMore,
    CORE,
    resolveOneOrMore,
    type Invokable,
    callInvokable,
    type WaitUntil,
    defaultWaitUntil,
} from "@/utilities/_module.js";

/**
 * Base configuration shared by all `LockFactory` variants.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock"`
 * @group Derivables
 */
export type LockFactorySettingsBase = {
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
     * You can pass an {@link ISerderRegister | `ISerderRegister`} instance to the {@link LockFactory | `LockFactory`} to register the lock's serialization and deserialization logic for the provided adapter.
     * @default
     * ```ts
     * import { Serde } from "@daiso-tech/core/serde";
     * import { NoOpSerdeAdapter } from "@daiso-tech/core/serde/no-op-serde-adapter";
     *
     * new Serde(new NoOpSerdeAdapter())
     * ```
     */
    serde?: OneOrMore<ISerderRegister>;

    /**
     * The registered serde transformer name used to identify lock serializer and deserializer adapters when there are adapters with the same name.
     * @default ""
     */
    serdeTransformerName?: string;

    /**
     * You can pass your own lock id generator function.
     * @default
     * ```ts
     * import { v4 } from "uuid";
     *
     * () => v4()
     */
    createLockId?: Invokable<[], string>;

    /**
     * You can provide an {@link IEventBus | `IEventBus`} or an {@link IEventBusAdapter | `IEventBusAdapter`} instance to handle the components events.
     * If you provide an adapter, it will be automatically wrapped in an {@link IEventBus | `IEventBus`} instance.
     *
     * @default
     * ```ts
     * import { NoOpEventBusAdapter } from "@daiso-tech/core/event-bus/no-op-event-bus-adapter";
     *
     * new NoOpEventBusAdapter()
     * ```
     */
    eventBus?: EventBusInput;

    /**
     * You can decide the default ttl value for {@link ILock | `ILock`} expiration. If null is passed then no ttl will be used by default.
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromMinutes(5);
     * ```
     */
    defaultTtl?: ITimeSpan | null;

    /**
     * The default refresh time used in the {@link ILock | `ILock`} `refresh` method.
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromMinutes(5);
     * ```
     */
    defaultRefreshTime?: ITimeSpan;

    /**
     * You can pass the `waitUntil` function to handle background promises.
     * This is required when working with environments like Cloudflare Workers or Vercel Functions to ensure tasks complete after the response is sent.
     * @default
     * ```ts
     * import { defaultWaitUntil } from "@daiso-tech/core/utilities"
     * ```
     */
    waitUntil?: WaitUntil;

    /**
     * You can pass {@link IExecutionContext | `IExecutionContext`} that will be used by context-aware adapters.
     * @default
     * ```ts
     * import { ExecutionContext } from "@daiso-tech/core/execution-context"
     * import { NoOpExecutionContextAdapter } from "@daiso-tech/core/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    executionContext?: IExecutionContext;
};

/**
 * Configuration for `LockFactory`.
 * Extends {@link LockFactorySettingsBase | `LockFactorySettingsBase`} with a required adapter.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock"`
 * @group Derivables
 */
export type LockFactorySettings = LockFactorySettingsBase & {
    /**
     * The underlying lock adapter that handles the actual locking operations.
     */
    adapter: LockAdapterVariants;
};

/**
 * `LockFactory` class can be derived from any {@link ILockAdapter | `ILockAdapter`} or {@link IDatabaseLockAdapter | `IDatabaseLockAdapter`}.
 *
 * Note the {@link ILock | `ILock`} instances created by the `LockFactory` class are serializable and deserializable,
 * allowing them to be seamlessly transferred across different servers, processes, and databases.
 * This can be done directly using {@link ISerderRegister | `ISerderRegister`} or indirectly through components that rely on {@link ISerderRegister | `ISerderRegister`} internally.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock"`
 * @group Derivables
 */
export class LockFactory implements ILockFactory {
    private readonly eventBus: IEventBus<LockEventMap>;
    private readonly originalAdapter: LockAdapterVariants;
    private readonly adapter: ILockAdapter;
    private readonly namespace: INamespace;
    private readonly creatLockId: Invokable<[], string>;
    private readonly defaultTtl: TimeSpan | null;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serde: OneOrMore<ISerderRegister>;
    private readonly serdeTransformerName: string;
    private readonly waitUntil: WaitUntil;
    private readonly executionContext: IExecutionContext;
    private readonly use: Use;

    /**
     * @example
     * ```ts
     * import { KyselyLockAdapter } from "@daiso-tech/core/lock/kysely-lock-adapter";
     * import { LockFactory } from "@daiso-tech/core/lock";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const lockAdapter = new KyselyLockAdapter({
     *   kysely: new Kysely({
     *     dialect: new SqliteDialect({
     *       database: new Sqlite("local.db"),
     *     }),
     *   });
     * });
     * // You need initialize the adapter once before using it.
     * await lockAdapter.init();
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter())
     * const lockFactory = new LockFactory({
     *   serde,
     *   adapter: lockAdapter,
     * });
     * ```
     */
    constructor(settings: LockFactorySettings) {
        const {
            defaultTtl = TimeSpan.fromMinutes(5),
            defaultRefreshTime = TimeSpan.fromMinutes(5),
            createLockId = () => v4(),
            serde = new Serde(new NoOpSerdeAdapter()),
            namespace = new NoOpNamespace(),
            adapter,
            eventBus = new NoOpEventBusAdapter(),
            serdeTransformerName = "",
            waitUntil = defaultWaitUntil,
            executionContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        } = settings;

        this.use = useFactory({ executionContext });
        this.executionContext = executionContext;
        this.waitUntil = waitUntil;
        this.serde = serde;
        this.defaultRefreshTime = TimeSpan.fromTimeSpan(defaultRefreshTime);
        this.creatLockId = createLockId;
        this.namespace = namespace;
        this.defaultTtl =
            defaultTtl === null ? null : TimeSpan.fromTimeSpan(defaultTtl);
        this.eventBus = resolveEventBusInput(namespace, eventBus);
        this.serdeTransformerName = serdeTransformerName;

        this.originalAdapter = adapter;
        this.adapter = resolveLockAdapter(adapter);
        this.registerToSerde();
    }

    private registerToSerde(): void {
        const transformer = new LockSerdeTransformer({
            use: this.use,
            executionContext: this.executionContext,
            waitUntil: this.waitUntil,
            originalAdapter: this.originalAdapter,
            adapter: this.adapter,
            defaultRefreshTime: this.defaultRefreshTime,
            eventBus: this.eventBus,
            namespace: this.namespace,
            serdeTransformerName: this.serdeTransformerName,
        });
        for (const serde of resolveOneOrMore(this.serde)) {
            serde.registerCustom(transformer, CORE);
        }
    }

    get events(): ILockListenable {
        return this.eventBus;
    }

    /**
     * @example
     * ```ts
     * import { LockFactory } from "@daiso-tech/core/lock";
     * import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";
     * import { Namespace } from "@daiso-tech/core/namespace";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     *
     * const lockFactory = new LockFactory({
     *   adapter: new MemoryLockAdapter(),
     *   namespace: new Namespace("lock"),
     *   serde: new Serde(new SuperJsonSerdeAdapter())
     * });
     *
     * const lock = lockFactory.create("a");
     * ```
     */
    create(key: string, settings: LockFactoryCreateSettings = {}): ILock {
        const {
            ttl = this.defaultTtl,
            lockId = callInvokable(this.creatLockId),
        } = settings;

        const keyObj = this.namespace.create(key);

        return new Lock({
            use: this.use,
            executionContext: this.executionContext,
            waitUntil: this.waitUntil,
            namespace: this.namespace,
            adapter: this.adapter,
            originalAdapter: this.originalAdapter,
            eventDispatcher: this.eventBus,
            key: keyObj,
            lockId,
            ttl: ttl === null ? null : TimeSpan.fromTimeSpan(ttl),
            serdeTransformerName: this.serdeTransformerName,
            defaultRefreshTime: this.defaultRefreshTime,
        });
    }
}
