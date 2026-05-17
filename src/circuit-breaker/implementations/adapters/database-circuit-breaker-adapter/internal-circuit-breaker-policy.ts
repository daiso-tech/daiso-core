/**
 * @module CircuitBreaker
 */

import { type BackoffPolicy } from "@/backoff-policies/contracts/_module.js";
import {
    CIRCUIT_BREAKER_STATE,
    CLOSED_TRANSITIONS,
    HALF_OPEN_TRANSITIONS,
    type ICircuitBreakerPolicy,
} from "@/circuit-breaker/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { callInvokable } from "@/utilities/_module.js";

/**
 * @internal
 */
export type BackoffPolicySettings = {
    currentDate: Date;
    backoffPolicy: BackoffPolicy;
};

/**
 * @internal
 */
export type OpenedState = {
    type: typeof CIRCUIT_BREAKER_STATE.OPEN;
    attempt: number;
    /**
     * Unix timestamp in miliseconds
     */
    startedAt: number;
};

/**
 * @internal
 */
export type HalfOpenedState<TMetrics = unknown> = {
    type: typeof CIRCUIT_BREAKER_STATE.HALF_OPEN;
    attempt: number;
    metrics: TMetrics;
};

/**
 * @internal
 */
export type ClosedState<TMetrics = unknown> = {
    type: typeof CIRCUIT_BREAKER_STATE.CLOSED;
    metrics: TMetrics;
};

/**
 * @internal
 */
export type IsolatedState = {
    type: typeof CIRCUIT_BREAKER_STATE.ISOLATED;
};

/**
 * @internal
 */
export type AllCircuitBreakerState<TMetrics = unknown> =
    | ClosedState<TMetrics>
    | OpenedState
    | HalfOpenedState<TMetrics>
    | IsolatedState;

/**
 * @internal
 */
export class InternalCircuitBreakerPolicy<TMetrics = unknown> {
    constructor(
        private readonly circuitBreakerPolicy: ICircuitBreakerPolicy<TMetrics>,
    ) {}

    private isMetricsEqual(metricsA: TMetrics, metricsB: TMetrics): boolean {
        return this.circuitBreakerPolicy.isEqual?.(metricsA, metricsB) ?? false;
    }

    private isClosedStateEqual(
        stateA: AllCircuitBreakerState<TMetrics>,
        stateB: AllCircuitBreakerState<TMetrics>,
    ): boolean {
        if (
            stateA.type === CIRCUIT_BREAKER_STATE.CLOSED &&
            stateB.type === CIRCUIT_BREAKER_STATE.CLOSED
        ) {
            return this.isMetricsEqual(stateA.metrics, stateB.metrics);
        }
        return false;
    }

    private isOpenedStateEqual(
        stateA: AllCircuitBreakerState<TMetrics>,
        stateB: AllCircuitBreakerState<TMetrics>,
    ): boolean {
        if (
            stateA.type === CIRCUIT_BREAKER_STATE.OPEN &&
            stateB.type === CIRCUIT_BREAKER_STATE.OPEN
        ) {
            return (
                stateA.attempt === stateB.attempt &&
                stateA.startedAt === stateB.startedAt
            );
        }
        return false;
    }

    private isHalfOpenedStateEqual(
        stateA: AllCircuitBreakerState<TMetrics>,
        stateB: AllCircuitBreakerState<TMetrics>,
    ): boolean {
        if (
            stateA.type === CIRCUIT_BREAKER_STATE.HALF_OPEN &&
            stateB.type === CIRCUIT_BREAKER_STATE.HALF_OPEN
        ) {
            return (
                stateA.attempt === stateB.attempt &&
                this.isMetricsEqual(stateA.metrics, stateB.metrics)
            );
        }
        return false;
    }

    private isIsolatedStateEqual(
        stateA: AllCircuitBreakerState<TMetrics>,
        stateB: AllCircuitBreakerState<TMetrics>,
    ): boolean {
        if (
            stateA.type === CIRCUIT_BREAKER_STATE.ISOLATED &&
            stateB.type === CIRCUIT_BREAKER_STATE.ISOLATED
        ) {
            return true;
        }
        return false;
    }

    isEqual(
        stateA: AllCircuitBreakerState<TMetrics>,
        stateB: AllCircuitBreakerState<TMetrics>,
    ): boolean {
        return (
            this.isClosedStateEqual(stateA, stateB) ||
            this.isOpenedStateEqual(stateA, stateB) ||
            this.isHalfOpenedStateEqual(stateA, stateB) ||
            this.isIsolatedStateEqual(stateA, stateB)
        );
    }

