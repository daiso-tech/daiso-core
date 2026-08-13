/**
 * @module SharedLock
 */

import { MysqlAdapter } from "kysely";

import type { Kysely } from "kysely";

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    IReaderSemaphoreAdapterState,
    ISharedLockAdapter,
    ISharedLockAdapterState,
    IWriterLockAdapterState,
    SharedLockAcquireSettings,
} from "@/shared-lock/contracts/_module.js";
import type { TimeSpan } from "@/time-span/implementations/_module.js";
import type {
    IDeinitizable,
    IInitizable,
    InvocableFn,
    IPrunable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/kysely-shared-lock-adapter"`
 * @group Adapters
 */
export type KyselyWriterLockTable = {
    key: string;
    owner: string;
    // In ms since unix epoch.
    // The type in mysql is bigint and will be returned as a string.
    // Some sql database drivers have support for js bigint if enabled. Meaning bigint will be returned.
    expiration: number | bigint | string | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/kysely-shared-lock-adapter"`
 * @group Adapters
 */
export type KyselyReaderSemaphoreTable = {
    key: string;
    limit: number;
};

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/kysely-shared-lock-adapter"`
 * @group Adapters
 */
export type KyselyReaderSemaphoreSlotTable = {
    id: string;
    key: string;
    // In ms since unix epoch
    // The type in mysql is bigint and will be returned as a string
    expiration: number | string | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/kysely-shared-lock-adapter"`
 * @group Adapters
 */
export type KyselySharedLockTables = {
    writerLockEntry: KyselyWriterLockTable;
    readerSemaphoreEntry: KyselyReaderSemaphoreTable;
    readerSemaphoreSlotEntry: KyselyReaderSemaphoreSlotTable;
};

/**
 * Configuration for `KyselySharedLockAdapter`.
 * Requires a Kysely database instance with the shared-lock schema applied.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/kysely-shared-lock-adapter"`
 * @group Adapters
 */
export type KyselySharedLockAdapterSettings = {
    /**
     * The Kysely database instance with the required shared-lock schema tables applied.
     */
    kysely: Kysely<KyselySharedLockTables>;

    /**
     *  @default
     * ```ts
     * () => new Date()
     * ```
     */
    currentDate?: () => Date;
};

/**
 * To utilize the `KyselySharedLockAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 *
 * Note in order to use `KyselySharedLockAdapter` correctly, ensure you use a single, consistent database across all server instances and use a database that has support for transactions.
 * The adapter have been tested with `sqlite`, `postgres` and `mysql` databases.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/kysely-shared-lock-adapter"`
 * @group Adapters
 */
export class KyselySharedLockAdapter
    implements ISharedLockAdapter, IDeinitizable, IInitizable, IPrunable
{
    private readonly kysely: Kysely<KyselySharedLockTables>;
    private readonly isMysql: boolean;
    private readonly currentDate: () => Date;

    /**
     * @example
     * ```ts
     * import { KyselySharedLockAdapter } from "eridu-tech/shared-lock/kysely-shared-lock-adapter";
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const sharedLockAdapter = new KyselySharedLockAdapter({
     *   kysely: new Kysely({
     *     dialect: new SqliteDialect({
     *       database: new Sqlite("local.db"),
     *     }),
     *   }),
     * });
     * // You need initialize the adapter once before using it.
     * await sharedLockAdapter.init();
     * ```
     */
    constructor(settings: KyselySharedLockAdapterSettings) {
        const { kysely, currentDate = () => new Date() } = settings;
        this.kysely = kysely;
        this.isMysql =
            this.kysely.getExecutor().adapter instanceof MysqlAdapter;
        this.currentDate = currentDate;
    }

    private transaction<TValue>(
        trxFn: InvocableFn<
            [trx: Kysely<KyselySharedLockTables>],
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
                .createTable("readerSemaphoreEntry")
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
                .createTable("readerSemaphoreSlotEntry")
                .addColumn("id", "varchar(255)", (col) =>
                    col.notNull().primaryKey(),
                )
                .addColumn("key", "varchar(255)", (col) => col.notNull())
                .addColumn("expiration", "bigint")
                .addForeignKeyConstraint(
                    "readerSemaphoreSlotEntry_key",
                    ["key"],
                    "readerSemaphoreEntry",
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
                .createIndex("readerSemaphoreSlotEntry_expiration_index")
                .on("readerSemaphoreSlotEntry")
                .columns(["key", "expiration"])
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table already exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .createTable("writerLockEntry")
                .addColumn("key", "varchar(255)", (col) =>
                    col.primaryKey().notNull(),
                )
                .addColumn("owner", "varchar(255)", (col) => col.notNull())
                .addColumn("expiration", "bigint")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the index already exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .createIndex("writerLockEntry_expiration")
                .on("writerLockEntry")
                .column("expiration")
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Removes all related shared-lock tables and their rows.
     * Note all shared-lock data will be removed.
     */
    async deInit(): Promise<void> {
        // Should throw if the index does not exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .dropIndex("readerSemaphoreSlotEntry_expiration_index")
                .on("readerSemaphoreSlotEntry")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .dropTable("readerSemaphoreSlotEntry")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .dropTable("readerSemaphoreEntry")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the index does not exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .dropIndex("writerLockEntry_expiration")
                .on("writerLockEntry")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.kysely.schema.dropTable("writerLockEntry").execute();
        } catch {
            /* EMPTY */
        }
    }

    private async removeAllExpiredReaders(): Promise<void> {
        await this.kysely
            .deleteFrom("readerSemaphoreEntry")
            .where((eb) => {
                const hasUnexpiredSlots = eb
                    .selectFrom("readerSemaphoreSlotEntry")
                    .select(eb.val(1).as("value"))
                    .where(
                        "readerSemaphoreSlotEntry.key",
                        "=",
                        eb.ref("readerSemaphoreEntry.key"),
                    )
                    .where((eb_) =>
                        eb_.and([
                            eb_(
                                "readerSemaphoreSlotEntry.expiration",
                                "is not",
                                null,
                            ),
                            eb_(
                                "readerSemaphoreSlotEntry.expiration",
                                ">",
                                Date.now(),
                            ),
                        ]),
                    );
                return eb.not(eb.exists(hasUnexpiredSlots));
            })
            .execute();
    }

    private async removeAllExpiredWriters(): Promise<void> {
        await this.kysely
            .deleteFrom("writerLockEntry")
            .where(
                "writerLockEntry.expiration",
                "<=",
                this.currentDate().getTime(),
            )
            .execute();
    }

    async removeAllExpired(): Promise<void> {
        await Promise.all([
            this.removeAllExpiredWriters(),
            this.removeAllExpiredReaders(),
        ]);
    }

    async acquireWriter(
        key: string,
        lockId: string,
        ttl: TimeSpan | null,
        _context: IReadableContext,
    ): Promise<boolean> {
        return await this.transaction(async (trx) => {
            // Check if a non-expired writer lock exists held by a different owner
            const existing = await trx
                .selectFrom("writerLockEntry")
                .where("writerLockEntry.key", "=", key)
                .select(["writerLockEntry.owner", "writerLockEntry.expiration"])
                .executeTakeFirst();

            if (existing) {
                const isExpired =
                    existing.expiration !== null &&
                    Number(existing.expiration) <= this.currentDate().getTime();

                if (!isExpired && existing.owner !== lockId) {
                    return false;
                }
            }

            // Check if any non-expired reader slots exist
            const readerCount = await trx
                .selectFrom("readerSemaphoreSlotEntry")
                .where("readerSemaphoreSlotEntry.key", "=", key)
                .where((eb) =>
                    eb.or([
                        eb("readerSemaphoreSlotEntry.expiration", "is", null),
                        eb(
                            "readerSemaphoreSlotEntry.expiration",
                            ">",
                            this.currentDate().getTime(),
                        ),
                    ]),
                )
                .select((eb) => eb.fn.countAll().as("count"))
                .executeTakeFirst();

            const readerCount_ = Number(readerCount?.count ?? 0);
            if (readerCount_ > 0) {
                return false;
            }

            const expiration = ttl?.toEndDate().getTime() ?? null;
            await trx
                .insertInto("writerLockEntry")
                .values({ key, owner: lockId, expiration })
                .$if(!this.isMysql, (eb) =>
                    eb.onConflict((oc) =>
                        oc.column("key").doUpdateSet({
                            key,
                            owner: lockId,
                            expiration,
                        }),
                    ),
                )
                .$if(this.isMysql, (eb) =>
                    eb.onDuplicateKeyUpdate({
                        key,
                        owner: lockId,
                        expiration,
                    }),
                )
                .execute();

            return true;
        });
    }

    async releaseWriter(
        key: string,
        lockId: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        if (this.isMysql) {
            return await this.transaction(async (trx) => {
                const existing = await trx
                    .selectFrom("writerLockEntry")
                    .where("writerLockEntry.key", "=", key)
                    .where("writerLockEntry.owner", "=", lockId)
                    .where((eb) =>
                        eb.or([
                            eb("writerLockEntry.expiration", "is", null),
                            eb(
                                "writerLockEntry.expiration",
                                ">",
                                this.currentDate().getTime(),
                            ),
                        ]),
                    )
                    .select("writerLockEntry.key")
                    .executeTakeFirst();

                if (!existing) {
                    return false;
                }

                await trx
                    .deleteFrom("writerLockEntry")
                    .where("writerLockEntry.key", "=", key)
                    .where("writerLockEntry.owner", "=", lockId)
                    .execute();

                return true;
            });
        }

        const result = await this.kysely
            .deleteFrom("writerLockEntry")
            .where("writerLockEntry.key", "=", key)
            .where("writerLockEntry.owner", "=", lockId)
            .where((eb) =>
                eb.or([
                    eb("writerLockEntry.expiration", "is", null),
                    eb(
                        "writerLockEntry.expiration",
                        ">",
                        this.currentDate().getTime(),
                    ),
                ]),
            )
            .returning("writerLockEntry.key")
            .executeTakeFirst();

        return result !== undefined;
    }

    async forceReleaseWriter(
        key: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        if (this.isMysql) {
            return await this.transaction(async (trx) => {
                const existing = await trx
                    .selectFrom("writerLockEntry")
                    .where("writerLockEntry.key", "=", key)
                    .where((eb) =>
                        eb.or([
                            eb("writerLockEntry.expiration", "is", null),
                            eb(
                                "writerLockEntry.expiration",
                                ">",
                                this.currentDate().getTime(),
                            ),
                        ]),
                    )
                    .select("writerLockEntry.key")
                    .executeTakeFirst();

                if (!existing) {
                    return false;
                }

                await trx
                    .deleteFrom("writerLockEntry")
                    .where("writerLockEntry.key", "=", key)
                    .execute();

                return true;
            });
        }

        const result = await this.kysely
            .deleteFrom("writerLockEntry")
            .where("writerLockEntry.key", "=", key)
            .where((eb) =>
                eb.or([
                    eb("writerLockEntry.expiration", "is", null),
                    eb(
                        "writerLockEntry.expiration",
                        ">",
                        this.currentDate().getTime(),
                    ),
                ]),
            )
            .returning("writerLockEntry.key")
            .executeTakeFirst();

        return result !== undefined;
    }

    async refreshWriter(
        key: string,
        lockId: string,
        ttl: TimeSpan,
        _context: IReadableContext,
    ): Promise<boolean> {
        const expiration = ttl.toEndDate().getTime();
        const result = await this.kysely
            .updateTable("writerLockEntry")
            .where("writerLockEntry.key", "=", key)
            .where("writerLockEntry.owner", "=", lockId)
            .where((eb) =>
                eb.and([
                    eb("writerLockEntry.expiration", "is not", null),
                    eb(
                        "writerLockEntry.expiration",
                        ">",
                        this.currentDate().getTime(),
                    ),
                ]),
            )
            .set({ expiration })
            .execute();

        return Number(result[0]?.numUpdatedRows ?? 0n) > 0;
    }

    private async checkWriterInTransaction(
        trx: Kysely<KyselySharedLockTables>,
        key: string,
    ): Promise<boolean> {
        const writer = await trx
            .selectFrom("writerLockEntry")
            .where("writerLockEntry.key", "=", key)
            .select(["writerLockEntry.expiration"])
            .executeTakeFirst();

        if (!writer) {
            return false;
        }

        const isExpired =
            writer.expiration !== null &&
            Number(writer.expiration) <= this.currentDate().getTime();

        return !isExpired;
    }

    private async ensureReaderSemaphore(
        trx: Kysely<KyselySharedLockTables>,
        key: string,
        limit: number,
    ): Promise<{ storedLimit: number } | null> {
        await trx
            .insertInto("readerSemaphoreEntry")
            .values({ key, limit })
            .$if(!this.isMysql, (eb) =>
                eb.onConflict((eb_) => eb_.column("key").doNothing()),
            )
            .$if(this.isMysql, (eb) => eb.onDuplicateKeyUpdate({ key }))
            .execute();

        const semaphore = await trx
            .selectFrom("readerSemaphoreEntry")
            .where("readerSemaphoreEntry.key", "=", key)
            .select("readerSemaphoreEntry.limit")
            .executeTakeFirst();

        if (!semaphore) {
            return null;
        }

        return { storedLimit: semaphore.limit };
    }

    private async countActiveReaderSlots(
        trx: Kysely<KyselySharedLockTables>,
        key: string,
    ): Promise<number> {
        const countResult = await trx
            .selectFrom("readerSemaphoreSlotEntry")
            .where("readerSemaphoreSlotEntry.key", "=", key)
            .where((eb) =>
                eb.or([
                    eb("readerSemaphoreSlotEntry.expiration", "is", null),
                    eb(
                        "readerSemaphoreSlotEntry.expiration",
                        ">",
                        this.currentDate().getTime(),
                    ),
                ]),
            )
            .select((eb) => eb.fn.countAll().as("count"))
            .executeTakeFirst();

        return Number(countResult?.count ?? 0);
    }

    private async upsertReaderSlot(
        trx: Kysely<KyselySharedLockTables>,
        key: string,
        lockId: string,
        ttl: TimeSpan | null,
    ): Promise<void> {
        const expiration = ttl?.toEndDate().getTime() ?? null;
        await trx
            .insertInto("readerSemaphoreSlotEntry")
            .values({ key, id: lockId, expiration })
            .$if(!this.isMysql, (eb) =>
                eb.onConflict((eb_) =>
                    eb_
                        .column("id")
                        .doUpdateSet({ key, id: lockId, expiration }),
                ),
            )
            .$if(this.isMysql, (eb) =>
                eb.onDuplicateKeyUpdate({ key, id: lockId, expiration }),
            )
            .execute();
    }

    async acquireReader(settings: SharedLockAcquireSettings): Promise<boolean> {
        const { context: _context, key, lockId, limit, ttl } = settings;

        return await this.transaction(async (trx) => {
            if (await this.checkWriterInTransaction(trx, key)) {
                return false;
            }

            const semaphore = await this.ensureReaderSemaphore(trx, key, limit);
            if (!semaphore) {
                return false;
            }

            const currentCount = await this.countActiveReaderSlots(trx, key);

            const effectiveLimit =
                currentCount === 0 ? limit : semaphore.storedLimit;

            if (currentCount >= effectiveLimit) {
                return false;
            }

            if (currentCount === 0 && limit !== semaphore.storedLimit) {
                await trx
                    .updateTable("readerSemaphoreEntry")
                    .where("readerSemaphoreEntry.key", "=", key)
                    .set({ limit })
                    .execute();
            }

            await this.upsertReaderSlot(trx, key, lockId, ttl);
            return true;
        });
    }

    async releaseReader(
        key: string,
        slotId: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        if (this.isMysql) {
            return await this.transaction(async (trx) => {
                const existing = await trx
                    .selectFrom("readerSemaphoreSlotEntry")
                    .where("readerSemaphoreSlotEntry.key", "=", key)
                    .where("readerSemaphoreSlotEntry.id", "=", slotId)
                    .where((eb) =>
                        eb.or([
                            eb(
                                "readerSemaphoreSlotEntry.expiration",
                                "is",
                                null,
                            ),
                            eb(
                                "readerSemaphoreSlotEntry.expiration",
                                ">",
                                this.currentDate().getTime(),
                            ),
                        ]),
                    )
                    .select("readerSemaphoreSlotEntry.id")
                    .executeTakeFirst();

                if (!existing) {
                    return false;
                }

                await trx
                    .deleteFrom("readerSemaphoreSlotEntry")
                    .where("readerSemaphoreSlotEntry.key", "=", key)
                    .where("readerSemaphoreSlotEntry.id", "=", slotId)
                    .execute();

                return true;
            });
        }

        const result = await this.kysely
            .deleteFrom("readerSemaphoreSlotEntry")
            .where("readerSemaphoreSlotEntry.key", "=", key)
            .where("readerSemaphoreSlotEntry.id", "=", slotId)
            .where((eb) =>
                eb.or([
                    eb("readerSemaphoreSlotEntry.expiration", "is", null),
                    eb(
                        "readerSemaphoreSlotEntry.expiration",
                        ">",
                        this.currentDate().getTime(),
                    ),
                ]),
            )
            .returning("readerSemaphoreSlotEntry.id")
            .executeTakeFirst();

        return result !== undefined;
    }

    async forceReleaseAllReaders(
        key: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        if (this.isMysql) {
            return await this.transaction(async (trx) => {
                const existing = await trx
                    .selectFrom("readerSemaphoreSlotEntry")
                    .where("readerSemaphoreSlotEntry.key", "=", key)
                    .where((eb) =>
                        eb.or([
                            eb(
                                "readerSemaphoreSlotEntry.expiration",
                                "is",
                                null,
                            ),
                            eb(
                                "readerSemaphoreSlotEntry.expiration",
                                ">",
                                this.currentDate().getTime(),
                            ),
                        ]),
                    )
                    .select("readerSemaphoreSlotEntry.id")
                    .executeTakeFirst();

                if (!existing) {
                    return false;
                }

                await trx
                    .deleteFrom("readerSemaphoreSlotEntry")
                    .where("readerSemaphoreSlotEntry.key", "=", key)
                    .execute();

                return true;
            });
        }

        const result = await this.kysely
            .deleteFrom("readerSemaphoreSlotEntry")
            .where("readerSemaphoreSlotEntry.key", "=", key)
            .where((eb) =>
                eb.or([
                    eb("readerSemaphoreSlotEntry.expiration", "is", null),
                    eb(
                        "readerSemaphoreSlotEntry.expiration",
                        ">",
                        this.currentDate().getTime(),
                    ),
                ]),
            )
            .returning("readerSemaphoreSlotEntry.id")
            .executeTakeFirst();

        return result !== undefined;
    }

    async refreshReader(
        key: string,
        slotId: string,
        ttl: TimeSpan,
        _context: IReadableContext,
    ): Promise<boolean> {
        const expiration = ttl.toEndDate().getTime();
        const result = await this.kysely
            .updateTable("readerSemaphoreSlotEntry")
            .where("readerSemaphoreSlotEntry.key", "=", key)
            .where("readerSemaphoreSlotEntry.id", "=", slotId)
            .where((eb) =>
                eb.and([
                    eb("readerSemaphoreSlotEntry.expiration", "is not", null),
                    eb(
                        "readerSemaphoreSlotEntry.expiration",
                        ">",
                        this.currentDate().getTime(),
                    ),
                ]),
            )
            .set({ expiration })
            .execute();

        return Number(result[0]?.numUpdatedRows ?? 0n) > 0;
    }

    private async deleteNonExpiredWriter(key: string): Promise<boolean> {
        if (this.isMysql) {
            return await this.transaction(async (trx) => {
                const existing = await trx
                    .selectFrom("writerLockEntry")
                    .where("writerLockEntry.key", "=", key)
                    .where((eb) =>
                        eb.or([
                            eb("writerLockEntry.expiration", "is", null),
                            eb(
                                "writerLockEntry.expiration",
                                ">",
                                this.currentDate().getTime(),
                            ),
                        ]),
                    )
                    .select("writerLockEntry.key")
                    .executeTakeFirst();

                if (!existing) {
                    return false;
                }

                await trx
                    .deleteFrom("writerLockEntry")
                    .where("writerLockEntry.key", "=", key)
                    .execute();

                return true;
            });
        }

        const result = await this.kysely
            .deleteFrom("writerLockEntry")
            .where("writerLockEntry.key", "=", key)
            .where((eb) =>
                eb.or([
                    eb("writerLockEntry.expiration", "is", null),
                    eb(
                        "writerLockEntry.expiration",
                        ">",
                        this.currentDate().getTime(),
                    ),
                ]),
            )
            .returning("writerLockEntry.key")
            .executeTakeFirst();

        return result !== undefined;
    }

    private async deleteNonExpiredReaderSlots(key: string): Promise<boolean> {
        if (this.isMysql) {
            return await this.transaction(async (trx) => {
                const existing = await trx
                    .selectFrom("readerSemaphoreSlotEntry")
                    .where("readerSemaphoreSlotEntry.key", "=", key)
                    .where((eb) =>
                        eb.or([
                            eb(
                                "readerSemaphoreSlotEntry.expiration",
                                "is",
                                null,
                            ),
                            eb(
                                "readerSemaphoreSlotEntry.expiration",
                                ">",
                                this.currentDate().getTime(),
                            ),
                        ]),
                    )
                    .select("readerSemaphoreSlotEntry.id")
                    .executeTakeFirst();

                if (!existing) {
                    return false;
                }

                await trx
                    .deleteFrom("readerSemaphoreSlotEntry")
                    .where("readerSemaphoreSlotEntry.key", "=", key)
                    .execute();

                return true;
            });
        }

        const result = await this.kysely
            .deleteFrom("readerSemaphoreSlotEntry")
            .where("readerSemaphoreSlotEntry.key", "=", key)
            .where((eb) =>
                eb.or([
                    eb("readerSemaphoreSlotEntry.expiration", "is", null),
                    eb(
                        "readerSemaphoreSlotEntry.expiration",
                        ">",
                        this.currentDate().getTime(),
                    ),
                ]),
            )
            .returning("readerSemaphoreSlotEntry.id")
            .executeTakeFirst();

        return result !== undefined;
    }

    async forceRelease(
        key: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        const writerReleased = await this.deleteNonExpiredWriter(key);
        const readerReleased = await this.deleteNonExpiredReaderSlots(key);
        return writerReleased || readerReleased;
    }

    private async getWriterState(
        key: string,
    ): Promise<IWriterLockAdapterState | null> {
        const writerRow = await this.kysely
            .selectFrom("writerLockEntry")
            .where("writerLockEntry.key", "=", key)
            .select(["writerLockEntry.owner", "writerLockEntry.expiration"])
            .executeTakeFirst();

        if (!writerRow) {
            return null;
        }

        const isExpired =
            writerRow.expiration !== null &&
            Number(writerRow.expiration) <= this.currentDate().getTime();

        if (isExpired) {
            return null;
        }

        return {
            owner: writerRow.owner,
            expiration:
                writerRow.expiration === null
                    ? null
                    : new Date(Number(writerRow.expiration)),
        };
    }

    private async getReaderState(
        key: string,
    ): Promise<IReaderSemaphoreAdapterState | null> {
        const semaphore = await this.kysely
            .selectFrom("readerSemaphoreEntry")
            .where("readerSemaphoreEntry.key", "=", key)
            .select("readerSemaphoreEntry.limit")
            .executeTakeFirst();

        if (!semaphore) {
            return null;
        }

        const slots = await this.kysely
            .selectFrom("readerSemaphoreSlotEntry")
            .where("readerSemaphoreSlotEntry.key", "=", key)
            .select([
                "readerSemaphoreSlotEntry.id",
                "readerSemaphoreSlotEntry.expiration",
            ])
            .execute();

        const acquiredSlots = new Map<string, Date | null>();
        for (const slot of slots) {
            if (
                slot.expiration !== null &&
                Number(slot.expiration) <= this.currentDate().getTime()
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

        if (acquiredSlots.size === 0) {
            return null;
        }

        return {
            limit: semaphore.limit,
            acquiredSlots,
        };
    }

    async getState(
        key: string,
        _context: IReadableContext,
    ): Promise<ISharedLockAdapterState | null> {
        const [writer, reader] = await Promise.all([
            this.getWriterState(key),
            this.getReaderState(key),
        ]);

        if (writer === null && reader === null) {
            return null;
        }

        return { writer, reader };
    }
}
