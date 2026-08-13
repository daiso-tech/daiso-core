/**
 * @module Semaphore
 */

import { MysqlAdapter } from "kysely";

import type { Kysely } from "kysely";

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    ISemaphoreAdapter,
    ISemaphoreAdapterState,
    SemaphoreAcquireSettings,
} from "@/semaphore/contracts/_module.js";
import type { TimeSpan } from "@/time-span/implementations/_module.js";
import type {
    IDeinitizable,
    IInitizable,
    InvocableFn,
    IPrunable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export type KyselySemaphoreTable = {
    key: string;
    limit: number;
};

/**
 * IMPORT_PATH: `"eridu-tech/semaphore/kysely-semaphore-adapter"`
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
 * IMPORT_PATH: `"eridu-tech/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export type KyselySemaphoreTables = {
    semaphoreEntry: KyselySemaphoreTable;
    semaphoreSlotEntry: KyselySemaphoreSlotTable;
};

/**
 * Configuration for `KyselySemaphoreAdapter`.
 * Requires a Kysely instance typed with the semaphore schema.
 * Call `init()` before using the adapter.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export type KyselySemaphoreAdapterSettings = {
    /**
     * The Kysely database instance typed with the required semaphore tables.
     */
    kysely: Kysely<KyselySemaphoreTables>;
};

