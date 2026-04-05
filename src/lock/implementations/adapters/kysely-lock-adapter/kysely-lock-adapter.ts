/**
 * @module Lock
 */

import { MysqlAdapter, Transaction, type Kysely } from "kysely";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type IDatabaseLockAdapter,
    type IDatabaseLockTransaction,
    type ILockData,
    type ILockExpirationData,
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
 * IMPORT_PATH: `"@daiso-tech/core/lock/kysely-lock-adapter"`
 * @group Adapters
 */
export type KyselyLockAdapterSettings = {
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

async function find(
    kysely: Kysely<KyselyLockTables>,
    key: string,
): Promise<ILockData | null> {
    const row = await kysely
        .selectFrom("lock")
        .where("lock.key", "=", key)
        .select(["lock.owner", "lock.expiration"])
        .executeTakeFirst();
    if (row === undefined) {
        return null;
    }
    if (row.expiration === null) {
        return {
            owner: row.owner,
            expiration: null,
        };
    }
    return {
        owner: row.owner,
        expiration: new Date(Number(row.expiration)),
    };
}

/**
 * @internal
 */
class DatabaseLockTransaction implements IDatabaseLockTransaction {
    private readonly isMysql: boolean;

    constructor(private readonly kysely: Kysely<KyselyLockTables>) {
        this.isMysql =
            this.kysely.getExecutor().adapter instanceof MysqlAdapter;
    }

    async find(
        _context: IReadableContext,
        key: string,
    ): Promise<ILockData | null> {
        return await find(this.kysely, key);
    }

    async upsert(
        _context: IReadableContext,
        key: string,
        lockId: string,
        expiration: Date | null,
    ): Promise<void> {
        const expirationAsMs = expiration?.getTime() ?? null;
        await this.kysely
            .insertInto("lock")
            .values({
                key,
                owner: lockId,
                expiration: expirationAsMs,
            })
            .$if(!this.isMysql, (eb) =>
                eb.onConflict((eb) =>
                    eb.column("key").doUpdateSet({
                        key,
                        owner: lockId,
                        expiration: expirationAsMs,
                    }),
                ),
            )
            .$if(this.isMysql, (eb) =>
                eb.onDuplicateKeyUpdate({
                    key,
                    owner: lockId,
                    expiration: expirationAsMs,
                }),
            )
            .execute();
    }
}

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
    implements IDatabaseLockAdapter, IDeinitizable, IInitizable, IPrunable
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

    async transaction<TReturn>(
        _context: IReadableContext,
        fn: InvokableFn<
            [transaction: IDatabaseLockTransaction],
            Promise<TReturn>
        >,
    ): Promise<TReturn> {
        return await this._transaction(async (trx) => {
            return await fn(new DatabaseLockTransaction(trx));
        });
    }

    async remove(
        _context: IReadableContext,
        key: string,
    ): Promise<ILockExpirationData | null> {
        let result: Pick<KyselyLockTable, "expiration"> | undefined;
        if (this.isMysql) {
            result = await this._transaction(async (trx) => {
                const row = await trx
                    .selectFrom("lock")
                    .where("lock.key", "=", key)
                    .select("lock.expiration")
                    .executeTakeFirst();
                await trx
                    .deleteFrom("lock")
                    .where("lock.key", "=", key)
                    .executeTakeFirst();
                return row;
            });
        } else {
            result = await this.kysely
                .deleteFrom("lock")
                .where("lock.key", "=", key)
                .returning(["lock.expiration"])
                .executeTakeFirst();
        }
        if (result === undefined) {
            return null;
        }
        if (result.expiration === null) {
            return {
                expiration: null,
            };
        }
        return {
            expiration: new Date(Number(result.expiration)),
        };
    }

    async removeIfOwner(
        _context: IReadableContext,
        key: string,
        lockId: string,
    ): Promise<ILockData | null> {
        let row: Pick<KyselyLockTable, "owner" | "expiration"> | undefined;
        if (this.isMysql) {
            row = await this._transaction(async (trx) => {
                const row = await trx
                    .selectFrom("lock")
                    .where("lock.key", "=", key)
                    .where("lock.owner", "=", lockId)
                    .select(["lock.expiration", "lock.owner"])
                    .executeTakeFirst();
                await trx
                    .deleteFrom("lock")
                    .where("lock.key", "=", key)
                    .where("lock.owner", "=", lockId)
                    .execute();
                return row;
            });
        } else {
            row = await this.kysely
                .deleteFrom("lock")
                .where("lock.key", "=", key)
                .where("lock.owner", "=", lockId)
                .returning(["lock.expiration", "lock.owner"])
                .executeTakeFirst();
        }

        if (row === undefined) {
            return null;
        }

        const { expiration } = row;
        if (expiration === null) {
            return {
                owner: row.owner,
                expiration: null,
            };
        }

        return {
            owner: row.owner,
            expiration: new Date(Number(expiration)),
        };
    }

    async updateExpiration(
        _context: IReadableContext,
        key: string,
        lockId: string,
        expiration: Date,
    ): Promise<number> {
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
            .set({
                expiration: expiration.getTime(),
            })
            .executeTakeFirst();
        return Number(result.numUpdatedRows);
    }

    async find(
        _context: IReadableContext,
        key: string,
    ): Promise<ILockData | null> {
        return await find(this.kysely, key);
    }
}
