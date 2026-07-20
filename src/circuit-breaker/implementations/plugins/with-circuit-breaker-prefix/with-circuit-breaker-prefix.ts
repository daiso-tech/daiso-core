/**
 * @module CircuitBreaker
 */

import { type ICircuitBreakerAdapter } from "@/circuit-breaker/contracts/circuit-breaker-adapter.contract.js";
import { type PluginFn } from "@/middleware/contracts/_module.js";

/**
 * @group Plugins
 */
export function withCircuitBreakerPrefix(
    prefix: string,
): PluginFn<ICircuitBreakerAdapter> {
    function withPrefix(key: string): string {
        return prefix + key;
    }
    return (adapter, enhance) => {
        enhance(adapter, "getState", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
        enhance(adapter, "isolate", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
        enhance(adapter, "reset", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
        enhance(adapter, "trackFailure", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
        enhance(adapter, "trackSuccess", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
        enhance(adapter, "updateState", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
    };
}