/**
 * To utilize the `KyselySemaphoreAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 *
 * Note in order to use `KyselySemaphoreAdapter` correctly, ensure you use a single, consistent database across all server instances and use a database that has support for transactions.
 * The adapter have been tested with `sqlite`, `postgres` and `mysql` databases.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export class KyselySemaphoreAdapter
    implements ISemaphoreAdapter, IDeinitizable, IInitizable, IPrunable
{
    private readonly kysely: Kysely<KyselySemaphoreTables>;
    private readonly isMysql: boolean;

    /**
     * @example
     * ```ts
     * import { KyselySemaphoreAdapter } from "eridu-tech/semaphore/kysely-semaphore-adapter";
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
        const { kysely } = settings;
        this.kysely = kysely;
        this.isMysql =
            this.kysely.getExecutor().adapter instanceof MysqlAdapter;
    }

    private transaction<TValue>(
        trxFn: InvocableFn<
            [trx: Kysely<KyselySemaphoreTables>],
            Promise<TValue>
        >,
    ): Promise<TValue> {
        return this.kysely
            .transaction()
            .setIsolationLevel("serializable")
            .execute(async (trx) => {
                return await trxFn(trx);
            });
    }

    async init(): Promise<void> {
        // Should throw if the table already exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .createTable("semaphoreEntry")
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
                .createTable("semaphoreSlotEntry")
                .addColumn("id", "varchar(255)", (col) =>
                    col.notNull().primaryKey(),
                )
                .addColumn("key", "varchar(255)", (col) => col.notNull())
                .addColumn("expiration", "bigint")
                .addForeignKeyConstraint(
                    "semaphoreSlotEntry_key",
                    ["key"],
                    "semaphoreEntry",
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
                .createIndex("semaphoreSlotEntry_expiration_index")
                .on("semaphoreSlotEntry")
                .columns(["key", "expiration"])
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Removes all related semaphore tables and their rows.
     * Note all semaphore data will be removed.
     */
    async deInit(): Promise<void> {
        // Should throw if the index does not exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .dropIndex("semaphoreSlotEntry_expiration_index")
                .on("semaphoreSlotEntry")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.kysely.schema.dropTable("semaphoreSlotEntry").execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.kysely.schema.dropTable("semaphoreEntry").execute();
        } catch {
            /* EMPTY */
        }
    }

    async removeAllExpired(): Promise<void> {
        await this.kysely
            .deleteFrom("semaphoreEntry")
            .where((eb) => {
                const hasUnexpiredSlots = eb
                    .selectFrom("semaphoreSlotEntry")
                    .select(eb.val(1).as("value"))
                    .where(
                        "semaphoreSlotEntry.key",
                        "=",
                        eb.ref("semaphoreEntry.key"),
                    )
                    .where((eb_) =>
                        eb_.and([
                            eb_(
                                "semaphoreSlotEntry.expiration",
                                "is not",
                                null,
                            ),
                            eb_(
                                "semaphoreSlotEntry.expiration",
                                ">",
                                Date.now(),
                            ),
                        ]),
                    );
                return eb.not(eb.exists(hasUnexpiredSlots));
            })
            .execute();
    }

    async acquire(settings: SemaphoreAcquireSettings): Promise<boolean> {
        const { context: _context, key, slotId, limit, ttl } = settings;

        return await this.transaction(async (trx) => {
            // Create the semaphore if it doesn't exist (never overwrite limit
            // when slots are still held — the stored limit governs admission).
            await trx
                .insertInto("semaphoreEntry")
                .values({ key, limit })
                .$if(!this.isMysql, (eb) =>
                    eb.onConflict((eb_) => eb_.column("key").doNothing()),
                )
                .$if(this.isMysql, (eb) => eb.onDuplicateKeyUpdate({ key }))
                .execute();

            // Read the stored semaphore to get the authoritative limit.
            const semaphore = await trx
                .selectFrom("semaphoreEntry")
                .where("semaphoreEntry.key", "=", key)
                .select("semaphoreEntry.limit")
                .executeTakeFirst();

            if (!semaphore) {
                return false;
            }

            // Count current non-expired slots.
            const countResult = await trx
                .selectFrom("semaphoreSlotEntry")
                .where("semaphoreSlotEntry.key", "=", key)
                .where((eb) =>
                    eb.or([
                        eb("semaphoreSlotEntry.expiration", "is", null),
                        eb("semaphoreSlotEntry.expiration", ">", Date.now()),
                    ]),
                )
                .select((eb) => eb.fn.countAll().as("count"))
                .executeTakeFirst();

            const currentCount = Number(countResult?.count ?? 0);

            // When no slots are held the limit may be updated; otherwise the
            // stored limit is authoritative.
            const effectiveLimit = currentCount === 0 ? limit : semaphore.limit;

            if (currentCount >= effectiveLimit) {
                return false;
            }

            // Update the stored limit when the caller provides a new one
            // and no slots are held.
            if (currentCount === 0 && limit !== semaphore.limit) {
                await trx
                    .updateTable("semaphoreEntry")
                    .where("semaphoreEntry.key", "=", key)
                    .set({ limit })
                    .execute();
            }

            // Upsert the slot
            const expiration = ttl?.toEndDate().getTime() ?? null;
            await trx
                .insertInto("semaphoreSlotEntry")
                .values({ key, id: slotId, expiration })
                .$if(!this.isMysql, (eb) =>
                    eb.onConflict((eb_) =>
                        eb_
                            .column("id")
                            .doUpdateSet({ key, id: slotId, expiration }),
                    ),
                )
                .$if(this.isMysql, (eb) =>
                    eb.onDuplicateKeyUpdate({ key, id: slotId, expiration }),
                )
                .execute();

            return true;
        });
    }

    async release(
        key: string,
        slotId: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        if (this.isMysql) {
            return await this.transaction(async (trx) => {
                const existing = await trx
                    .selectFrom("semaphoreSlotEntry")
                    .where("semaphoreSlotEntry.key", "=", key)
                    .where("semaphoreSlotEntry.id", "=", slotId)
                    .where((eb) =>
                        eb.or([
                            eb("semaphoreSlotEntry.expiration", "is", null),
                            eb(
                                "semaphoreSlotEntry.expiration",
                                ">",
                                Date.now(),
                            ),
                        ]),
                    )
                    .select("semaphoreSlotEntry.id")
                    .executeTakeFirst();

                if (!existing) {
                    return false;
                }

                await trx
                    .deleteFrom("semaphoreSlotEntry")
                    .where("semaphoreSlotEntry.key", "=", key)
                    .where("semaphoreSlotEntry.id", "=", slotId)
                    .execute();

                return true;
            });
        }

        const result = await this.kysely
            .deleteFrom("semaphoreSlotEntry")
            .where("semaphoreSlotEntry.key", "=", key)
            .where("semaphoreSlotEntry.id", "=", slotId)
            .where((eb) =>
                eb.or([
                    eb("semaphoreSlotEntry.expiration", "is", null),
                    eb("semaphoreSlotEntry.expiration", ">", Date.now()),
                ]),
            )
            .returning("semaphoreSlotEntry.id")
            .executeTakeFirst();

        return result !== undefined;
    }

    async forceReleaseAll(
        key: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        if (this.isMysql) {
            return await this.transaction(async (trx) => {
                const existing = await trx
                    .selectFrom("semaphoreSlotEntry")
                    .where("semaphoreSlotEntry.key", "=", key)
                    .where((eb) =>
                        eb.or([
                            eb("semaphoreSlotEntry.expiration", "is", null),
                            eb(
                                "semaphoreSlotEntry.expiration",
                                ">",
                                Date.now(),
                            ),
                        ]),
                    )
                    .select("semaphoreSlotEntry.id")
                    .executeTakeFirst();

                if (!existing) {
                    return false;
                }

                await trx
                    .deleteFrom("semaphoreSlotEntry")
                    .where("semaphoreSlotEntry.key", "=", key)
                    .execute();

                return true;
            });
        }

        const result = await this.kysely
            .deleteFrom("semaphoreSlotEntry")
            .where("semaphoreSlotEntry.key", "=", key)
            .where((eb) =>
                eb.or([
                    eb("semaphoreSlotEntry.expiration", "is", null),
                    eb("semaphoreSlotEntry.expiration", ">", Date.now()),
                ]),
            )
            .returning("semaphoreSlotEntry.id")
            .executeTakeFirst();

        return result !== undefined;
    }

    async refresh(
        key: string,
        slotId: string,
        ttl: TimeSpan,
        _context: IReadableContext,
    ): Promise<boolean> {
        const expiration = ttl.toEndDate().getTime();
        const result = await this.kysely
            .updateTable("semaphoreSlotEntry")
            .where("semaphoreSlotEntry.key", "=", key)
            .where("semaphoreSlotEntry.id", "=", slotId)
            .where((eb) =>
                eb.and([
                    eb("semaphoreSlotEntry.expiration", "is not", null),
                    eb("semaphoreSlotEntry.expiration", ">", Date.now()),
                ]),
            )
            .set({ expiration })
            .execute();

        return Number(result[0]?.numUpdatedRows ?? 0n) > 0;
    }

    async getState(
        key: string,
        _context: IReadableContext,
    ): Promise<ISemaphoreAdapterState | null> {
        const semaphore = await this.kysely
            .selectFrom("semaphoreEntry")
            .where("semaphoreEntry.key", "=", key)
            .select("semaphoreEntry.limit")
            .executeTakeFirst();

        if (semaphore === undefined) {
            return null;
        }

        const slots = await this.kysely
            .selectFrom("semaphoreSlotEntry")
            .where("semaphoreSlotEntry.key", "=", key)
            .select(["semaphoreSlotEntry.id", "semaphoreSlotEntry.expiration"])
            .execute();

        const acquiredSlots = new Map<string, Date | null>();
        for (const slot of slots) {
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

        // Return null when there are no non-expired slots — the semaphore
        // is effectively dead and should appear as non-existent.
        if (acquiredSlots.size === 0) {
            return null;
        }

        return {
            limit: semaphore.limit,
            acquiredSlots,
        };
    }
}
