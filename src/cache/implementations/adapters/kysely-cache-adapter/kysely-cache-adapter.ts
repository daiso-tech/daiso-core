/**
 * @module Cache
 */

import { MysqlAdapter, Transaction, type Kysely } from "kysely";

import { type ICacheAdapter } from "@/cache/contracts/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
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
 * Configuration for `KyselyCacheAdapter`.
 * Requires a Kysely database instance and a serde for serialising cache values to strings.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/kysely-cache-adapter"`
 * @group Adapters
 */
export type KyselyCacheAdapterSettings = {
    /**
     * The Kysely database instance with the required cache schema tables applied.
     */
    kysely: Kysely<KyselyCacheTables>;

    /**
     * Serde instance for serializing and deserializing cache values to and from strings.
     */
    serde: ISerde<string>;

    /**
     * How often expired cache entries are automatically removed in the background.
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromMinutes(1)
     * ```
     */
    expiredKeysRemovalInterval?: ITimeSpan;

    /**
     * When `true`, a background task periodically removes expired keys.
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
 * To utilize the `KyselyCacheAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 * The adapter have been tested with `sqlite`, `postgres` and `mysql` databases.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/kysely-cache-adapter"`
 * @group Adapters
 */
export class KyselyCacheAdapter<TType = unknown>
    implements ICacheAdapter<TType>, IInitizable, IDeinitizable, IPrunable
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

    private _transaction<TValue>(
        _context: IReadableContext,
        trxFn: InvokableFn<[trx: Kysely<KyselyCacheTables>], Promise<TValue>>,
    ): Promise<TValue> {
        if (this.enableTransactions) {
            return this.kysely.transaction().execute(async (trx) => {
                return await trxFn(trx);
            });
        }
        return trxFn(this.kysely);
    }

    async get(_context: IReadableContext, key: string): Promise<TType | null> {
        const row = await this.kysely
            .selectFrom("cache")
            .where("cache.key", "=", key)
            .select(["cache.value", "cache.expiration"])
            .executeTakeFirst();

        if (!row) {
            return null;
        }

        if (row.expiration !== null && Number(row.expiration) <= Date.now()) {
            return null;
        }

        return this.serde.deserialize(row.value);
    }

    async getAndRemove(
        _context: IReadableContext,
        key: string,
    ): Promise<TType | null> {
        if (this.isMysql) {
            return await this._transaction(_context, async (trx) => {
                const row = await trx
                    .selectFrom("cache")
                    .where("cache.key", "=", key)
                    .select(["cache.value", "cache.expiration"])
                    .executeTakeFirst();

                if (!row) {
                    return null;
                }

                await trx
                    .deleteFrom("cache")
                    .where("cache.key", "=", key)
                    .execute();

                if (
                    row.expiration !== null &&
                    Number(row.expiration) <= Date.now()
                ) {
                    return null;
                }

                return this.serde.deserialize(row.value);
            });
        }

        const row = await this.kysely
            .deleteFrom("cache")
            .where("cache.key", "=", key)
            .returning(["cache.value", "cache.expiration"])
            .executeTakeFirst();

        if (!row) {
            return null;
        }

        if (row.expiration !== null && Number(row.expiration) <= Date.now()) {
            return null;
        }

        return this.serde.deserialize(row.value);
    }

    async add(
        _context: IReadableContext,
        key: string,
        value: TType,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        return await this._transaction(_context, async (trx) => {
            const existing = await trx
                .selectFrom("cache")
                .where("cache.key", "=", key)
                .select("cache.expiration")
                .executeTakeFirst();

            if (existing) {
                const isExpired =
                    existing.expiration !== null &&
                    Number(existing.expiration) <= Date.now();
                if (!isExpired) {
                    return false;
                }
            }

            const serializedValue = this.serde.serialize(value);
            const expiration = ttl?.toEndDate().getTime() ?? null;

            await trx
                .insertInto("cache")
                .values({ key, value: serializedValue, expiration })
                .$if(!this.isMysql, (eb) =>
                    eb.onConflict((oc) =>
                        oc.column("key").doUpdateSet({
                            key,
                            value: serializedValue,
                            expiration,
                        }),
                    ),
                )
                .$if(this.isMysql, (eb) =>
                    eb.onDuplicateKeyUpdate({
                        key,
                        value: serializedValue,
                        expiration,
                    }),
                )
                .execute();

            return true;
        });
    }

    async getOrAdd(
        _context: IReadableContext,
        key: string,
        valueToAdd: TType,
        ttl: TimeSpan | null,
    ): Promise<TType> {
        return await this._transaction(_context, async (trx) => {
            const existing = await trx
                .selectFrom("cache")
                .where("cache.key", "=", key)
                .select(["cache.value", "cache.expiration"])
                .executeTakeFirst();

            if (existing) {
                const isExpired =
                    existing.expiration !== null &&
                    Number(existing.expiration) <= Date.now();
                if (!isExpired) {
                    return this.serde.deserialize(existing.value);
                }
            }

            const serializedValue = this.serde.serialize(valueToAdd);
            const expiration = ttl?.toEndDate().getTime() ?? null;

            await trx
                .insertInto("cache")
                .values({ key, value: serializedValue, expiration })
                .$if(!this.isMysql, (eb) =>
                    eb.onConflict((oc) =>
                        oc.column("key").doUpdateSet({
                            key,
                            value: serializedValue,
                            expiration,
                        }),
                    ),
                )
                .$if(this.isMysql, (eb) =>
                    eb.onDuplicateKeyUpdate({
                        key,
                        value: serializedValue,
                        expiration,
                    }),
                )
                .execute();

            return valueToAdd;
        });
    }

    async put(
        _context: IReadableContext,
        key: string,
        value: TType,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        return await this._transaction(_context, async (trx) => {
            const existing = await trx
                .selectFrom("cache")
                .where("cache.key", "=", key)
                .select("cache.expiration")
                .executeTakeFirst();

            let keyExistedAndNotExpired = false;
            if (existing) {
                const isExpired =
                    existing.expiration !== null &&
                    Number(existing.expiration) <= Date.now();
                keyExistedAndNotExpired = !isExpired;
            }

            const serializedValue = this.serde.serialize(value);
            const expiration = ttl?.toEndDate().getTime() ?? null;

            await trx
                .insertInto("cache")
                .values({ key, value: serializedValue, expiration })
                .$if(!this.isMysql, (eb) =>
                    eb.onConflict((oc) =>
                        oc.column("key").doUpdateSet({
                            key,
                            value: serializedValue,
                            expiration,
                        }),
                    ),
                )
                .$if(this.isMysql, (eb) =>
                    eb.onDuplicateKeyUpdate({
                        key,
                        value: serializedValue,
                        expiration,
                    }),
                )
                .execute();

            return keyExistedAndNotExpired;
        });
    }

    async update(
        _context: IReadableContext,
        key: string,
        value: TType,
    ): Promise<boolean> {
        const serializedValue = this.serde.serialize(value);
        const result = await this.kysely
            .updateTable("cache")
            .where("cache.key", "=", key)
            .where((eb) =>
                eb.or([
                    eb("cache.expiration", "is", null),
                    eb("cache.expiration", ">", Date.now()),
                ]),
            )
            .set({ value: serializedValue })
            .execute();

        return Number(result[0]?.numUpdatedRows ?? 0n) > 0;
    }

    async increment(
        _context: IReadableContext,
        key: string,
        value: number,
    ): Promise<boolean> {
        return await this._transaction(_context, async (trx) => {
            const existing = await trx
                .selectFrom("cache")
                .where("cache.key", "=", key)
                .where((eb) =>
                    eb.or([
                        eb("cache.expiration", "is", null),
                        eb("cache.expiration", ">", Date.now()),
                    ]),
                )
                .select("cache.value")
                .executeTakeFirst();

            if (!existing) {
                return false;
            }

            const currentValue = this.serde.deserialize(existing.value);

            if (typeof currentValue !== "number" || isNaN(currentValue)) {
                throw new TypeError(
                    `Unable to increment or decrement none number type key "${key}"`,
                );
            }

            const newValue = currentValue + value;

            await trx
                .updateTable("cache")
                .where("cache.key", "=", key)
                .set({ value: this.serde.serialize(newValue) })
                .execute();

            return true;
        });
    }

    async removeMany(
        _context: IReadableContext,
        keys: Array<string>,
    ): Promise<boolean> {
        if (keys.length === 0) {
            return false;
        }

        const result = await this.kysely
            .deleteFrom("cache")
            .where("cache.key", "in", keys)
            .execute();

        return Number(result[0]?.numDeletedRows ?? 0n) > 0;
    }

    async removeAll(_context: IReadableContext): Promise<void> {
        await this.kysely.deleteFrom("cache").execute();
    }

    async removeByKeyPrefix(
        _context: IReadableContext,
        prefix: string,
    ): Promise<void> {
        await this.kysely
            .deleteFrom("cache")
            .where("cache.key", "like", `${prefix}%`)
            .execute();
    }
}