    initialState(): ClosedState<TMetrics> {
        return {
            type: CIRCUIT_BREAKER_STATE.CLOSED,
            metrics: this.circuitBreakerPolicy.initialMetrics(),
        };
    }

    whenClosed(
        currentState: ClosedState<TMetrics>,
        currentDate: Date,
    ): ClosedState<TMetrics> | OpenedState {
        const transition = this.circuitBreakerPolicy.whenClosed(
            currentState.metrics,
            new Date(currentDate),
        );
        if (transition === CLOSED_TRANSITIONS.NONE) {
            return currentState;
        }
        return {
            type: CIRCUIT_BREAKER_STATE.OPEN,
            attempt: 1,
            startedAt: new Date(currentDate).getTime(),
        };
    }

    whenOpened(
        currentState: OpenedState,
        settings: BackoffPolicySettings,
    ): OpenedState | HalfOpenedState<TMetrics> {
        const waitTime = TimeSpan.fromTimeSpan(
            callInvokable(settings.backoffPolicy, currentState.attempt, null),
        );
        const endDate = waitTime.toEndDate(new Date(currentState.startedAt));
        const isWaitTimeOver = endDate <= new Date(settings.currentDate);

        if (isWaitTimeOver) {
            return {
                type: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                attempt: currentState.attempt,
                metrics: this.circuitBreakerPolicy.initialMetrics(),
            };
        }

        return currentState;
    }

    whenHalfOpened(
        currentState: HalfOpenedState<TMetrics>,
        currentDate: Date,
    ): ClosedState<TMetrics> | OpenedState | HalfOpenedState<TMetrics> {
        const transition = this.circuitBreakerPolicy.whenHalfOpened(
            currentState.metrics,
            new Date(currentDate),
        );
        if (transition === HALF_OPEN_TRANSITIONS.NONE) {
            return currentState;
        }
        if (transition === HALF_OPEN_TRANSITIONS.TO_CLOSED) {
            return {
                type: CIRCUIT_BREAKER_STATE.CLOSED,
                metrics: this.circuitBreakerPolicy.initialMetrics(),
            };
        }
        return {
            type: CIRCUIT_BREAKER_STATE.OPEN,
            attempt: currentState.attempt + 1,
            startedAt: new Date(currentDate).getTime(),
        };
    }

    trackSuccessWhenClosed(
        currentState: ClosedState<TMetrics>,
        currentDate: Date,
    ): ClosedState<TMetrics> {
        const newMetrics = this.circuitBreakerPolicy.trackSuccess(
            currentState,
            {
                currentDate: new Date(currentDate),
                initialMetrics: this.circuitBreakerPolicy.initialMetrics(),
            },
        );
        return {
            ...currentState,
            metrics: newMetrics,
        };
    }

    trackFailureWhenClosed(
        currentState: ClosedState<TMetrics>,
        currentDate: Date,
    ): ClosedState<TMetrics> {
        const newMetrics = this.circuitBreakerPolicy.trackFailure(
            currentState,
            {
                currentDate: new Date(currentDate),
                initialMetrics: this.circuitBreakerPolicy.initialMetrics(),
            },
        );
        return {
            ...currentState,
            metrics: newMetrics,
        };
    }

    trackSuccessWhenHalfOpened(
        currentState: HalfOpenedState<TMetrics>,
        currentDate: Date,
    ): HalfOpenedState<TMetrics> {
        const newMetrics = this.circuitBreakerPolicy.trackSuccess(
            currentState,
            {
                currentDate: new Date(currentDate),
                initialMetrics: this.circuitBreakerPolicy.initialMetrics(),
            },
        );
        return {
            ...currentState,
            metrics: newMetrics,
        };
    }

    trackFailureWhenHalfOpened(
        currentState: HalfOpenedState<TMetrics>,
        currentDate: Date,
    ): HalfOpenedState<TMetrics> {
        const newMetrics = this.circuitBreakerPolicy.trackFailure(
            currentState,
            {
                currentDate: new Date(currentDate),
                initialMetrics: this.circuitBreakerPolicy.initialMetrics(),
            },
        );
        return {
            ...currentState,
            metrics: newMetrics,
        };
    }
}
