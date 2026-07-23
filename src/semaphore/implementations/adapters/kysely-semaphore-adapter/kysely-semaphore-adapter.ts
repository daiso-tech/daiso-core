/**
 * @module Semaphore
 */

import { MysqlAdapter, Transaction, type Kysely } from "kysely";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type ISemaphoreAdapter,
    type ISemaphoreAdapterState,
    type SemaphoreAcquireSettings,
} from "@/semaphore/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    type IDeinitizable,
    type IInitizable,
    type InvokableFn,
    type IPrunable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export type KyselySemaphoreTable = {
    key: string;
    limit: number;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export type KyselySemaphoreSlotTable = {
    id: string;
    key: string;
    // In ms since unix epoch
    // The type in mysql is bigint and will be returned as a string
    expiration: number | string | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export type KyselySemaphoreTables = {
    semaphore: KyselySemaphoreTable;
    semaphoreSlot: KyselySemaphoreSlotTable;
};

/**
 * Configuration for `KyselySemaphoreAdapter`.
 * Requires a Kysely instance typed with the semaphore schema.
 * Call `init()` before using the adapter.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export type KyselySemaphoreAdapterSettings = {
    /**
     * The Kysely database instance typed with the required semaphore tables.
     */
    kysely: Kysely<KyselySemaphoreTables>;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromMinutes(1)
     * ```
     */
    expiredKeysRemovalInterval?: ITimeSpan;

    /**
     * When `true`, a background task periodically removes expired semaphore records and their related slots.
     * Set to `false` to disable automatic cleanup.
     * @default true
     */
    shouldRemoveExpiredKeys?: boolean;

    /**
     * @default
     * ```ts
     * import { Transaction } from "kysely"
     *
     * !(settings.kysely instanceof Transaction)
     * ```
     */
    enableTransactions?: boolean;
};

/**
 * To utilize the `KyselySemaphoreAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 *
 * Note in order to use `KyselySemaphoreAdapter` correctly, ensure you use a single, consistent database across all server instances and use a database that has support for transactions.
 * The adapter have been tested with `sqlite`, `postgres` and `mysql` databases.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export class KyselySemaphoreAdapter
    implements ISemaphoreAdapter, IDeinitizable, IInitizable, IPrunable
{
    private readonly kysely: Kysely<KyselySemaphoreTables>;
    private readonly expiredKeysRemovalInterval: TimeSpan;
    private readonly shouldRemoveExpiredKeys: boolean;
    private intervalId: string | number | NodeJS.Timeout | undefined | null =
        null;
    private readonly isMysql: boolean;
    private readonly enableTransactions: boolean;

    /**
     * @example
     * ```ts
     * import { KyselySemaphoreAdapter } from "@daiso-tech/core/semaphore/kysely-semaphore-adapter";
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const semaphoreAdapter = new KyselySemaphoreAdapter({
     *   kysely: new Kysely({
     *     dialect: new SqliteDialect({
     *       database: new Sqlite("local.db"),
     *     }),
     *   }),
     * });
     * // You need initialize the adapter once before using it.
     * await semaphoreAdapter.init();
     * ```
     */
    constructor(settings: KyselySemaphoreAdapterSettings) {
        const {
            kysely,
            expiredKeysRemovalInterval = TimeSpan.fromMinutes(1),
            shouldRemoveExpiredKeys = true,
            enableTransactions = !(settings.kysely instanceof Transaction),
        } = settings;
        this.expiredKeysRemovalInterval = TimeSpan.fromTimeSpan(
            expiredKeysRemovalInterval,
        );
        this.shouldRemoveExpiredKeys = shouldRemoveExpiredKeys;
        this.kysely = kysely;
        this.isMysql =
            this.kysely.getExecutor().adapter instanceof MysqlAdapter;
        this.enableTransactions = enableTransactions;
    }

    private _transaction<TValue>(
        trxFn: InvokableFn<
            [trx: Kysely<KyselySemaphoreTables>],
            Promise<TValue>
        >,
    ): Promise<TValue> {
        if (this.enableTransactions) {
            return this.kysely
                .transaction()
                .setIsolationLevel("serializable")
                .execute(async (trx) => {
                    return await trxFn(trx);
                });
        }
        return trxFn(this.kysely);
    }

    async init(): Promise<void> {
        // Should throw if the table already exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .createTable("semaphore")
                .addColumn("key", "varchar(255)", (col) =>
                    col.notNull().primaryKey(),
                )
                .addColumn("limit", "integer", (col) => col.notNull())
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table already exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .createTable("semaphoreSlot")
                .addColumn("id", "varchar(255)", (col) =>
                    col.notNull().primaryKey(),
                )
                .addColumn("key", "varchar(255)", (col) => col.notNull())
                .addColumn("expiration", "bigint")
                .addForeignKeyConstraint(
                    "semaphoreSlot_key",
                    ["key"],
                    "semaphore",
                    ["key"],
                    (eb) => eb.onDelete("cascade"),
                )
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the index already exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .createIndex("semaphoreSlot_expiration_index")
                .on("semaphoreSlot")
                .columns(["key", "expiration"])
                .execute();
        } catch {
            /* EMPTY */
        }

        if (this.shouldRemoveExpiredKeys) {
            this.intervalId = setInterval(() => {
                void this.removeAllExpired();
            }, this.expiredKeysRemovalInterval.toMilliseconds());
        }
    }

    /**
     * Removes all related semaphore tables and their rows.
     * Note all semaphore data will be removed.
     */
    async deInit(): Promise<void> {
        if (this.shouldRemoveExpiredKeys && this.intervalId !== null) {
            clearInterval(this.intervalId);
        }

        // Should throw if the index does not exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .dropIndex("semaphoreSlot_expiration_index")
                .on("semaphoreSlot")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.kysely.schema.dropTable("semaphoreSlot").execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.kysely.schema.dropTable("semaphore").execute();
        } catch {
            /* EMPTY */
        }
    }

    async removeAllExpired(): Promise<void> {
        await this.kysely
            .deleteFrom("semaphore")
            .where((eb) => {
                const hasUnexpiredSlots = eb
                    .selectFrom("semaphoreSlot")
                    .select(eb.val(1).as("value"))
                    .where("semaphoreSlot.key", "=", eb.ref("semaphore.key"))
                    .where((eb_) =>
                        eb_.and([
                            eb_("semaphoreSlot.expiration", "is not", null),
                            eb_("semaphoreSlot.expiration", ">", Date.now()),
                        ]),
                    );
                return eb.not(eb.exists(hasUnexpiredSlots));
            })
            .execute();
    }

    async acquire(settings: SemaphoreAcquireSettings): Promise<boolean> {
        const { context: _context, key, slotId, limit, ttl } = settings;

        return await this._transaction(async (trx) => {
            // Upsert the semaphore to ensure it exists with the given limit
            await trx
                .insertInto("semaphore")
                .values({ key, limit })
                .$if(!this.isMysql, (eb) =>
                    eb.onConflict((eb_) =>
                        eb_.column("key").doUpdateSet({
                            key,
                            limit,
                        }),
                    ),
                )
                .$if(this.isMysql, (eb) =>
                    eb.onDuplicateKeyUpdate({
                        key,
                        limit,
                    }),
                )
                .execute();

            // Count current non-expired slots
            const countResult = await trx
                .selectFrom("semaphoreSlot")
                .where("semaphoreSlot.key", "=", key)
                .where((eb) =>
                    eb.or([
                        eb("semaphoreSlot.expiration", "is", null),
                        eb("semaphoreSlot.expiration", ">", Date.now()),
                    ]),
                )
                .select((eb) => eb.fn.countAll<number>().as("count"))
                .executeTakeFirst();

            if (countResult && Number(countResult.count) >= limit) {
                return false;
            }

            // Upsert the slot
            const expiration = ttl?.toEndDate().getTime() ?? null;
            await trx
                .insertInto("semaphoreSlot")
                .values({
                    key,
                    id: slotId,
                    expiration,
                })
                .$if(!this.isMysql, (eb) =>
                    eb.onConflict((eb_) =>
                        eb_.column("id").doUpdateSet({
                            key,
                            id: slotId,
                            expiration,
                        }),
                    ),
                )
                .$if(this.isMysql, (eb) =>
                    eb.onDuplicateKeyUpdate({
                        key,
                        id: slotId,
                        expiration,
                    }),
                )
                .execute();

            return true;
        });
    }

    async release(
        _context: IReadableContext,
        key: string,
        slotId: string,
    ): Promise<boolean> {
        if (this.isMysql) {
            return await this._transaction(async (trx) => {
                const existing = await trx
                    .selectFrom("semaphoreSlot")
                    .where("semaphoreSlot.key", "=", key)
                    .where("semaphoreSlot.id", "=", slotId)
                    .where((eb) =>
                        eb.or([
                            eb("semaphoreSlot.expiration", "is", null),
                            eb("semaphoreSlot.expiration", ">", Date.now()),
                        ]),
                    )
                    .select("semaphoreSlot.id")
                    .executeTakeFirst();

                if (!existing) {
                    return false;
                }

                await trx
                    .deleteFrom("semaphoreSlot")
                    .where("semaphoreSlot.key", "=", key)
                    .where("semaphoreSlot.id", "=", slotId)
                    .execute();

                return true;
            });
        }

        const result = await this.kysely
            .deleteFrom("semaphoreSlot")
            .where("semaphoreSlot.key", "=", key)
            .where("semaphoreSlot.id", "=", slotId)
            .where((eb) =>
                eb.or([
                    eb("semaphoreSlot.expiration", "is", null),
                    eb("semaphoreSlot.expiration", ">", Date.now()),
                ]),
            )
            .returning("semaphoreSlot.id")
            .executeTakeFirst();

        return result !== undefined;
    }

    async forceReleaseAll(
        _context: IReadableContext,
        key: string,
    ): Promise<boolean> {
        if (this.isMysql) {
            return await this._transaction(async (trx) => {
                const existing = await trx
                    .selectFrom("semaphoreSlot")
                    .where("semaphoreSlot.key", "=", key)
                    .where((eb) =>
                        eb.or([
                            eb("semaphoreSlot.expiration", "is", null),
                            eb("semaphoreSlot.expiration", ">", Date.now()),
                        ]),
                    )
                    .select("semaphoreSlot.id")
                    .executeTakeFirst();

                if (!existing) {
                    return false;
                }

                await trx
                    .deleteFrom("semaphoreSlot")
                    .where("semaphoreSlot.key", "=", key)
                    .execute();

                return true;
            });
        }

        const result = await this.kysely
            .deleteFrom("semaphoreSlot")
            .where("semaphoreSlot.key", "=", key)
            .where((eb) =>
                eb.or([
                    eb("semaphoreSlot.expiration", "is", null),
                    eb("semaphoreSlot.expiration", ">", Date.now()),
                ]),
            )
            .returning("semaphoreSlot.id")
            .executeTakeFirst();

        return result !== undefined;
    }

    async refresh(
        _context: IReadableContext,
        key: string,
        slotId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        const expiration = ttl.toEndDate().getTime();
        const result = await this.kysely
            .updateTable("semaphoreSlot")
            .where("semaphoreSlot.key", "=", key)
            .where("semaphoreSlot.id", "=", slotId)
            .where((eb) =>
                eb.and([
                    eb("semaphoreSlot.expiration", "is not", null),
                    eb("semaphoreSlot.expiration", ">", Date.now()),
                ]),
            )
            .set({ expiration })
            .execute();

        return Number(result[0]?.numUpdatedRows ?? 0n) > 0;
    }

    async getState(
        _context: IReadableContext,
        key: string,
    ): Promise<ISemaphoreAdapterState | null> {
        const semaphore = await this.kysely
            .selectFrom("semaphore")
            .where("semaphore.key", "=", key)
            .select("semaphore.limit")
            .executeTakeFirst();

        if (semaphore === undefined) {
            return null;
        }

        const slots = await this.kysely
            .selectFrom("semaphoreSlot")
            .where("semaphoreSlot.key", "=", key)
            .select(["semaphoreSlot.id", "semaphoreSlot.expiration"])
            .execute();

        const acquiredSlots = new Map<string, Date | null>();
        for (const slot of slots) {
            // Skip expired slots
            if (
                slot.expiration !== null &&
                Number(slot.expiration) <= Date.now()
            ) {
                continue;
            }
            acquiredSlots.set(
                slot.id,
                slot.expiration === null
                    ? null
                    : new Date(Number(slot.expiration)),
            );
        }

        return {
            limit: semaphore.limit,
            acquiredSlots,
        };
    }
}
