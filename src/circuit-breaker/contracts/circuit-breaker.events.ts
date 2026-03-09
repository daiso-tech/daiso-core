/**
 * @module CircuitBreaker
 */

import { type CircuitBreakerState } from "@/circuit-breaker/contracts/circuit-breaker-state.contract.js";
import { type ICircuitBreakerStateMethods } from "@/circuit-breaker/contracts/circuit-breaker.contract.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Events
 */
export type CircuitBreakerEventBase = {
    circuitBreaker: ICircuitBreakerStateMethods;
};

/**
 * The event is dispatched when a circuit breaker has transitioned state.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Events
 */
export type StateTransitionCircuitBreakerEvent = CircuitBreakerEventBase & {
    from: CircuitBreakerState;
    to: CircuitBreakerState;
};

/**
 * The event is dispatched when a circuit breaker has tracked failure.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Events
 */
export type TrackedFailureCircuitBreakerEvent = CircuitBreakerEventBase & {
    error: unknown;
};

/**
 * The event is dispatched when a circuit breaker has untracked failure.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Events
 */
export type UntrackedFailureCircuitBreakerEvent = CircuitBreakerEventBase & {
    error: unknown;
};

/**
 * The event is dispatched when a circuit breaker has tracked slow call.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Events
 */
export type TrackedSlowCallCircuitBreakerEvent = CircuitBreakerEventBase;

/**
 * The event is dispatched when a circuit breaker has tracked successful call.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Events
 */
export type TrackedSuccessCircuitBreakerEvent = CircuitBreakerEventBase;

/**
 * The event is dispatched when circuit breaker has been reseted.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Events
 */
export type ResetedCircuitBreakerEvent = CircuitBreakerEventBase;

/**
 * The event is dispatched when circuit breaker has been reseted.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Events
 */
export type IsolatedCircuitBreakerEvent = CircuitBreakerEventBase;

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Events
 */
export const CIRCUIT_BREAKER_EVENTS = {
    STATE_TRANSITIONED: "STATE_TRANSITIONED",
    RESETED: "RESETED",
    UNTRACKED_FAILURE: "IGNORED_ERRROR",
    TRACKED_SUCCESS: "TRACKED_SUCCESS",
    TRACKED_FAILURE: "TRACKED_FAILURE",
    TRACKED_SLOW_CALL: "TRACKED_SLOW_CALL",
    ISOLATED: "ISOLATED",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Events
 */
export type CircuitBreakerEventMap = {
    [CIRCUIT_BREAKER_EVENTS.STATE_TRANSITIONED]: StateTransitionCircuitBreakerEvent;
    [CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE]: TrackedFailureCircuitBreakerEvent;
    [CIRCUIT_BREAKER_EVENTS.UNTRACKED_FAILURE]: UntrackedFailureCircuitBreakerEvent;
    [CIRCUIT_BREAKER_EVENTS.TRACKED_SLOW_CALL]: TrackedSlowCallCircuitBreakerEvent;
    [CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS]: TrackedSuccessCircuitBreakerEvent;
    [CIRCUIT_BREAKER_EVENTS.RESETED]: ResetedCircuitBreakerEvent;
    [CIRCUIT_BREAKER_EVENTS.ISOLATED]: IsolatedCircuitBreakerEvent;
};
