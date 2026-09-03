/* eslint-disable no-shadow */
/**
 * @module Cache
 */

import { MysqlAdapter, SqliteAdapter } from "kysely";

import { UnexpectedError } from "@/utilities/_module.js";

import type { Kysely } from "kysely";

import type { ICacheAdapter } from "@/cache/contracts/_module.js";
import type { ISerde } from "@/serde/contracts/_module.js";
import type {
    IDeinitizable,
    IInitizable,
    InvocableFn,
    IPrunable,
    Promisable,
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
    // If -1 it means the row is inserted
    prevExpiration: number | string | null;
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
    private readonly isSqlite: boolean;
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
        this.isSqlite =
            this.kysely.getExecutor().adapter instanceof SqliteAdapter;
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
                .addColumn("prevExpiration", "bigint")
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
        const now = Date.now();
        const row = await this.kysely
            .selectFrom("cache")
            .where("cache.key", "=", key)
            .where((eb) =>
                eb.or([
                    eb("cache.expiration", "is", null),
                    eb("cache.expiration", ">", now),
                ]),
            )
            .select(["cache.value", "cache.expiration"])
            .executeTakeFirst();

        if (row === undefined) {
            return null;
        }

        return this.serde.deserialize(row.value);
    }

    async getAndRemove(key: string): Promise<TType | null> {
        let row:
            Pick<KyselyCacheEntryTable, "value" | "expiration"> | undefined;
        if (this.isMysql) {
            row = await this.transaction(async (trx) => {
                const row_ = trx
                    .selectFrom("cache")
                    .where("cache.key", "=", key)
                    .select(["cache.value", "cache.expiration"])
                    .forUpdate()
                    .executeTakeFirst();

                await this.kysely
                    .deleteFrom("cache")
                    .where("cache.key", "=", key)
                    .executeTakeFirst();

                return row_;
            });
        }
        row = await this.kysely
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

    private static isRowExpired(
        row: Pick<KyselyCacheEntryTable, "prevExpiration">,
    ): boolean {
        const prevExpiration =
            row.prevExpiration === null ? null : Number(row.prevExpiration);

        if (prevExpiration === -1) {
            return true;
        }

        return prevExpiration !== null && prevExpiration <= Date.now();
    }

    async add(key: string, value: TType, ttl: Date | null): Promise<boolean> {
        const serializedValue = this.serde.serialize(value);
        const expiration = ttl?.getTime() ?? null;
        const now = Date.now();
        const row = await this.kysely
            .insertInto("cache")
            .values({
                key,
                value: serializedValue,
                expiration,
                prevExpiration: -1,
            })
            .$if(!this.isMysql, (eb) =>
                eb.onConflict((eb) =>
                    eb.column("key").doUpdateSet({
                        value: (eb) =>
                            eb
                                .case()
                                .when(
                                    eb.or([
                                        eb("cache.expiration", "is", null),
                                        eb("cache.expiration", ">", now),
                                    ]),
                                )
                                .thenRef("cache.value")
                                .else(serializedValue)
                                .end(),
                        expiration: (eb) =>
                            eb
                                .case()
                                .when(
                                    eb.or([
                                        eb("cache.expiration", "is", null),
                                        eb("cache.expiration", ">", now),
                                    ]),
                                )
                                .thenRef("cache.expiration")
                                .else(expiration)
                                .end(),
                        prevExpiration: (eb) => eb.ref("cache.expiration"),
                    }),
                ),
            )
            .$if(this.isMysql, (eb) =>
                eb.onDuplicateKeyUpdate({
                    value: (eb) =>
                        eb
                            .case()
                            .when(
                                eb.or([
                                    eb("cache.expiration", "is", null),
                                    eb("cache.expiration", ">", now),
                                ]),
                            )
                            .thenRef("cache.value")
                            .else(serializedValue)
                            .end(),
                    expiration: (eb) =>
                        eb
                            .case()
                            .when(
                                eb.or([
                                    eb("cache.expiration", "is", null),
                                    eb("cache.expiration", ">", now),
                                ]),
                            )
                            .thenRef("cache.expiration")
                            .else(expiration)
                            .end(),
                    prevExpiration: (eb) => eb.ref("cache.expiration"),
                }),
            )
            .returning("cache.prevExpiration")
            .executeTakeFirst();
        if (row === undefined) {
            throw new UnexpectedError("!!__MESSAGE__!!");
        }

        return KyselyCacheAdapter.isRowExpired(row);
    }

    private getRowValue(
        row: Pick<KyselyCacheEntryTable, "prevExpiration" | "value">,
    ): TType | null {
        const prevExpiration =
            row.prevExpiration === null ? null : Number(row.prevExpiration);

        if (prevExpiration === -1) {
            return null;
        }
        if (prevExpiration === null) {
            return this.serde.deserialize(row.value);
        }
        const hasExpired = prevExpiration <= Date.now();
        if (hasExpired) {
            return null;
        }
        return this.serde.deserialize(row.value);
    }

    async getOrAdd(
        key: string,
        valueToAdd: InvocableFn<[], Promisable<TType>>,
        ttl: Date | null,
    ): Promise<TType> {
        const valueToAddResolved = await valueToAdd();
        const serializedValue = this.serde.serialize(valueToAddResolved);
        const expiration = ttl?.getTime() ?? null;
        const now = Date.now();
        const row = await this.kysely
            .insertInto("cache")
            .values({
                key,
                value: serializedValue,
                expiration,
                prevExpiration: -1,
            })
            .$if(!this.isMysql, (eb) =>
                eb.onConflict((eb) =>
                    eb.column("key").doUpdateSet({
                        value: (eb) =>
                            eb
                                .case()
                                .when(
                                    eb.or([
                                        eb("cache.expiration", "is", null),
                                        eb("cache.expiration", ">", now),
                                    ]),
                                )
                                .thenRef("cache.value")
                                .else(serializedValue)
                                .end(),
                        expiration: (eb) =>
                            eb
                                .case()
                                .when(
                                    eb.or([
                                        eb("cache.expiration", "is", null),
                                        eb("cache.expiration", ">", now),
                                    ]),
                                )
                                .thenRef("cache.expiration")
                                .else(expiration)
                                .end(),
                        prevExpiration: (eb) => eb.ref("cache.expiration"),
                    }),
                ),
            )
            .$if(this.isMysql, (eb) =>
                eb.onDuplicateKeyUpdate({
                    value: (eb) =>
                        eb
                            .case()
                            .when(
                                eb.or([
                                    eb("cache.expiration", "is", null),
                                    eb("cache.expiration", ">", now),
                                ]),
                            )
                            .thenRef("cache.value")
                            .else(serializedValue)
                            .end(),
                    expiration: (eb) =>
                        eb
                            .case()
                            .when(
                                eb.or([
                                    eb("cache.expiration", "is", null),
                                    eb("cache.expiration", ">", now),
                                ]),
                            )
                            .thenRef("cache.expiration")
                            .else(expiration)
                            .end(),
                    prevExpiration: (eb) => eb.ref("cache.expiration"),
                }),
            )
            .returning(["cache.prevExpiration", "cache.value"])
            .executeTakeFirst();
        if (row === undefined) {
            throw new UnexpectedError("!!__MESSAGE__!!");
        }

        const value = this.getRowValue(row);
        if (value === null) {
            return valueToAddResolved;
        }

        return value;
    }

    async put(key: string, value: TType, ttl: Date | null): Promise<boolean> {
        const serializedValue = this.serde.serialize(value);
        const expiration = ttl?.getTime() ?? null;
        const result = await this.kysely
            .insertInto("cache")
            .values({
                key,
                value: serializedValue,
                expiration,
                prevExpiration: -1,
            })
            .$if(!this.isMysql, (eb) =>
                eb.onConflict((eb) =>
                    eb.column("key").doUpdateSet({
                        value: serializedValue,
                        expiration,
                        prevExpiration: (eb) => eb.ref("cache.expiration"),
                    }),
                ),
            )
            .$if(this.isMysql, (eb) =>
                eb.onDuplicateKeyUpdate({
                    value: serializedValue,
                    expiration,
                    prevExpiration: (eb) => eb.ref("cache.expiration"),
                }),
            )
            .returning("cache.prevExpiration")
            .executeTakeFirst();
        if (result === undefined) {
            throw new UnexpectedError("!!__MESSAGE__!!");
        }

        return !KyselyCacheAdapter.isRowExpired(result);
    }

    async update(key: string, value: TType): Promise<boolean> {
        const result = await this.kysely
            .updateTable("cache")
            .where("cache.key", "=", key)
            .where((eb) =>
                eb.or([
                    eb("cache.expiration", "is", null),
                    eb("cache.expiration", ">", Date.now()),
                ]),
            )
            .set({
                value: this.serde.serialize(value),
            })
            .executeTakeFirst();

        return Number(result.numUpdatedRows) > 0;
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
                .$if(!this.isSqlite, (eb) => eb.forUpdate())
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
            .where((eb) =>
                eb.or([
                    eb("cache.expiration", "is", null),
                    eb("cache.expiration", ">", Date.now()),
                ]),
            )
            .executeTakeFirst();

        return Number(result.numDeletedRows) > 0;
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
