/**
 * @module Lock
 */

import { MysqlAdapter, Transaction, type Kysely } from "kysely";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type ILockAdapter,
    type ILockAdapterState,
} from "@/lock/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    type IDeinitizable,
    type IInitizable,
    type InvokableFn,
    type IPrunable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/kysely-lock-adapter"`
 * @group Adapters
 */
export type KyselyLockTable = {
    key: string;
    owner: string;
    // In ms since unix epoch.
    // The type in mysql is bigint and will be returned as a string.
    // Some sql database drivers have support for js bigint if enabled. Meaning bigint will be returned.
    expiration: number | bigint | string | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/kysely-lock-adapter"`
 * @group Adapters
 */
export type KyselyLockTables = {
    lock: KyselyLockTable;
};

/**
 * Configuration for `KyselyLockAdapter`.
 * Requires a Kysely database instance with the lock schema applied.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/kysely-lock-adapter"`
 * @group Adapters
 */
export type KyselyLockAdapterSettings = {
    /**
     * The Kysely database instance typed with the required lock table.
     */
    kysely: Kysely<KyselyLockTables>;

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
     * When `true`, a background task periodically removes expired lock records.
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
 * To utilize the `KyselyLockAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 *
 * Note in order to use `KyselyLockAdapter` correctly, ensure you use a single, consistent database across all server instances and use a database that has support for transactions.
 * The adapter have been tested with `sqlite`, `postgres` and `mysql` databases.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/kysely-lock-adapter"`
 * @group Adapters
 */
export class KyselyLockAdapter
    implements ILockAdapter, IDeinitizable, IInitizable, IPrunable
{
    private readonly kysely: Kysely<KyselyLockTables>;
    private readonly expiredKeysRemovalInterval: TimeSpan;
    private readonly shouldRemoveExpiredKeys: boolean;
    private intervalId: string | number | NodeJS.Timeout | undefined | null =
        null;
    private readonly isMysql: boolean;
    private readonly enableTransactions: boolean;

    /**
     * @example
     * ```ts
     * import { KyselyLockAdapter } from "@daiso-tech/core/lock/kysely-lock-adapter";
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const lockAdapter = new KyselyLockAdapter({
     *   kysely: new Kysely({
     *     dialect: new SqliteDialect({
     *       database: new Sqlite("local.db"),
     *     }),
     *   }),
     * });
     * // You need initialize the adapter once before using it.
     * await lockAdapter.init();
     * ```
     */
    constructor(settings: KyselyLockAdapterSettings) {
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
        trxFn: InvokableFn<[trx: Kysely<KyselyLockTables>], Promise<TValue>>,
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

    /**
     * Removes all related lock tables and their rows.
     * Note all lock data will be removed.
     */
    async deInit(): Promise<void> {
        if (this.shouldRemoveExpiredKeys && this.intervalId !== null) {
            clearInterval(this.intervalId);
        }

        // Should throw if the index does not exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .dropIndex("lock_expiration")
                .on("lock")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.kysely.schema.dropTable("lock").execute();
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Creates all related tables and indexes.
     * Note the `init` method needs to be called once before using the adapter.
     */
    async init(): Promise<void> {
        // Should throw if the table already exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .createTable("lock")
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
                .createIndex("lock_expiration")
                .on("lock")
                .column("expiration")
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

    async removeAllExpired(): Promise<void> {
        await this.kysely
            .deleteFrom("lock")
            .where("lock.expiration", "<=", Date.now())
            .execute();
    }

    private async _find(key: string): Promise<ILockAdapterState | null> {
        const row = await this.kysely
            .selectFrom("lock")
            .where("lock.key", "=", key)
            .select(["lock.owner", "lock.expiration"])
            .executeTakeFirst();

        if (row === undefined) {
            return null;
        }

        if (row.expiration !== null && Number(row.expiration) <= Date.now()) {
            return null;
        }

        return {
            owner: row.owner,
            expiration:
                row.expiration === null
                    ? null
                    : new Date(Number(row.expiration)),
        };
    }

    async acquire(
        _context: IReadableContext,
        key: string,
        lockId: string,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        return await this._transaction(async (trx) => {
            const existing = await trx
                .selectFrom("lock")
                .where("lock.key", "=", key)
                .select(["lock.owner", "lock.expiration"])
                .executeTakeFirst();

            if (existing) {
                const isExpired =
                    existing.expiration !== null &&
                    Number(existing.expiration) <= Date.now();

                if (!isExpired && existing.owner !== lockId) {
                    return false;
                }
            }

            const expiration = ttl?.toEndDate().getTime() ?? null;

            await trx
                .insertInto("lock")
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

    async release(
        _context: IReadableContext,
        key: string,
        lockId: string,
    ): Promise<boolean> {
        if (this.isMysql) {
            return await this._transaction(async (trx) => {
                const existing = await trx
                    .selectFrom("lock")
                    .where("lock.key", "=", key)
                    .where("lock.owner", "=", lockId)
                    .where((eb) =>
                        eb.or([
                            eb("lock.expiration", "is", null),
                            eb("lock.expiration", ">", Date.now()),
                        ]),
                    )
                    .select("lock.key")
                    .executeTakeFirst();

                if (!existing) {
                    return false;
                }

                await trx
                    .deleteFrom("lock")
                    .where("lock.key", "=", key)
                    .where("lock.owner", "=", lockId)
                    .execute();

                return true;
            });
        }

        const result = await this.kysely
            .deleteFrom("lock")
            .where("lock.key", "=", key)
            .where("lock.owner", "=", lockId)
            .where((eb) =>
                eb.or([
                    eb("lock.expiration", "is", null),
                    eb("lock.expiration", ">", Date.now()),
                ]),
            )
            .returning("lock.key")
            .executeTakeFirst();

        return result !== undefined;
    }

    async forceRelease(
        _context: IReadableContext,
        key: string,
    ): Promise<boolean> {
        if (this.isMysql) {
            return await this._transaction(async (trx) => {
                const existing = await trx
                    .selectFrom("lock")
                    .where("lock.key", "=", key)
                    .where((eb) =>
                        eb.or([
                            eb("lock.expiration", "is", null),
                            eb("lock.expiration", ">", Date.now()),
                        ]),
                    )
                    .select("lock.key")
                    .executeTakeFirst();

                if (!existing) {
                    return false;
                }

                await trx
                    .deleteFrom("lock")
                    .where("lock.key", "=", key)
                    .execute();

                return true;
            });
        }

        const result = await this.kysely
            .deleteFrom("lock")
            .where("lock.key", "=", key)
            .where((eb) =>
                eb.or([
                    eb("lock.expiration", "is", null),
                    eb("lock.expiration", ">", Date.now()),
                ]),
            )
            .returning("lock.key")
            .executeTakeFirst();

        return result !== undefined;
    }

    async refresh(
        _context: IReadableContext,
        key: string,
        lockId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        const expiration = ttl.toEndDate().getTime();
        const result = await this.kysely
            .updateTable("lock")
            .where("lock.key", "=", key)
            .where("lock.owner", "=", lockId)
            .where((eb) =>
                eb.and([
                    eb("lock.expiration", "is not", null),
                    eb("lock.expiration", ">", Date.now()),
                ]),
            )
            .set({ expiration })
            .execute();

        return Number(result[0]?.numUpdatedRows ?? 0n) > 0;
    }

    async getState(
        _context: IReadableContext,
        key: string,
    ): Promise<ILockAdapterState | null> {
        return await this._find(key);
    }
}
