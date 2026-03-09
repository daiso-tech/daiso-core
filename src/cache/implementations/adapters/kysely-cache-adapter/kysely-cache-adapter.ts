/**
 * @module Cache
 */

import { MysqlAdapter, Transaction, type Kysely } from "kysely";

import {
    type ICacheData,
    type ICacheDataExpiration,
    type IDatabaseCacheAdapter,
    type IDatabaseCacheTransaction,
} from "@/cache/contracts/_module.js";
import { type ISerde } from "@/serde/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    type IDeinitizable,
    type IInitizable,
    type InvokableFn,
    type IPrunable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache/kysely-cache-adapter"`
 * @group Adapters
 */
export type KyselyCacheTable = {
    key: string;
    value: string;
    // In ms since unix epoch
    expiration: number | string | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache/kysely-cache-adapter"`
 * @group Adapters
 */
export type KyselyCacheTables = {
    cache: KyselyCacheTable;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache/kysely-cache-adapter"`
 * @group Adapters
 */
export type KyselyCacheAdapterSettings = {
    kysely: Kysely<KyselyCacheTables>;

    serde: ISerde<string>;

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

/**
 * @internal
 */
export class DatabaseCacheTransaction<TType>
    implements IDatabaseCacheTransaction<TType>
{
    private readonly isMysql: boolean;

    constructor(
        private readonly kysely: Kysely<KyselyCacheTables>,
        private readonly serde: ISerde<string>,
    ) {
        this.isMysql =
            this.kysely.getExecutor().adapter instanceof MysqlAdapter;
    }

    async find(key: string): Promise<ICacheData<TType> | null> {
        const cacheData = await this.kysely
            .selectFrom("cache")
            .where("cache.key", "=", key)
            .select(["cache.expiration", "cache.value"])
            .executeTakeFirst();

        if (cacheData === undefined) {
            return null;
        }
        return {
            value: this.serde.deserialize(cacheData.value),
            expiration:
                cacheData.expiration === null
                    ? null
                    : new Date(Number(cacheData.expiration)),
        };
    }

    async upsert(
        key: string,
        value: TType,
        expiration?: Date | null,
    ): Promise<void> {
        let expirationAsMs: number | null | undefined;
        if (expiration instanceof Date) {
            expirationAsMs = expiration.getTime();
        } else {
            expirationAsMs = expiration;
        }
        const serializedValue = this.serde.serialize(value);
        await this.kysely
            .insertInto("cache")
            .values({
                key,
                value: serializedValue,
                expiration: expirationAsMs,
            })
            .$if(!this.isMysql, (eb) =>
                eb.onConflict((eb) =>
                    eb.column("key").doUpdateSet({
                        key,
                        value: serializedValue,
                        expiration: expirationAsMs,
                    }),
                ),
            )
            .$if(this.isMysql, (eb) =>
                eb.onDuplicateKeyUpdate({
                    key,
                    value: serializedValue,
                    expiration: expirationAsMs,
                }),
            )
            .execute();
    }
}

/**
 * To utilize the `KyselyCacheAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 * The adapter have been tested with `sqlite`, `postgres` and `mysql` databases.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/kysely-cache-adapter"`
 * @group Adapters
 */
export class KyselyCacheAdapter<TType = unknown>
    implements
        IDatabaseCacheAdapter<TType>,
        IInitizable,
        IDeinitizable,
        IPrunable
{
    private readonly isMysql: boolean;
    private readonly serde: ISerde<string>;
    private readonly kysely: Kysely<KyselyCacheTables>;
    private readonly shouldRemoveExpiredKeys: boolean;
    private readonly expiredKeysRemovalInterval: TimeSpan;
    private timeoutId: NodeJS.Timeout | string | number | null = null;
    private readonly enableTransactions: boolean;

    /**
     * @example
     * ```ts
     * import { KyselyCacheAdapter } from "@daiso-tech/core/cache/kysely-cache-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter"
     * import SQLite from 'better-sqlite3'
     * import { Kysely, SqliteDialect } from 'kysely'
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const cacheAdapter = new KyselyCacheAdapter({
     *   kysely: new Kysely({
     *     dialect: new SqliteDialect({
     *       database: new Sqlite("local.db"),
     *     }),
     *   }),
     *   serde,
     * });
     * // You need initialize the adapter once before using it.
     * await cacheAdapter.init();
     * ```
     */
    constructor(settings: KyselyCacheAdapterSettings) {
        const {
            kysely,
            serde,
            expiredKeysRemovalInterval = TimeSpan.fromMinutes(1),
            shouldRemoveExpiredKeys = true,
            enableTransactions = !(settings.kysely instanceof Transaction),
        } = settings;
        this.enableTransactions = enableTransactions;
        this.kysely = kysely;
        this.serde = serde;
        this.expiredKeysRemovalInterval = TimeSpan.fromTimeSpan(
            expiredKeysRemovalInterval,
        );
        this.shouldRemoveExpiredKeys = shouldRemoveExpiredKeys;
        this.isMysql =
            this.kysely.getExecutor().adapter instanceof MysqlAdapter;
    }

    async removeAllExpired(): Promise<void> {
        await this.kysely
            .deleteFrom("cache")
            .where("cache.expiration", "<=", Date.now())
            .execute();
    }

    async init(): Promise<void> {
        // Should throw if the table already exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .createTable("cache")
                .addColumn("key", "varchar(255)", (col) => col.primaryKey())
                .addColumn("value", "varchar(255)", (col) => col.notNull())
                .addColumn("expiration", "bigint")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the index already exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .createIndex("cache_expiration")
                .on("cache")
                .columns(["expiration"])
                .execute();
        } catch {
            /* EMPTY */
        }

        if (this.shouldRemoveExpiredKeys && this.timeoutId === null) {
            this.timeoutId = setInterval(() => {
                void this.removeAllExpired();
            }, this.expiredKeysRemovalInterval.toMilliseconds());
        }
    }

    /**
     * Removes all related cache tables and their rows.
     * Note all cache data will be removed.
     */
    async deInit(): Promise<void> {
        if (this.shouldRemoveExpiredKeys && this.timeoutId !== null) {
            clearInterval(this.timeoutId);
        }

        // Should throw if the index does not exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .dropIndex("cache_expiration")
                .on("cache")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.kysely.schema.dropTable("cache").execute();
        } catch {
            /* EMPTY */
        }
    }

    async find(key: string): Promise<ICacheData<TType> | null> {
        const cacheData = await this.kysely
            .selectFrom("cache")
            .where("cache.key", "=", key)
            .select(["cache.expiration", "cache.value"])
            .executeTakeFirst();

        if (cacheData === undefined) {
            return null;
        }
        return {
            value: this.serde.deserialize(cacheData.value),
            expiration:
                cacheData.expiration === null
                    ? null
                    : new Date(Number(cacheData.expiration)),
        };
    }

    private _transaction<TValue>(
        trxFn: InvokableFn<[trx: Kysely<KyselyCacheTables>], Promise<TValue>>,
    ): Promise<TValue> {
        if (this.enableTransactions) {
            return this.kysely.transaction().execute(async (trx) => {
                return await trxFn(trx);
            });
        }
        return trxFn(this.kysely);
    }

    async transaction<TValue>(
        trxFn: InvokableFn<
            [trx: IDatabaseCacheTransaction<TType>],
            Promise<TValue>
        >,
    ): Promise<TValue> {
        return await this._transaction((trx) =>
            trxFn(new DatabaseCacheTransaction(trx, this.serde)),
        );
    }

    async update(
        key: string,
        value: TType,
    ): Promise<ICacheDataExpiration | null> {
        let row: Pick<KyselyCacheTable, "expiration"> | undefined;
        const serializedValue = this.serde.serialize(value);
        if (this.isMysql) {
            row = await this._transaction(async (trx) => {
                const rows = await trx
                    .selectFrom("cache")
                    .where("cache.key", "=", key)
                    .select("cache.expiration")
                    .executeTakeFirst();
                await trx
                    .updateTable("cache")
                    .where("cache.key", "=", key)
                    .set({
                        value: serializedValue,
                    })
                    .execute();
                return rows;
            });
        } else {
            row = await this.kysely
                .updateTable("cache")
                .where("cache.key", "=", key)
                .set({
                    value: serializedValue,
                })
                .returning("cache.expiration")
                .executeTakeFirst();
        }
        if (row === undefined) {
            return null;
        }
        return {
            expiration:
                row.expiration === null
                    ? null
                    : new Date(Number(row.expiration)),
        };
    }

    async removeMany(
        keys: Array<string>,
    ): Promise<Array<ICacheDataExpiration>> {
        let rows: Array<Pick<KyselyCacheTable, "expiration">>;
        if (this.isMysql) {
            rows = await this._transaction(async (trx) => {
                const rows = await trx
                    .selectFrom("cache")
                    .where("cache.key", "in", keys)
                    .select("cache.expiration")
                    .execute();
                await trx
                    .deleteFrom("cache")
                    .where("cache.key", "in", keys)
                    .execute();
                return rows;
            });
        } else {
            rows = await this.kysely
                .deleteFrom("cache")
                .where("cache.key", "in", keys)
                .returning("cache.expiration")
                .execute();
        }
        return rows.map<ICacheDataExpiration>((row) => {
            return {
                expiration:
                    row.expiration === null
                        ? null
                        : new Date(Number(row.expiration)),
            };
        });
    }

    async removeAll(): Promise<void> {
        await this.kysely.deleteFrom("cache").execute();
    }

    async removeByKeyPrefix(prefix: string): Promise<void> {
        await this.kysely
            .deleteFrom("cache")
            .where("cache.key", "like", `${prefix}%`)
            .execute();
    }
}
