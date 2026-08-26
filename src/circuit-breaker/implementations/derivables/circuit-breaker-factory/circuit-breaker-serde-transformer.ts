/**
 * @module CircuitBreaker
 */

import { CircuitBreaker } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/circuit-breaker.js";
import { getConstructorName } from "@/utilities/_module.js";

import type {
    CircuitBreakerTrigger,
    ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module.js";
import type { ISerializedCircuitBreaker } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/circuit-breaker.js";
import type { ISerdeTransformer } from "@/serde/contracts/_module.js";
import type { TimeSpan } from "@/time-span/implementations/_module.js";
import type { ErrorPolicy, OneOrMore, WaitUntil } from "@/utilities/_module.js";

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

    constructor(settings: CircuitBreakerSerdeTransformerSettings) {
        const {
            adapter,
            slowCallTime,
            errorPolicy,
            trigger,
            serdeTransformerName,
            enableAsyncTracking,
            waitUntil,
        } = settings;

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
            this.serdeTransformerName ===
            value.internalGetSerdeTransformerName();

        const isAdapterMatching =
            getConstructorName(this.adapter) ===
            getConstructorName(value.internalGetAdapter());

        return isSerdTransformerNameMathcing && isAdapterMatching;
    }

    deserialize(serializedValue: ISerializedCircuitBreaker): CircuitBreaker {
        const { key } = serializedValue;

        return new CircuitBreaker({
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
        return CircuitBreaker.internalSerialize(deserializedValue);
    }
}
