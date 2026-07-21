/**
 * @module CircuitBreaker
 */

import { type ICircuitBreakerAdapter } from "@/circuit-breaker/contracts/_module.js";
import { type PluginFn } from "@/middleware/contracts/_module.js";

/**
 * Creates a plugin that prefixes all keys passed to a circuit-breaker adapter.
 *
 * Every method that accepts a circuit-breaker key will have the given `prefix`
 * prepended before the call is forwarded to the underlying adapter. This is
 * useful for namespacing circuit-breaker state when multiple independent
 * consumers share the same backend.
 *
 * @param prefix - The string to prepend to every circuit-breaker key.
 * @returns A middleware plugin that wraps an `ICircuitBreakerAdapter`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/plugins"`
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
