/**
 * @module CircuitBreaker
 */

import { type ICircuitBreaker } from "@/circuit-breaker/contracts/circuit-breaker.contract.js";
import { type CircuitBreakerEventMap } from "@/circuit-breaker/contracts/circuit-breaker.events.js";
import { type IEventListenable } from "@/event-bus/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/time-span.contract.js";
import { type ErrorPolicySettings } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export const CIRCUIT_BREAKER_TRIGGER = {
    ONLY_ERROR: "ONLY_ERROR",
    ONLY_SLOW_CALL: "ONLY_SLOW_CALL",
    BOTH: "BOTH",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type CircuitBreakerTrigger =
    (typeof CIRCUIT_BREAKER_TRIGGER)[keyof typeof CIRCUIT_BREAKER_TRIGGER];

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type CircuitBreakerFactoryCreateSettings = ErrorPolicySettings & {
    /**
     * You can decide to track only errors, only slow calls or both as failures.
     */
    trigger?: CircuitBreakerTrigger;

    /**
     * You can set slow call threshold.
     */
    slowCallTime?: ITimeSpan;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ICircuitBreakerFactoryBase = {
    /**
     * The `create` method is used to create an instance of {@link ICircuitBreaker | `ICircuitBreaker`}.
     */
    create(
        key: string,
        settings?: CircuitBreakerFactoryCreateSettings,
    ): ICircuitBreaker;
};

/**
 * The `ICircuitBreakerListenable` contract defines a way for listening {@link ICircuitBreaker | `ICircuitBreaker`} operations and state transitions.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ICircuitBreakerListenable =
    IEventListenable<CircuitBreakerEventMap>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ICircuitBreakerFactory = ICircuitBreakerFactoryBase & {
    readonly events: ICircuitBreakerListenable;
};
