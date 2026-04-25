/**
 * @module CircuitBreaker
 */

import {
    type ICircuitBreakerFactoryResolver,
    type CircuitBreakerTrigger,
    type ICircuitBreakerFactory,
    type ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module.js";
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
export type CircuitBreakerAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, ICircuitBreakerAdapter>
>;

/**
 * Configuration for `CircuitBreakerFactoryResolver`.
 * Registers named circuit-breaker adapters and optionally designates a default.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker"`
 * @group Derivables
 */
export type CircuitBreakerFactoryResolverSettings<TAdapters extends string> =
    CircuitBreakerFactorySettingsBase & {
        /**
         * Named registry of circuit-breaker adapters. Each key is an adapter alias and the corresponding value is the adapter instance.
         */
        adapters: CircuitBreakerAdapters<TAdapters>;

        /**
         * The alias of the adapter to use when none is explicitly specified. Must be a key in the `adapters` map.
         */
        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * The `CircuitBreakerFactoryResolver` class is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker"`
 * @group Derivables
 */
export class CircuitBreakerFactoryResolver<TAdapters extends string>
    implements ICircuitBreakerFactoryResolver<TAdapters>
{
    /**
     * @example
     * ```ts
     * import { CircuitBreakerFactoryResolver } from "@daiso-tech/core/circuit-breaker";
     * import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storate-adapter";
     * import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
     * import { RedisCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/redis-circuit-breaker-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Redis from "ioredis"
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const circuitBreakerFactoryResolver = new CircuitBreakerFactoryResolver({
     *   serde,
     *   adapters: {
     *     memory: new DatabaseCircuitBreakerAdapter({
     *       adapter: new MemoryCircuitBreakerStorageAdapter()
     *     }),
     *     redis: new RedisCircuitBreakerAdapter({
     *       database: new Redis("YOUR_REDIS_CONNECTION")
     *     }),
     *   },
     *   defaultAdapter: "memory",
     * });
     * ```
     */
    constructor(
        private readonly settings: CircuitBreakerFactoryResolverSettings<TAdapters>,
    ) {}

    setNamespace(
        namespace: INamespace,
    ): CircuitBreakerFactoryResolver<TAdapters> {
        return new CircuitBreakerFactoryResolver({
            ...this.settings,
            namespace,
        });
    }

    setEventBus(
        eventBus: EventBusInput,
    ): CircuitBreakerFactoryResolver<TAdapters> {
        return new CircuitBreakerFactoryResolver({
            ...this.settings,
            eventBus,
        });
    }

    setDefaultSlowCallTime(
        slowCallTime?: ITimeSpan,
    ): CircuitBreakerFactoryResolver<TAdapters> {
        return new CircuitBreakerFactoryResolver({
            ...this.settings,
            defaultSlowCallTime: slowCallTime,
        });
    }

    setDefaultTrigger(
        trigger?: CircuitBreakerTrigger,
    ): CircuitBreakerFactoryResolver<TAdapters> {
        return new CircuitBreakerFactoryResolver({
            ...this.settings,
            defaultTrigger: trigger,
        });
    }

    setDefaultErrorPolicy(
        defaultErrorPolicy: ErrorPolicy,
    ): CircuitBreakerFactoryResolver<TAdapters> {
        return new CircuitBreakerFactoryResolver({
            ...this.settings,
            defaultErrorPolicy,
        });
    }

    setWaitUntil(
        waitUntil: WaitUntil,
    ): CircuitBreakerFactoryResolver<TAdapters> {
        return new CircuitBreakerFactoryResolver({
            ...this.settings,
            waitUntil,
        });
    }

    setExecutionContext(
        executionContext: IExecutionContext,
    ): CircuitBreakerFactoryResolver<TAdapters> {
        return new CircuitBreakerFactoryResolver({
            ...this.settings,
            executionContext,
        });
    }

    /**
     * @example
     * ```ts
     * import { CircuitBreakerFactoryResolver } from "@daiso-tech/core/circuit-breaker";
     * import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storate-adapter";
     * import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
     * import { RedisCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/redis-circuit-breaker-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Redis from "ioredis"
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const circuitBreakerFactoryResolver = new CircuitBreakerFactoryResolver({
     *   serde,
     *   adapters: {
     *     memory: new DatabaseCircuitBreakerAdapter({
     *       adapter: new MemoryCircuitBreakerStorageAdapter()
     *     }),
     *     redis: new RedisCircuitBreakerAdapter({
     *       database: new Redis("YOUR_REDIS_CONNECTION")
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
     * // Will apply circuit breaker logic using the RedisCircuitBreakerAdapter
     * await circuitBreakerFactoryResolver
     *   .use("redis")
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
                CircuitBreakerFactoryResolver.name,
            );
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(adapterName);
        }
        return new CircuitBreakerFactory({
            ...this.settings,
            adapter,
            serdeTransformerName: adapterName,
        });
    }
}
