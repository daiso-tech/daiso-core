/**
 * @module RateLimiter
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type IRateLimiterAdapter } from "@/rate-limiter/contracts/_module.js";
import {
    RateLimiter,
    type ISerializedRateLimiter,
} from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter.js";
import { type ISerdeTransformer } from "@/serde/contracts/_module.js";
import {
    getConstructorName,
    type ErrorPolicy,
    type OneOrMore,
    type WaitUntil,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export type RateLimiterSerdeTransformerSettings = {
    adapter: IRateLimiterAdapter;
    errorPolicy: ErrorPolicy;
    onlyError: boolean;
    serdeTransformerName: string;
    enableAsyncTracking: boolean;
    waitUntil: WaitUntil;
    context: IReadableContext;
};

/**
 * @internal
 */
export class RateLimiterSerdeTransformer implements ISerdeTransformer<
    RateLimiter,
    ISerializedRateLimiter
> {
    private readonly adapter: IRateLimiterAdapter;
    private readonly errorPolicy: ErrorPolicy;
    private readonly serdeTransformerName: string;
    private readonly enableAsyncTracking: boolean;
    private readonly onlyError: boolean;
    private readonly waitUntil: WaitUntil;
    private readonly context: IReadableContext;

    constructor(settings: RateLimiterSerdeTransformerSettings) {
        const {
            adapter,
            serdeTransformerName,
            enableAsyncTracking,
            errorPolicy,
            onlyError,
            waitUntil,
            context,
        } = settings;

        this.context = context;
        this.waitUntil = waitUntil;
        this.onlyError = onlyError;
        this.enableAsyncTracking = enableAsyncTracking;
        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this.errorPolicy = errorPolicy;
        this.serdeTransformerName = serdeTransformerName;
    }

    get name(): OneOrMore<string> {
        return [
            "rateLimiter",
            this.serdeTransformerName,
            getConstructorName(this.adapter),
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
            this.serdeTransformerName === value._getSerdeTransformerName();

        const isAdapterMatching =
            getConstructorName(this.adapter) ===
            getConstructorName(value._getAdapter());

        return isSerdTransformerNameMathcing && isAdapterMatching;
    }

    deserialize(serializedValue: ISerializedRateLimiter): RateLimiter {
        const { key, limit } = serializedValue;

        return new RateLimiter({
            context: this.context,
            waitUntil: this.waitUntil,
            enableAsyncTracking: this.enableAsyncTracking,
            adapter: this.adapter,
            key,
            limit,
            onlyError: this.onlyError,
            errorPolicy: this.errorPolicy,
            serdeTransformerName: this.serdeTransformerName,
        });
    }

    serialize(deserializedValue: RateLimiter): ISerializedRateLimiter {
        return RateLimiter._serialize(deserializedValue);
    }
}
