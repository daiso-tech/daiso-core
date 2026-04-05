/**
 * @module CircuitBreaker
 */

import {
    type CircuitBreakerEventMap,
    type CircuitBreakerTrigger,
    type ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module.js";
import {
    CircuitBreaker,
    type ISerializedCircuitBreaker,
} from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/circuit-breaker.js";
import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
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
    namespace: INamespace;
    slowCallTime: TimeSpan;
    errorPolicy: ErrorPolicy;
    trigger: CircuitBreakerTrigger;
    eventBus: IEventBus<CircuitBreakerEventMap>;
    serdeTransformerName: string;
    enableAsyncTracking: boolean;
    waitUntil: WaitUntil;
    executionContext: IExecutionContext;
};

/**
 * @internal
 */
export class CircuitBreakerSerdeTransformer
    implements ISerdeTransformer<CircuitBreaker, ISerializedCircuitBreaker>
{
    private readonly adapter: ICircuitBreakerAdapter;
    private readonly namespace: INamespace;
    private readonly slowCallTime: TimeSpan;
    private readonly errorPolicy: ErrorPolicy;
    private readonly trigger: CircuitBreakerTrigger;
    private readonly eventBus: IEventBus<CircuitBreakerEventMap>;
    private readonly serdeTransformerName: string;
    private readonly enableAsyncTracking: boolean;
    private readonly waitUntil: WaitUntil;
    private readonly executionContext: IExecutionContext;

    constructor(settings: CircuitBreakerSerdeTransformerSettings) {
        const {
            adapter,
            namespace,
            slowCallTime,
            errorPolicy,
            trigger,
            eventBus,
            serdeTransformerName,
            enableAsyncTracking,
            waitUntil,
            executionContext,
        } = settings;

        this.executionContext = executionContext;
        this.waitUntil = waitUntil;
        this.enableAsyncTracking = enableAsyncTracking;
        this.adapter = adapter;
        this.namespace = namespace;
        this.slowCallTime = slowCallTime;
        this.errorPolicy = errorPolicy;
        this.trigger = trigger;
        this.eventBus = eventBus;
        this.serdeTransformerName = serdeTransformerName;
    }

    get name(): OneOrMore<string> {
        return [
            "circuitBreaker",
            this.serdeTransformerName,
            getConstructorName(this.adapter),
            this.namespace.toString(),
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
            value._internal_getSerdeTransformerName();

        const isNamespaceMatching =
            this.namespace.toString() ===
            value._internal_getNamespace().toString();

        const isAdapterMatching =
            getConstructorName(this.adapter) ===
            getConstructorName(value._internal_getAdapter());

        return (
            isSerdTransformerNameMathcing &&
            isNamespaceMatching &&
            isAdapterMatching
        );
    }

    deserialize(serializedValue: ISerializedCircuitBreaker): CircuitBreaker {
        const { key } = serializedValue;
        const keyObj = this.namespace.create(key);

        return new CircuitBreaker({
            executionContext: this.executionContext,
            waitUntil: this.waitUntil,
            enableAsyncTracking: this.enableAsyncTracking,
            eventDispatcher: this.eventBus,
            adapter: this.adapter,
            key: keyObj,
            slowCallTime: this.slowCallTime,
            errorPolicy: this.errorPolicy,
            trigger: this.trigger,
            serdeTransformerName: this.serdeTransformerName,
            namespace: this.namespace,
        });
    }

    serialize(deserializedValue: CircuitBreaker): ISerializedCircuitBreaker {
        return CircuitBreaker._internal_serialize(deserializedValue);
    }
}
