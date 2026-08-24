/**
 * @module RateLimiter
 */

import { MysqlAdapter } from "kysely";

import type { Kysely } from "kysely";

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    IRateLimiterData,
    IRateLimiterStorageAdapter,
    IRateLimiterStorageAdapterTransaction,
} from "@/rate-limiter/contracts/_module.js";
import type { ISerde } from "@/serde/contracts/_module.js";
import type {
    IDeinitizable,
    IInitizable,
    InvocableFn,
    IPrunable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export type KyselyRateLimiterTable = {
    key: string;
    state: string;
    // In ms since unix epoch.
    // The type in mysql is bigint and will be returned as a string.
    // Some sql database drivers have support for js bigint if enabled. Meaning bigint will be returned.
    expiration: number | bigint | string;
};

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export type KyselyRateLimiterStorageTables = {
    rateLimiter: KyselyRateLimiterTable;
};

/**
 * @internal
 */
async function find<TType>(
    kysely: Kysely<KyselyRateLimiterStorageTables>,
    serde: ISerde<string>,
    key: string,
): Promise<IRateLimiterData<TType> | null> {
    const row = await kysely
        .selectFrom("rateLimiter")
        .select(["rateLimiter.state", "rateLimiter.expiration"])
        .where("rateLimiter.key", "=", key)
        .executeTakeFirst();
    if (row === undefined) {
        return null;
    }
    return {
        state: serde.deserialize(row.state),
        expiration: new Date(Number(row.expiration)),
    };
}

/**
 * @internal
 */
class KyselyRateLimiterStorageAdapterTransaction<
    TType,
> implements IRateLimiterStorageAdapterTransaction<TType> {
    private readonly isMysql: boolean;

    constructor(
        private readonly kysely: Kysely<KyselyRateLimiterStorageTables>,
        private readonly serde: ISerde<string>,
    ) {
        this.isMysql =
            this.kysely.getExecutor().adapter instanceof MysqlAdapter;
    }

    async upsert(
        key: string,
        state: TType,
        expiration: Date,
        _context: IReadableContext,
    ): Promise<void> {
        const expirationAsMs = expiration.getTime();
        const serializedState = this.serde.serialize(state);
        await this.kysely
            .insertInto("rateLimiter")
            .values({
                key,
                state: serializedState,
                expiration: expirationAsMs,
            })
            .$if(!this.isMysql, (eb) =>
                eb.onConflict((eb_) =>
                    eb_.column("key").doUpdateSet({
                        key,
                        state: serializedState,
                        expiration: expirationAsMs,
                    }),
                ),
            )
            .$if(this.isMysql, (eb) =>
                eb.onDuplicateKeyUpdate({
                    key,
                    state: serializedState,
                    expiration: expirationAsMs,
                }),
            )
            .execute();
    }

    async find(
        key: string,
        _context: IReadableContext,
    ): Promise<IRateLimiterData<TType> | null> {
        return await find(this.kysely, this.serde, key);
    }
}

/**
 * Configuration for `KyselyRateLimiterStorageAdapter`.
 * Requires a Kysely database instance with the rate-limiter schema applied.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export type KyselyRateLimiterStorageAdapterSettings = {
    /**
     * The Kysely database instance with the required rate-limiter schema tables applied.
     */
    kysely: Kysely<KyselyRateLimiterStorageTables>;
    /**
     * Serde instance for serializing and deserializing rate-limiter state to and from strings.
     */
    serde: ISerde<string>;
};

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export class KyselyRateLimiterStorageAdapter<TType>
    implements
        IRateLimiterStorageAdapter<TType>,
        IInitizable,
        IDeinitizable,
        IPrunable
{
    private readonly kysely: Kysely<KyselyRateLimiterStorageTables>;
    private readonly serde: ISerde<string>;

    /**
     * @example
     * ```ts
     * import { KyselyRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter";
     * import { Serde } from "eridu-tech/serde";
     * import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter"
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const rateLimiterStorageAdapter = new KyselyRateLimiterStorageAdapter({
     *   kysely: new Kysely({
     *     dialect: new SqliteDialect({
     *       database: new Sqlite("local.db"),
     *     }),
     *   }),
     *   serde
     * });
     * // You need initialize the adapter once before using it.
     * await rateLimiterStorageAdapter.init();
     * ```
     */
    constructor(settings: KyselyRateLimiterStorageAdapterSettings) {
        const { kysely, serde } = settings;

        this.kysely = kysely;
        this.serde = serde;
    }
    private internalTransaction<TValue>(
        trxFn: InvocableFn<
            [trx: Kysely<KyselyRateLimiterStorageTables>],
            Promise<TValue>
        >,
    ): Promise<TValue> {
        return this.kysely.transaction().execute(async (trx) => {
            return await trxFn(trx);
        });
    }

    /**
     * Removes all related rate limiter tables and their rows.
     * Note all rate limiter data will be removed.
     */
    async deInit(): Promise<void> {
        // Should throw if the index does not exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .dropIndex("rateLimiter_expiration")
                .on("rateLimiter")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.kysely.schema.dropTable("rateLimiter").execute();
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
                .createTable("rateLimiter")
                .addColumn("key", "varchar(255)", (col) =>
                    col.primaryKey().notNull(),
                )
                .addColumn("state", "varchar(255)", (col) => col.notNull())
                .addColumn("expiration", "bigint")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the index already exists thats why the try catch is used.
        try {
            await this.kysely.schema
                .createIndex("rateLimiter_expiration")
                .on("rateLimiter")
                .column("expiration")
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    async removeAllExpired(): Promise<void> {
        await this.kysely
            .deleteFrom("rateLimiter")
            .where("rateLimiter.expiration", "<=", Date.now())
            .execute();
    }

    async transaction<TValue>(
        fn: InvocableFn<
            [transaction: IRateLimiterStorageAdapterTransaction<TType>],
            Promise<TValue>
        >,
        _context: IReadableContext,
    ): Promise<TValue> {
        return await this.internalTransaction(async (trx) => {
            return await fn(
                new KyselyRateLimiterStorageAdapterTransaction(trx, this.serde),
            );
        });
    }

    async find(
        key: string,
        _context: IReadableContext,
    ): Promise<IRateLimiterData<TType> | null> {
        return await find(this.kysely, this.serde, key);
    }

    async remove(key: string, _context: IReadableContext): Promise<void> {
        await this.kysely
            .deleteFrom("rateLimiter")
            .where("rateLimiter.key", "=", key)
            .executeTakeFirst();
    }
}
