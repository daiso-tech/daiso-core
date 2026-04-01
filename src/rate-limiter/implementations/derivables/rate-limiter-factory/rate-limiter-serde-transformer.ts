/**
 * @module RateLimiter
 */

import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import {
    type IRateLimiterAdapter,
    type RateLimiterEventMap,
} from "@/rate-limiter/contracts/_module.js";
import {
    RateLimiter,
    type ISerializedRateLimiter,
} from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter.js";
import { type ISerdeTransformer } from "@/serde/contracts/_module.js";
import {
    getConstructorName,
    type ErrorPolicy,
    type Invokable,
    type OneOrMore,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export type RateLimiterSerdeTransformerSettings = {
    adapter: IRateLimiterAdapter;
    namespace: INamespace;
    errorPolicy: ErrorPolicy;
    onlyError: boolean;
    eventBus: IEventBus<RateLimiterEventMap>;
    serdeTransformerName: string;
    enableAsyncTracking: boolean;
    waitUntil: Invokable<[promise: PromiseLike<unknown>], void>;
};

/**
 * @internal
 */
export class RateLimiterSerdeTransformer
    implements ISerdeTransformer<RateLimiter, ISerializedRateLimiter>
{
    private readonly adapter: IRateLimiterAdapter;
    private readonly namespace: INamespace;
    private readonly errorPolicy: ErrorPolicy;
    private readonly eventBus: IEventBus<RateLimiterEventMap>;
    private readonly serdeTransformerName: string;
    private readonly enableAsyncTracking: boolean;
    private readonly onlyError: boolean;
    private readonly waitUntil: Invokable<
        [promise: PromiseLike<unknown>],
        void
    >;

    constructor(settings: RateLimiterSerdeTransformerSettings) {
        const {
            adapter,
            namespace,
            eventBus,
            serdeTransformerName,
            enableAsyncTracking,
            errorPolicy,
            onlyError,
            waitUntil,
        } = settings;

        this.waitUntil = waitUntil;
        this.onlyError = onlyError;
        this.enableAsyncTracking = enableAsyncTracking;
        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this.namespace = namespace;
        this.eventBus = eventBus;
        this.errorPolicy = errorPolicy;
        this.serdeTransformerName = serdeTransformerName;
    }

    get name(): OneOrMore<string> {
        return [
            "rateLimiter",
            this.serdeTransformerName,
            getConstructorName(this.adapter),
            this.namespace.toString(),
        ].filter((str) => str !== "");
    }

    isApplicable(value: unknown): value is RateLimiter {
        const isRateLimiter =
            value instanceof RateLimiter &&
            getConstructorName(value) === RateLimiter.name;
        if (!isRateLimiter) {
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

    deserialize(serializedValue: ISerializedRateLimiter): RateLimiter {
        const { key, limit } = serializedValue;
        const keyObj = this.namespace.create(key);

        return new RateLimiter({
            waitUntil: this.waitUntil,
            enableAsyncTracking: this.enableAsyncTracking,
            eventDispatcher: this.eventBus,
            adapter: this.adapter,
            key: keyObj,
            limit,
            onlyError: this.onlyError,
            errorPolicy: this.errorPolicy,
            serdeTransformerName: this.serdeTransformerName,
            namespace: this.namespace,
        });
    }

    serialize(deserializedValue: RateLimiter): ISerializedRateLimiter {
        return RateLimiter._internal_serialize(deserializedValue);
    }
}
