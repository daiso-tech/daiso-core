/**
 * @module Semaphore
 */
import {
    type IDatabaseSemaphoreAdapter,
    type SemaphoreAdapterVariants,
} from "@/semaphore/contracts/_module.js";

/**
 * @internal
 */
export function isDatabaseSemaphoreAdapter(
    adapter: SemaphoreAdapterVariants,
): adapter is IDatabaseSemaphoreAdapter {
    const adapter_ = adapter as Partial<
        Record<string, (...args_: Array<unknown>) => unknown>
    >;
    return (
        typeof adapter_["transaction"] === "function" &&
        typeof adapter_["removeSlot"] === "function" &&
        typeof adapter_["removeAllSlots"] === "function" &&
        typeof adapter_["updateExpiration"] === "function"
    );
}
