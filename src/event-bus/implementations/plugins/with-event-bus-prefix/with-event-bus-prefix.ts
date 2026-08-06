/**
 * @module EventBus
 */

import type { IEventBusAdapter } from "@/event-bus/contracts/_module.js";
import type { PluginFn } from "@/middleware/contracts/_module.js";

/**
 * Creates a plugin that prefixes all event names passed to an event bus adapter.
 *
 * Every method that accepts an event name will have the given `prefix` prepended
 * before the call is forwarded to the underlying adapter. This is useful for
 * namespacing events when multiple independent consumers share the same
 * event bus backend.
 *
 * @param prefix - The string to prepend to every event name.
 * @returns A middleware plugin that wraps an `IEventBusAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/plugins"`
 * @group Plugins
 */
export function withEventBusPrefix(prefix: string): PluginFn<IEventBusAdapter> {
    function withPrefix(key: string): string {
        return prefix + key;
    }
    return (adapter, enhance) => {
        enhance(adapter, "dispatch", ({ args: [eventName, ...rest], next }) => {
            return next([withPrefix(eventName), ...rest]);
        });
        enhance(
            adapter,
            "addListener",
            ({ args: [eventName, ...rest], next }) => {
                return next([withPrefix(eventName), ...rest]);
            },
        );
        enhance(
            adapter,
            "removeListener",
            ({ args: [eventName, ...rest], next }) => {
                return next([withPrefix(eventName), ...rest]);
            },
        );
    };
}
