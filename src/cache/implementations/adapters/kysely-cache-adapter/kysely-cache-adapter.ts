/**
 * @module Cache
 */

import { MysqlAdapter } from "kysely";

import type { Kysely } from "kysely";

import type { ICacheAdapter } from "@/cache/contracts/_module.js";
import type { ISerde } from "@/serde/contracts/_module.js";
import type {
    IDeinitizable,
    IInitizable,
    InvocableFn,
    IPrunable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/cache/kysely-cache-adapter"`
 * @group Adapters
 */
export type KyselyCacheEntryTable = {
    key: string;
    value: string;
    // In ms since unix epoch
    expiration: number | string | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/cache/kysely-cache-adapter"`
 * @group Adapters
 */
export type KyselyCacheTables = {
    cache: KyselyCacheEntryTable;
};

/**
 * Configuration for `KyselyCacheAdapter`.
 * Requires a Kysely database instance and a serde for serialising cache values to strings.
 *
 * IMPORT_PATH: `"eridu-tech/cache/kysely-cache-adapter"`
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
};

/**
 * To utilize the `KyselyCacheAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 * The adapter have been tested with `sqlite`, `postgres` and `mysql` databases.
 *
 * IMPORT_PATH: `"eridu-tech/cache/kysely-cache-adapter"`
 * @group Adapters
 */
export class KyselyCacheAdapter<TType = unknown>
    implements ICacheAdapter<TType>, IInitizable, IDeinitizable, IPrunable
{
    private readonly isMysql: boolean;
    private readonly serde: ISerde<string>;
    private readonly kysely: Kysely<KyselyCacheTables>;

    /**
     * @example
     * ```ts
     * import { KyselyCacheAdapter } from "eridu-tech/cache/kysely-cache-adapter";
     * import { Serde } from "eridu-tech/serde";
     * import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter"
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
        const { kysely, serde } = settings;
        this.kysely = kysely;
        this.serde = serde;
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
    }

    /**
     * Removes all related cache tables and their rows.
     * Note all cache data will be removed.
     */
    async deInit(): Promise<void> {
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

    private transaction<TValue>(
        trxFn: InvocableFn<[trx: Kysely<KyselyCacheTables>], Promise<TValue>>,
    ): Promise<TValue> {
        return this.kysely.transaction().execute(async (trx) => {
            return await trxFn(trx);
        });
    }

    async get(key: string): Promise<TType | null> {
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

    async getAndRemove(key: string): Promise<TType | null> {
        if (this.isMysql) {
            return await this.transaction(async (trx) => {
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

    async add(key: string, value: TType, ttl: Date | null): Promise<boolean> {
        return await this.transaction(async (trx) => {
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
            const expiration = ttl?.getTime() ?? null;

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
        key: string,
        valueToAdd: TType,
        ttl: Date | null,
    ): Promise<TType> {
        return await this.transaction(async (trx) => {
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
            const expiration = ttl?.getTime() ?? null;

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

    async put(key: string, value: TType, ttl: Date | null): Promise<boolean> {
        return await this.transaction(async (trx) => {
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
            const expiration = ttl?.getTime() ?? null;

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

    async update(key: string, value: TType): Promise<boolean> {
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

    async increment(key: string, value: number): Promise<boolean> {
        return await this.transaction(async (trx) => {
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

    async removeMany(keys: Array<string>): Promise<boolean> {
        if (keys.length === 0) {
            return false;
        }

        const result = await this.kysely
            .deleteFrom("cache")
            .where("cache.key", "in", keys)
            .execute();

        return Number(result[0]?.numDeletedRows ?? 0n) > 0;
    }

    private async removeAll(): Promise<void> {
        await this.kysely.deleteFrom("cache").execute();
    }

    async removeByPrefix(prefix: string): Promise<void> {
        if (prefix === "") {
            await this.removeAll();
            return;
        }
        await this.kysely
            .deleteFrom("cache")
            .where("cache.key", "like", `${prefix}%`)
            .execute();
    }
}
