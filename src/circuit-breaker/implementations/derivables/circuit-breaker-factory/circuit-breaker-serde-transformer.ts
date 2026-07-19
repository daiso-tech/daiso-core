/**
 * @module CircuitBreaker
 */

import {
    type CircuitBreakerTrigger,
    type ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module.js";
import {
    CircuitBreaker,
    type ISerializedCircuitBreaker,
} from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/circuit-breaker.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type ISerdeTransformer } from "@/serde/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";
import {
    getConstructorName,
    type ErrorPolicy,
    type OneOrMore,
    type WaitUntil,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export type CircuitBreakerSerdeTransformerSettings = {
    adapter: ICircuitBreakerAdapter;
    slowCallTime: TimeSpan;
    errorPolicy: ErrorPolicy;
    trigger: CircuitBreakerTrigger;
    serdeTransformerName: string;
    enableAsyncTracking: boolean;
    waitUntil: WaitUntil;
    context: IReadableContext;
};

/**
 * @internal
 */
export class CircuitBreakerSerdeTransformer implements ISerdeTransformer<
    CircuitBreaker,
    ISerializedCircuitBreaker
> {
    private readonly adapter: ICircuitBreakerAdapter;
    private readonly slowCallTime: TimeSpan;
    private readonly errorPolicy: ErrorPolicy;
    private readonly trigger: CircuitBreakerTrigger;
    private readonly serdeTransformerName: string;
    private readonly enableAsyncTracking: boolean;
    private readonly waitUntil: WaitUntil;
    private readonly context: IReadableContext;

    constructor(settings: CircuitBreakerSerdeTransformerSettings) {
        const {
            adapter,
            slowCallTime,
            errorPolicy,
            trigger,
            serdeTransformerName,
            enableAsyncTracking,
            waitUntil,
            context,
        } = settings;

        this.context = context;
        this.waitUntil = waitUntil;
        this.enableAsyncTracking = enableAsyncTracking;
        this.adapter = adapter;
        this.slowCallTime = slowCallTime;
        this.errorPolicy = errorPolicy;
        this.trigger = trigger;
        this.serdeTransformerName = serdeTransformerName;
    }

    get name(): OneOrMore<string> {
        return [
            "circuitBreaker",
            this.serdeTransformerName,
            getConstructorName(this.adapter),
        ].filter((str) => str !== "");
    }

    isApplicable(value: unknown): value is CircuitBreaker {
        const isCircuitBreaker =
            value instanceof CircuitBreaker &&
            getConstructorName(value) === CircuitBreaker.name;
        if (!isCircuitBreaker) {
            return false;
        }

        const isSerdTransformerNameMathcing =
            this.serdeTransformerName === value._getSerdeTransformerName();

        const isAdapterMatching =
            getConstructorName(this.adapter) ===
            getConstructorName(value._getAdapter());

        return isSerdTransformerNameMathcing && isAdapterMatching;
    }

    deserialize(serializedValue: ISerializedCircuitBreaker): CircuitBreaker {
        const { key } = serializedValue;

        return new CircuitBreaker({
            context: this.context,
            waitUntil: this.waitUntil,
            enableAsyncTracking: this.enableAsyncTracking,
            adapter: this.adapter,
            key,
            slowCallTime: this.slowCallTime,
            errorPolicy: this.errorPolicy,
            trigger: this.trigger,
            serdeTransformerName: this.serdeTransformerName,
        });
    }

    serialize(deserializedValue: CircuitBreaker): ISerializedCircuitBreaker {
        return CircuitBreaker._serialize(deserializedValue);
    }
}
