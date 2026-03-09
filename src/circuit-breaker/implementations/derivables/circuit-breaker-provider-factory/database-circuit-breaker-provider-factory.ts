/**
 * @module CircuitBreaker
 */

import { type BackoffPolicy } from "@/backoff-policies/_module.js";
import {
    type ICircuitBreakerProviderFactory,
    type CircuitBreakerTrigger,
    type ICircuitBreakerProvider,
    type ICircuitBreakerStorageAdapter,
    type ICircuitBreakerPolicy,
} from "@/circuit-breaker/contracts/_module.js";
import { DatabaseCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/database-circuit-breaker-adapter/_module.js";
import {
    CircuitBreakerProvider,
    type CircuitBreakerProviderSettingsBase,
} from "@/circuit-breaker/implementations/derivables/circuit-breaker-provider/_module.js";
import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    UnregisteredAdapterError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    DefaultAdapterNotDefinedError,
    type ErrorPolicy,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker"`
 * @group Derivables
 */
export type DatabaseCircuitBreakerAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, ICircuitBreakerStorageAdapter>
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker"`
 * @group Derivables
 */
export type DatabaseCircuitBreakerProviderFactorySettings<
    TAdapters extends string,
> = CircuitBreakerProviderSettingsBase & {
    adapters: DatabaseCircuitBreakerAdapters<TAdapters>;

    defaultAdapter?: NoInfer<TAdapters>;

    /**
     * @default
     * ```ts
     * import { exponentialBackoff } from "@daiso-tech/core/backoff-policies";
     *
     * exponentialBackoff();
     * ```
     */
    backoffPolicy?: BackoffPolicy;

    /**
     * @default
     * ```ts
     * import { ConsecutiveBreaker } from "@daiso-tech/core/circuit-breaker/policies";
     *
     * new ConsecutiveBreaker();
     * ```
     */
    circuitBreakerPolicy?: ICircuitBreakerPolicy;
};

/**
 * The `DatabaseCircuitBreakerProviderFactory` class is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker"`
 * @group Derivables
 */
export class DatabaseCircuitBreakerProviderFactory<TAdapters extends string>
    implements ICircuitBreakerProviderFactory<TAdapters>
{
    /**
     * @example
     * ```ts
     * import { DatabaseCircuitBreakerProviderFactory } from "@daiso-tech/core/circuit-breaker";
     * import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storate-adapter";
     * import { KyselyCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/kysely-circuit-breaker-storate-adapter";
     * import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const circuitBreakerProviderFactory = new DatabaseCircuitBreakerProviderFactory({
     *   serde,
     *   adapters: {
     *     memory: new MemoryCircuitBreakerStorageAdapter(),
     *     sqlite: new KyselyCircuitBreakerStorageAdapter({
     *       kysely: new Kysely({
     *         dialect: new SqliteDialect({
     *           database: new Sqlite("local.db"),
     *         }),
     *       }),
     *       serde,
     *     }),
     *   },
     *   defaultAdapter: "memory",
     * });
     * ```
     */
    constructor(
        private readonly settings: DatabaseCircuitBreakerProviderFactorySettings<TAdapters>,
    ) {}

    setNamespace(
        namespace: INamespace,
    ): DatabaseCircuitBreakerProviderFactory<TAdapters> {
        return new DatabaseCircuitBreakerProviderFactory({
            ...this.settings,
            namespace,
        });
    }

    setEventBus(
        eventBus: IEventBus,
    ): DatabaseCircuitBreakerProviderFactory<TAdapters> {
        return new DatabaseCircuitBreakerProviderFactory({
            ...this.settings,
            eventBus,
        });
    }

    setSlowCallTime(
        slowCallTime?: ITimeSpan,
    ): DatabaseCircuitBreakerProviderFactory<TAdapters> {
        return new DatabaseCircuitBreakerProviderFactory({
            ...this.settings,
            defaultSlowCallTime: slowCallTime,
        });
    }

    setTrigger(
        trigger?: CircuitBreakerTrigger,
    ): DatabaseCircuitBreakerProviderFactory<TAdapters> {
        return new DatabaseCircuitBreakerProviderFactory({
            ...this.settings,
            defaultTrigger: trigger,
        });
    }

    setDefaultErrorPolicy(
        defaultErrorPolicy: ErrorPolicy,
    ): DatabaseCircuitBreakerProviderFactory<TAdapters> {
        return new DatabaseCircuitBreakerProviderFactory({
            ...this.settings,
            defaultErrorPolicy,
        });
    }

    setDefaultBackoffPolicy(
        backoffPolicy?: BackoffPolicy,
    ): DatabaseCircuitBreakerProviderFactory<TAdapters> {
        return new DatabaseCircuitBreakerProviderFactory({
            ...this.settings,
            backoffPolicy,
        });
    }

    setDefaultCircuitBreakerPolicy(
        circuitBreakerPolicy?: ICircuitBreakerPolicy,
    ): DatabaseCircuitBreakerProviderFactory<TAdapters> {
        return new DatabaseCircuitBreakerProviderFactory({
            ...this.settings,
            circuitBreakerPolicy,
        });
    }

    /**
     * @example
     * ```ts
     * import { DatabaseCircuitBreakerProviderFactory } from "@daiso-tech/core/circuit-breaker";
     * import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storate-adapter";
     * import { KyselyCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/kysely-circuit-breaker-storate-adapter";
     * import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const circuitBreakerProviderFactory = new DatabaseCircuitBreakerProviderFactory({
     *   serde,
     *   adapters: {
     *     memory: new MemoryCircuitBreakerStorageAdapter(),
     *     sqlite: new KyselyCircuitBreakerStorageAdapter({
     *       kysely: new Kysely({
     *         dialect: new SqliteDialect({
     *           database: new Sqlite("local.db"),
     *         }),
     *       }),
     *       serde,
     *     }),
     *   },
     *   defaultAdapter: "memory",
     * });
     *
     * // Will apply circuit breaker logic the default adapter which is MemoryCircuitBreakerStorageAdapter
     * await circuitBreakerProviderFactory
     *   .use()
     *   .create("a")
     *   .runOrFail(async () => {
     *     // ... code to apply circuit breaker logic
     *   });
     *
     * // Will apply circuit breaker logic using the KyselyCircuitBreakerStorageAdapter
     * await circuitBreakerProviderFactory
     *   .use("sqlite")
     *   .create("a")
     *   .runOrFail(async () => {
     *     // ... code to apply circuit breaker logic
     *   });
     * ```
     */
    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): ICircuitBreakerProvider {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                DatabaseCircuitBreakerProviderFactory.name,
            );
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(adapterName);
        }
        return new CircuitBreakerProvider({
            ...this.settings,
            adapter: new DatabaseCircuitBreakerAdapter({
                adapter,
            }),
            serdeTransformerName: adapterName,
        });
    }
}
