/**
 * @module Semaphore
 */

import { v4 } from "uuid";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type IDatabaseSemaphoreAdapter,
    type ISemaphore,
    type ISemaphoreAdapter,
    type SemaphoreFactoryCreateSettings,
    type ISemaphoreFactory,
} from "@/semaphore/contracts/_module.js";
import { SemaphoreSerdeTransformer } from "@/semaphore/implementations/derivables/semaphore-factory/semaphore-serde-transformer.js";
import { Semaphore } from "@/semaphore/implementations/derivables/semaphore-factory/semaphore.js";
import { type ISerderRegister } from "@/serde/contracts/_module.js";
import { NoOpSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    callInvokable,
    CORE,
    isPositiveNbr,
    resolveOneOrMore,
    type Invokable,
    type OneOrMore,
} from "@/utilities/_module.js";

/**
 * Base configuration shared by all `SemaphoreFactory` variants.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore"`
 * @group Derivables
 */
export type SemaphoreFactorySettingsBase = {
    /**
     * You can pass an {@link ISerderRegister | `ISerderRegister`} instance to the {@link SemaphoreFactory | `SemaphoreFactory`} to register the semaphore's serialization and deserialization logic for the provided adapter.
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
     * The serde transformer name used to identify semaphore serializer and deserializer adapters when there are adapters with the same name.
     * @default ""
     */
    serdeTransformerName?: string;

    /**
     * You can pass your slot id generator function.
     * @default
     * ```ts
     * import { v4 } from "uuid";
     *
     * () => v4()
     */
    createSlotId?: Invokable<[], string>;

    /**
     * You can decide the default ttl value for {@link ISemaphore | `ISemaphore`} expiration. If null is passed then no ttl will be used by default.
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromMinutes(5);
     * ```
     */
    defaultTtl?: ITimeSpan | null;

    /**
     * The default refresh time used in the {@link ISemaphore | `ISemaphore`} `refresh` method.
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
 * Configuration for `SemaphoreFactory`.
 * Extends {@link SemaphoreFactorySettingsBase | `SemaphoreFactorySettingsBase`} with a required adapter.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore"`
 * @group Derivables
 */
export type SemaphoreFactorySettings = SemaphoreFactorySettingsBase & {
    /**
     * The underlying semaphore adapter that handles the actual slot acquisition operations.
     */
    adapter: ISemaphoreAdapter;
};

/**
 * `SemaphoreFactory` class can be derived from any {@link ISemaphoreAdapter | `ISemaphoreAdapter`} or {@link IDatabaseSemaphoreAdapter | `IDatabaseSemaphoreAdapter`}.
 *
 * Note the {@link ISemaphore | `ISemaphore`} instances created by the `SemaphoreFactory` class are serializable and deserializable,
 * allowing them to be seamlessly transferred across different servers, processes, and databases.
 * This can be done directly using {@link ISerderRegister | `ISerderRegister`} or indirectly through components that rely on {@link ISerderRegister | `ISerderRegister`} internally.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore"`
 * @group Derivables
 */
export class SemaphoreFactory implements ISemaphoreFactory {
    private readonly adapter: ISemaphoreAdapter;
    private readonly defaultTtl: TimeSpan | null;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serde: OneOrMore<ISerderRegister>;
    private readonly serdeTransformerName: string;
    private readonly createSlotId: Invokable<[], string>;
    private readonly context: IReadableContext;

    /**
     * @example
     * ```ts
     * import { KyselySemaphoreAdapter } from "@daiso-tech/core/semaphore/kysely-semaphore-adapter";
     * import { SemaphoreFactory } from "@daiso-tech/core/semaphore";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const semaphoreAdapter = new KyselySemaphoreAdapter({
     *   kysely: new Kysely({
     *     dialect: new SqliteDialect({
     *       database: new Sqlite("local.db"),
     *     }),
     *   });
     * });
     * // You need initialize the adapter once before using it.
     * await semaphoreAdapter.init();
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter())
     * const lockProvider = new SemaphoreFactory({
     *   serde,
     *   adapter: semaphoreAdapter,
     * });
     * ```
     */
    constructor(settings: SemaphoreFactorySettings) {
        const {
            createSlotId = () => v4(),
            defaultTtl = TimeSpan.fromMinutes(5),
            defaultRefreshTime = TimeSpan.fromMinutes(5),
            serde = new Serde(new NoOpSerdeAdapter()),
            adapter,
            serdeTransformerName = "",
            context = new ExecutionContext(new NoOpExecutionContextAdapter()),
        } = settings;

        this.context = context;
        this.createSlotId = createSlotId;
        this.serde = serde;
        this.defaultRefreshTime = TimeSpan.fromTimeSpan(defaultRefreshTime);
        this.defaultTtl =
            defaultTtl === null ? null : TimeSpan.fromTimeSpan(defaultTtl);
        this.serdeTransformerName = serdeTransformerName;

        this.adapter = adapter;

        this.registerToSerde();
    }

    private registerToSerde(): void {
        const transformer = new SemaphoreSerdeTransformer({
            context: this.context,
            adapter: this.adapter,
            defaultRefreshTime: this.defaultRefreshTime,
            serdeTransformerName: this.serdeTransformerName,
        });
        for (const serde of resolveOneOrMore(this.serde)) {
            serde.registerCustom(transformer, CORE);
        }
    }

    create(key: string, settings: SemaphoreFactoryCreateSettings): ISemaphore {
        const {
            ttl = this.defaultTtl,
            limit,
            slotId = callInvokable(this.createSlotId),
        } = settings;
        isPositiveNbr(limit);

        return new Semaphore({
            context: this.context,
            slotId,
            limit,
            adapter: this.adapter,
            key,
            ttl: ttl === null ? null : TimeSpan.fromTimeSpan(ttl),
            serdeTransformerName: this.serdeTransformerName,
            defaultRefreshTime: this.defaultRefreshTime,
        });
    }
}
