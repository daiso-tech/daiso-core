/**
 * @module CircuitBreaker
 */

import { type BackoffPolicy } from "@/backoff-policies/implementations/_module.js";
import {
    type ICircuitBreakerFactoryResolver,
    type CircuitBreakerTrigger,
    type ICircuitBreakerFactory,
    type ICircuitBreakerStorageAdapter,
    type ICircuitBreakerPolicy,
} from "@/circuit-breaker/contracts/_module.js";
import { DatabaseCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/database-circuit-breaker-adapter/_module.js";
import {
    CircuitBreakerFactory,
    type CircuitBreakerFactorySettingsBase,
} from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/_module.js";
import { type EventBusInput } from "@/event-bus/contracts/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    UnregisteredAdapterError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    DefaultAdapterNotDefinedError,
    type ErrorPolicy,
    type WaitUntil,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker"`
 * @group Derivables
 */
export type DatabaseCircuitBreakerAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, ICircuitBreakerStorageAdapter>
>;

/**
 * Configuration for `DatabaseCircuitBreakerFactoryResolver`.
 * Convenience resolver that wires a {@link ICircuitBreakerStorageAdapter | `ICircuitBreakerStorageAdapter`} database adapter
 * with circuit-breaker logic and registers it as the sole named adapter.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker"`
 * @group Derivables
 */
export type DatabaseCircuitBreakerFactoryResolverSettings<
    TAdapters extends string,
> = CircuitBreakerFactorySettingsBase & {
    /**
     * Named registry of circuit-breaker storage adapters. Each key is an adapter alias and the corresponding value is the adapter instance.
     */
    adapters: DatabaseCircuitBreakerAdapters<TAdapters>;

    /**
     * The alias of the adapter to use when none is explicitly specified. Must be a key in the `adapters` map.
     */
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
 * The `DatabaseCircuitBreakerFactoryResolver` class is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker"`
 * @group Derivables
 */
export class DatabaseCircuitBreakerFactoryResolver<TAdapters extends string>
    implements ICircuitBreakerFactoryResolver<TAdapters>
{
    /**
     * @example
     * ```ts
     * import { DatabaseCircuitBreakerFactoryResolver } from "@daiso-tech/core/circuit-breaker";
     * import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storate-adapter";
     * import { KyselyCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/kysely-circuit-breaker-storate-adapter";
     * import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const circuitBreakerFactoryResolver = new DatabaseCircuitBreakerFactoryResolver({
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
        private readonly settings: DatabaseCircuitBreakerFactoryResolverSettings<TAdapters>,
    ) {}

    setNamespace(
        namespace: INamespace,
    ): DatabaseCircuitBreakerFactoryResolver<TAdapters> {
        return new DatabaseCircuitBreakerFactoryResolver({
            ...this.settings,
            namespace,
        });
    }

    setEventBus(
        eventBus: EventBusInput,
    ): DatabaseCircuitBreakerFactoryResolver<TAdapters> {
        return new DatabaseCircuitBreakerFactoryResolver({
            ...this.settings,
            eventBus,
        });
    }

    setSlowCallTime(
        slowCallTime?: ITimeSpan,
    ): DatabaseCircuitBreakerFactoryResolver<TAdapters> {
        return new DatabaseCircuitBreakerFactoryResolver({
            ...this.settings,
            defaultSlowCallTime: slowCallTime,
        });
    }

    setTrigger(
        trigger?: CircuitBreakerTrigger,
    ): DatabaseCircuitBreakerFactoryResolver<TAdapters> {
        return new DatabaseCircuitBreakerFactoryResolver({
            ...this.settings,
            defaultTrigger: trigger,
        });
    }

    setDefaultErrorPolicy(
        defaultErrorPolicy: ErrorPolicy,
    ): DatabaseCircuitBreakerFactoryResolver<TAdapters> {
        return new DatabaseCircuitBreakerFactoryResolver({
            ...this.settings,
            defaultErrorPolicy,
        });
    }

    setDefaultBackoffPolicy(
        backoffPolicy?: BackoffPolicy,
    ): DatabaseCircuitBreakerFactoryResolver<TAdapters> {
        return new DatabaseCircuitBreakerFactoryResolver({
            ...this.settings,
            backoffPolicy,
        });
    }

    setDefaultCircuitBreakerPolicy(
        circuitBreakerPolicy?: ICircuitBreakerPolicy,
    ): DatabaseCircuitBreakerFactoryResolver<TAdapters> {
        return new DatabaseCircuitBreakerFactoryResolver({
            ...this.settings,
            circuitBreakerPolicy,
        });
    }

    setWaitUntil(
        waitUntil: WaitUntil,
    ): DatabaseCircuitBreakerFactoryResolver<TAdapters> {
        return new DatabaseCircuitBreakerFactoryResolver({
            ...this.settings,
            waitUntil,
        });
    }

    setExecutionContext(
        executionContext: IExecutionContext,
    ): DatabaseCircuitBreakerFactoryResolver<TAdapters> {
        return new DatabaseCircuitBreakerFactoryResolver({
            ...this.settings,
            executionContext,
        });
    }

    /**
     * @example
     * ```ts
     * import { DatabaseCircuitBreakerFactoryResolver } from "@daiso-tech/core/circuit-breaker";
     * import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storate-adapter";
     * import { KyselyCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/kysely-circuit-breaker-storate-adapter";
     * import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const circuitBreakerFactoryResolver = new DatabaseCircuitBreakerFactoryResolver({
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
     * await circuitBreakerFactoryResolver
     *   .use()
     *   .create("a")
     *   .runOrFail(async () => {
     *     // ... code to apply circuit breaker logic
     *   });
     *
     * // Will apply circuit breaker logic using the KyselyCircuitBreakerStorageAdapter
     * await circuitBreakerFactoryResolver
     *   .use("sqlite")
     *   .create("a")
     *   .runOrFail(async () => {
     *     // ... code to apply circuit breaker logic
     *   });
     * ```
     */
    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): ICircuitBreakerFactory {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                DatabaseCircuitBreakerFactoryResolver.name,
            );
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(adapterName);
        }
        return new CircuitBreakerFactory({
            ...this.settings,
            adapter: new DatabaseCircuitBreakerAdapter({
                adapter,
            }),
            serdeTransformerName: adapterName,
        });
    }
}
