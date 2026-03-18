/**
 * @module CircuitBreaker
 */

import {
    type ICircuitBreakerProviderFactory,
    type CircuitBreakerTrigger,
    type ICircuitBreakerProvider,
    type ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module.js";
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
export type CircuitBreakerAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, ICircuitBreakerAdapter>
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker"`
 * @group Derivables
 */
export type CircuitBreakerProviderFactorySettings<TAdapters extends string> =
    CircuitBreakerProviderSettingsBase & {
        adapters: CircuitBreakerAdapters<TAdapters>;

        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * The `CircuitBreakerProviderFactory` class is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker"`
 * @group Derivables
 */
export class CircuitBreakerProviderFactory<TAdapters extends string>
    implements ICircuitBreakerProviderFactory<TAdapters>
{
    /**
     * @example
     * ```ts
     * import { CircuitBreakerProviderFactory } from "@daiso-tech/core/circuit-breaker";
     * import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storate-adapter";
     * import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
     * import { RedisCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/redis-circuit-breaker-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Redis from "ioredis"
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const circuitBreakerProviderFactory = new CircuitBreakerProviderFactory({
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
        private readonly settings: CircuitBreakerProviderFactorySettings<TAdapters>,
    ) {}

    setNamespace(
        namespace: INamespace,
    ): CircuitBreakerProviderFactory<TAdapters> {
        return new CircuitBreakerProviderFactory({
            ...this.settings,
            namespace,
        });
    }

    setEventBus(eventBus: IEventBus): CircuitBreakerProviderFactory<TAdapters> {
        return new CircuitBreakerProviderFactory({
            ...this.settings,
            eventBus,
        });
    }

    setDefaultSlowCallTime(
        slowCallTime?: ITimeSpan,
    ): CircuitBreakerProviderFactory<TAdapters> {
        return new CircuitBreakerProviderFactory({
            ...this.settings,
            defaultSlowCallTime: slowCallTime,
        });
    }

    setDefaultTrigger(
        trigger?: CircuitBreakerTrigger,
    ): CircuitBreakerProviderFactory<TAdapters> {
        return new CircuitBreakerProviderFactory({
            ...this.settings,
            defaultTrigger: trigger,
        });
    }

    setDefaultErrorPolicy(
        defaultErrorPolicy: ErrorPolicy,
    ): CircuitBreakerProviderFactory<TAdapters> {
        return new CircuitBreakerProviderFactory({
            ...this.settings,
            defaultErrorPolicy,
        });
    }

    /**
     * @example
     * ```ts
     * import { CircuitBreakerProviderFactory } from "@daiso-tech/core/circuit-breaker";
     * import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storate-adapter";
     * import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
     * import { RedisCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/redis-circuit-breaker-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Redis from "ioredis"
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const circuitBreakerProviderFactory = new CircuitBreakerProviderFactory({
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
     * await circuitBreakerProviderFactory
     *   .use()
     *   .create("a")
     *   .runOrFail(async () => {
     *     // ... code to apply circuit breaker logic
     *   });
     *
     * // Will apply circuit breaker logic using the RedisCircuitBreakerAdapter
     * await circuitBreakerProviderFactory
     *   .use("redis")
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
                CircuitBreakerProviderFactory.name,
            );
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(adapterName);
        }
        return new CircuitBreakerProvider({
            ...this.settings,
            adapter,
            serdeTransformerName: adapterName,
        });
    }
}
