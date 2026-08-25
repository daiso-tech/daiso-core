/**
 * @module Semaphore
 */

import { v4 } from "uuid";

import { SemaphoreSerdeTransformer } from "@/semaphore/implementations/derivables/semaphore-factory/semaphore-serde-transformer.js";
import { Semaphore } from "@/semaphore/implementations/derivables/semaphore-factory/semaphore.js";
import { NoOpSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    callInvocable,
    CORE,
    isPositiveNbr,
    resolveOneOrMore,
} from "@/utilities/_module.js";

import type {
    ISemaphore,
    ISemaphoreAdapter,
    SemaphoreFactoryCreateSettings,
    ISemaphoreFactory,
} from "@/semaphore/contracts/_module.js";
import type { ISerderRegister } from "@/serde/contracts/_module.js";
import type { ITimeSpan } from "@/time-span/contracts/_module.js";
import type { Invocable, OneOrMore } from "@/utilities/_module.js";

/**
 * Base configuration shared by all `SemaphoreFactory` variants.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore"`
 * @group Derivables
 */
export type SemaphoreFactorySettingsBase = {
    /**
     * You can pass an {@link ISerderRegister | `ISerderRegister`} instance to the {@link SemaphoreFactory | `SemaphoreFactory`} to register the semaphore's serialization and deserialization logic for the provided adapter.
     * @default
     * ```ts
     * import { Serde } from "eridu-tech/serde";
     * import { NoOpSerdeAdapter } from "eridu-tech/serde/no-op-serde-adapter";
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
    createSlotId?: Invocable<[], string>;

    /**
     * You can decide the default ttl value for {@link ISemaphore | `ISemaphore`} expiration. If null is passed then no ttl will be used by default.
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMinutes(5);
     * ```
     */
    defaultTtl?: ITimeSpan | null;

    /**
     * The default refresh time used in the {@link ISemaphore | `ISemaphore`} `refresh` method.
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMinutes(5);
     * ```
     */
    defaultRefreshTime?: ITimeSpan;
};

/**
 * Configuration for `SemaphoreFactory`.
 * Extends {@link SemaphoreFactorySettingsBase | `SemaphoreFactorySettingsBase`} with a required adapter.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore"`
 * @group Derivables
 */
export type SemaphoreFactorySettings = SemaphoreFactorySettingsBase & {
    /**
     * The underlying semaphore adapter that handles the actual slot acquisition operations.
     */
    adapter: ISemaphoreAdapter;
};

/**
 * `SemaphoreFactory` class can be derived from any {@link ISemaphoreAdapter | `ISemaphoreAdapter`}.
 *
 * Note the {@link ISemaphore | `ISemaphore`} instances created by the `SemaphoreFactory` class are serializable and deserializable,
 * allowing them to be seamlessly transferred across different servers, processes, and databases.
 * This can be done directly using {@link ISerderRegister | `ISerderRegister`} or indirectly through components that rely on {@link ISerderRegister | `ISerderRegister`} internally.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore"`
 * @group Derivables
 */
export class SemaphoreFactory implements ISemaphoreFactory {
    private readonly adapter: ISemaphoreAdapter;
    private readonly defaultTtl: TimeSpan | null;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serde: OneOrMore<ISerderRegister>;
    private readonly serdeTransformerName: string;
    private readonly createSlotId: Invocable<[], string>;

    /**
     * @example
     * ```ts
     * import { KyselySemaphoreAdapter } from "eridu-tech/semaphore/kysely-semaphore-adapter";
     * import { SemaphoreFactory } from "eridu-tech/semaphore";
     * import { Serde } from "eridu-tech/serde";
     * import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
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
        } = settings;

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
            slotId = callInvocable(this.createSlotId),
        } = settings;
        isPositiveNbr(limit);

        return new Semaphore({
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
