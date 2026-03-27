/**
 * @module CircuitBreaker
 */

import {
    CIRCUIT_BREAKER_TRIGGER,
    type CircuitBreakerEventMap,
    type CircuitBreakerFactoryCreateSettings,
    type ICircuitBreaker,
    type ICircuitBreakerFactory,
    type ICircuitBreakerAdapter,
    type CircuitBreakerTrigger,
    type ICircuitBreakerListenable,
} from "@/circuit-breaker/contracts/_module.js";
import { CircuitBreakerSerdeTransformer } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/circuit-breaker-serde-transformer.js";
import { CircuitBreaker } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/circuit-breaker.js";
import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { NoOpNamespace } from "@/namespace/implementations/_module.js";
import { type ISerderRegister } from "@/serde/contracts/_module.js";
import { NoOpSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/serde.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    CORE,
    resolveOneOrMore,
    type ErrorPolicy,
    type OneOrMore,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker"`
 * @group Derivables
 */
export type CircuitBreakerFactorySettingsBase = {
    /**
     * @default
     * ```ts
     * import { NoOpNamespace } from "@daiso-tech/core/namespace";
     *
     * new NoOpNamespace()
     * ```
     */
    namespace?: INamespace;

    /**
     * @default
     * ```ts
     * import { EventBus } from "@daiso-tech/core/event-bus";
     * import { NoOpEventBusAdapter } from "@daiso-tech/core/event-bus/no-op-event-bus-adapter";
     *
     * new EventBus({
     *   adapter: new NoOpEventBusAdapter()
     * })
     * ```
     */
    eventBus?: IEventBus;

    /**
     * You can set the default `ErrorPolicy`
     *
     * @default
     * ```ts
     * (_error: unknown) => true
     * ```
     */
    defaultErrorPolicy?: ErrorPolicy;

    /**
     * You can set the default slow call threshold.
     *
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromSeconds(10);
     * ```
     */
    defaultSlowCallTime?: ITimeSpan;

    /**
     * You set the default trigger.
     *
     * @default
     * ```ts
     * import { CIRCUIT_BREAKER_TRIGGER} from "@daiso-tech/core/circuit-breaker/contracts";
     *
     * CIRCUIT_BREAKER_TRIGGER.BOTH
     * ```
     */
    defaultTrigger?: CircuitBreakerTrigger;

    /**
     * If true, metric tracking will run asynchronously in the background and won't block the function utilizing the circuit breaker logic.
     * @default true
     */
    enableAsyncTracking?: boolean;

    /**
     * @default
     * ```ts
     * import { Serde } from "@daiso-tech/serde";
     * import { NoOpSerdeAdapter } from "@daiso-tech/serde/no-op-serde-adapter";
     *
     * new Serde(new NoOpSerdeAdapter())
     * ```
     */
    serde?: OneOrMore<ISerderRegister>;

    /**
     * @default ""
     */
    serdeTransformerName?: string;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker"`
 * @group Derivables
 */
export type CircuitBreakerFactorySettings =
    CircuitBreakerFactorySettingsBase & {
        adapter: ICircuitBreakerAdapter;
    };

/**
 * `CircuitBreakerFactory` class can be derived from any {@link ICircuitBreakerAdapter | `ICircuitBreakerAdapter`}.
 *
 * Note the {@link ICircuitBreaker | `ICircuitBreaker`} instances created by the `CircuitBreakerFactory` class are serializable and deserializable,
 * allowing them to be seamlessly transferred across different servers, processes, and databases.
 * This can be done directly using {@link ISerderRegister | `ISerderRegister`} or indirectly through components that rely on {@link ISerderRegister | `ISerderRegister`} internally.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker"`
 * @group Derivables
 */
export class CircuitBreakerFactory implements ICircuitBreakerFactory {
    private readonly namespace: INamespace;
    private readonly eventBus: IEventBus<CircuitBreakerEventMap>;
    private readonly adapter: ICircuitBreakerAdapter;
    private readonly defaultSlowCallTime: TimeSpan;
    private readonly defaultTrigger: CircuitBreakerTrigger;
    private readonly defaultErrorPolicy: ErrorPolicy;
    private readonly serde: OneOrMore<ISerderRegister>;
    private readonly serdeTransformerName: string;
    private readonly enableAsyncTracking: boolean;

    /**
     * @example
     * ```ts
     * import { KyselyCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/kysely-circuit-breaker-storage-adapter";
     * import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter"
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
     *
     * const circuitBreakerAdapter = new DatabaseCircuitBreakerAdapter({
     *   adapter: circuitBreakerStorageAdapter
     * });
     *
     * const circuitBreakerFactory = new CircuitBreakerFactory({
     *   adapter: circuitBreakerAdapter
     * })
     * ```
     */
    constructor(settings: CircuitBreakerFactorySettings) {
        const {
            enableAsyncTracking = true,
            namespace = new NoOpNamespace(),
            eventBus = new EventBus({
                adapter: new NoOpEventBusAdapter(),
            }),
            adapter,
            defaultSlowCallTime = TimeSpan.fromSeconds(10),
            defaultTrigger = CIRCUIT_BREAKER_TRIGGER.BOTH,
            defaultErrorPolicy = () => true,
            serde = new Serde(new NoOpSerdeAdapter()),
            serdeTransformerName = "",
        } = settings;

        this.enableAsyncTracking = enableAsyncTracking;
        this.namespace = namespace;
        this.eventBus = eventBus;
        this.adapter = adapter;
        this.defaultSlowCallTime = TimeSpan.fromTimeSpan(defaultSlowCallTime);
        this.defaultTrigger = defaultTrigger;
        this.defaultErrorPolicy = defaultErrorPolicy;
        this.serde = serde;
        this.serdeTransformerName = serdeTransformerName;
        this.registerToSerde();
    }

    private registerToSerde(): void {
        const transformer = new CircuitBreakerSerdeTransformer({
            enableAsyncTracking: this.enableAsyncTracking,
            adapter: this.adapter,
            slowCallTime: this.defaultSlowCallTime,
            errorPolicy: this.defaultErrorPolicy,
            trigger: this.defaultTrigger,
            eventBus: this.eventBus,
            namespace: this.namespace,
            serdeTransformerName: this.serdeTransformerName,
        });
        for (const serde of resolveOneOrMore(this.serde)) {
            serde.registerCustom(transformer, CORE);
        }
    }

    get events(): ICircuitBreakerListenable {
        return this.eventBus;
    }

    create(
        key: string,
        settings: CircuitBreakerFactoryCreateSettings = {},
    ): ICircuitBreaker {
        const {
            errorPolicy = this.defaultErrorPolicy,
            trigger = this.defaultTrigger,
            slowCallTime = this.defaultSlowCallTime,
        } = settings;

        return new CircuitBreaker({
            enableAsyncTracking: this.enableAsyncTracking,
            eventDispatcher: this.eventBus,
            adapter: this.adapter,
            key: this.namespace.create(key),
            slowCallTime: TimeSpan.fromTimeSpan(slowCallTime),
            errorPolicy,
            trigger,
            serdeTransformerName: this.serdeTransformerName,
            namespace: this.namespace,
        });
    }
}
