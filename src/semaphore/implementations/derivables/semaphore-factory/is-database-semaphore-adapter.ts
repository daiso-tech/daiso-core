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
        adapter_["transaction"].length === 1 &&
        typeof adapter_["removeSlot"] === "function" &&
        adapter_["removeSlot"].length === 2 &&
        typeof adapter_["removeAllSlots"] === "function" &&
        adapter_["removeAllSlots"].length === 1 &&
        typeof adapter_["updateExpiration"] === "function" &&
        adapter_["updateExpiration"].length === 3
    );
}
