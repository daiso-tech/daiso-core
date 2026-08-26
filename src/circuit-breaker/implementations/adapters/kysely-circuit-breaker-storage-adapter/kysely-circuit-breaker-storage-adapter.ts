/**
 * @module CircuitBreaker
 */

import { MysqlAdapter } from "kysely";

import type { Kysely } from "kysely";

import type {
    ICircuitBreakerStorageAdapter,
    ICircuitBreakerStorageAdapterTransaction,
} from "@/circuit-breaker/contracts/_module.js";
import type { ISerde } from "@/serde/contracts/_module.js";
import type {
    IDeinitizable,
    IInitizable,
    InvocableFn,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/kysely-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export type KyselyCircuitBreakerStorageTable = {
    key: string;
    state: string;
};

/**
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/kysely-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export type KyselyCircuitBreakerStorageTables = {
    circuitBreaker: KyselyCircuitBreakerStorageTable;
};

/**
 * Configuration for `KyselyCircuitBreakerStorageAdapter`.
 * Requires a Kysely database instance typed with the circuit-breaker storage schema.
 * Call `init()` to create the storage table when it has not already been provisioned.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/kysely-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export type KyselyCircuitBreakerStorageAdapterSettings = {
    /**
     * The Kysely database instance typed with the required circuit-breaker storage tables.
     */
    kysely: Kysely<KyselyCircuitBreakerStorageTables>;
    /**
     * Serde instance for serializing and deserializing circuit-breaker state to and from strings.
     */
    serde: ISerde<string>;
};

/**
 * @internal
 */
async function find<TType>(
    key: string,
    { serde, kysely }: KyselyCircuitBreakerStorageAdapterSettings,
): Promise<TType | null> {
    const row = await kysely
        .selectFrom("circuitBreaker")
        .where("circuitBreaker.key", "=", key)
        .select("circuitBreaker.state")
        .executeTakeFirst();
    if (row === undefined) {
        return null;
    }
    return serde.deserialize<TType>(row.state);
}

/**
 * @internal
 */
class KyselyCircuitBreakerStorageAdapterTransaction<
    TType = unknown,
> implements ICircuitBreakerStorageAdapterTransaction<TType> {
    private readonly kysely: Kysely<KyselyCircuitBreakerStorageTables>;
    private readonly serde: ISerde<string>;
    private readonly isMysql: boolean;

    constructor(settings: KyselyCircuitBreakerStorageAdapterSettings) {
        const { kysely, serde } = settings;

        this.kysely = kysely;
        this.serde = serde;
        this.isMysql =
            this.kysely.getExecutor().adapter instanceof MysqlAdapter;
    }

    async upsert(key: string, state: TType): Promise<void> {
        const serializedState = this.serde.serialize(state);
        await this.kysely
            .insertInto("circuitBreaker")
            .values({
                key,
                state: serializedState,
            })
            .$if(!this.isMysql, (eb) =>
                eb.onConflict((eb_) =>
                    eb_.column("key").doUpdateSet({
                        state: serializedState,
                    }),
                ),
            )
            .$if(this.isMysql, (eb) =>
                eb.onDuplicateKeyUpdate({
                    state: serializedState,
                }),
            )
            .execute();
    }

    async find(key: string): Promise<TType | null> {
        return find(key, {
            serde: this.serde,
            kysely: this.kysely,
        });
    }
}

/**
 * To utilize the `KyselyCircuitBreakerStorageAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 *
 * Note in order to use `KyselyCircuitBreakerStorageAdapter` correctly, you need to use a database that has support for transactions.
 * The adapter have been tested with `sqlite`, `postgres` and `mysql` databases.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/kysely-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export class KyselyCircuitBreakerStorageAdapter<TType>
    implements ICircuitBreakerStorageAdapter, IInitizable, IDeinitizable
{
    private readonly kysely: Kysely<KyselyCircuitBreakerStorageTables>;
    private readonly serde: ISerde<string>;

    /**
     * @example
     * ```ts
     * import { KyselyCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/kysely-circuit-breaker-storage-adapter";
     * import { Serde } from "eridu-tech/serde";
     * import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter"
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const circuitBreakerStorageAdapter = new KyselyCircuitBreakerStorageAdapter({
     *   kysely: new Kysely({
     *     dialect: new SqliteDialect({
     *       database: new Sqlite("local.db"),
     *     }),
     *   }),
     *   serde
     * });
     * // You need initialize the adapter once before using it.
     * await circuitBreakerStorageAdapter.init();
     * ```
     */
    constructor(settings: KyselyCircuitBreakerStorageAdapterSettings) {
        const { kysely, serde } = settings;

        this.kysely = kysely;
        this.serde = serde;
    }
    private internalTransaction<TValue>(
        trxFn: InvocableFn<
            [trx: Kysely<KyselyCircuitBreakerStorageTables>],
            Promise<TValue>
        >,
    ): Promise<TValue> {
        return this.kysely.transaction().execute(async (trx) => {
            return await trxFn(trx);
        });
    }

    /**
     * Removes all related circuit breaker tables and their rows.
     * Note all circuit breaker data will be removed.
     */
    async deInit(): Promise<void> {
        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.kysely.schema.dropTable("circuitBreaker").execute();
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
                .createTable("circuitBreaker")
                .addColumn("key", "varchar(255)", (col) =>
                    col.primaryKey().notNull(),
                )
                .addColumn("state", "varchar(255)", (col) => col.notNull())
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    async transaction<TValue>(
        fn: InvocableFn<
            [transaction: ICircuitBreakerStorageAdapterTransaction],
            Promise<TValue>
        >,
    ): Promise<TValue> {
        return await this.internalTransaction(async (trx) => {
            return await fn(
                new KyselyCircuitBreakerStorageAdapterTransaction({
                    kysely: trx,
                    serde: this.serde,
                }),
            );
        });
    }

    async find(key: string): Promise<TType | null> {
        return find(key, {
            serde: this.serde,
            kysely: this.kysely,
        });
    }

    async remove(key: string): Promise<void> {
        await this.kysely
            .deleteFrom("circuitBreaker")
            .where("circuitBreaker.key", "=", key)
            .execute();
    }
}
