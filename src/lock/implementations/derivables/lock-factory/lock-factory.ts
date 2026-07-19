/**
 * @module Lock
 */

import { v4 } from "uuid";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
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
} from "@/lock/contracts/_module.js";
import { LockSerdeTransformer } from "@/lock/implementations/derivables/lock-factory/lock-serde-transformer.js";
import { Lock } from "@/lock/implementations/derivables/lock-factory/lock.js";
import { resolveLockAdapter } from "@/lock/implementations/derivables/lock-factory/resolve-lock-adapter.js";
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
} from "@/utilities/_module.js";

/**
 * Base configuration shared by all `LockFactory` variants.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock"`
 * @group Derivables
 */
export type LockFactorySettingsBase = {
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
     * You can pass {@link IReadableContext | `IReadableContext`} that will be used by context-aware adapters.
     * @default
     * ```ts
     * import { ExecutionContext } from "@daiso-tech/core/execution-context"
     * import { NoOpExecutionContextAdapter } from "@daiso-tech/core/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    context?: IReadableContext;
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
    private readonly originalAdapter: LockAdapterVariants;
    private readonly adapter: ILockAdapter;
    private readonly creatLockId: Invokable<[], string>;
    private readonly defaultTtl: TimeSpan | null;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serde: OneOrMore<ISerderRegister>;
    private readonly serdeTransformerName: string;
    private readonly context: IReadableContext;

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
            adapter,
            serdeTransformerName = "",
            context = new ExecutionContext(new NoOpExecutionContextAdapter()),
        } = settings;

        this.context = context;
        this.serde = serde;
        this.defaultRefreshTime = TimeSpan.fromTimeSpan(defaultRefreshTime);
        this.creatLockId = createLockId;
        this.defaultTtl =
            defaultTtl === null ? null : TimeSpan.fromTimeSpan(defaultTtl);
        this.serdeTransformerName = serdeTransformerName;

        this.originalAdapter = adapter;
        this.adapter = resolveLockAdapter(adapter);
        this.registerToSerde();
    }

    private registerToSerde(): void {
        const transformer = new LockSerdeTransformer({
            context: this.context,
            originalAdapter: this.originalAdapter,
            adapter: this.adapter,
            defaultRefreshTime: this.defaultRefreshTime,
            serdeTransformerName: this.serdeTransformerName,
        });
        for (const serde of resolveOneOrMore(this.serde)) {
            serde.registerCustom(transformer, CORE);
        }
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

        return new Lock({
            context: this.context,
            adapter: this.adapter,
            originalAdapter: this.originalAdapter,
            key,
            lockId,
            ttl: ttl === null ? null : TimeSpan.fromTimeSpan(ttl),
            serdeTransformerName: this.serdeTransformerName,
            defaultRefreshTime: this.defaultRefreshTime,
        });
    }
}
