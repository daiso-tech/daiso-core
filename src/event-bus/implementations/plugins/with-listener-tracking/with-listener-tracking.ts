/**
 * @module EventBus
 */

import { type IEventBusAdapter } from "@/event-bus/contracts/_module.js";
import { ListenerStore } from "@/event-bus/implementations/derivables/event-bus/listener-store.js";
import { type Plugin, type PluginFn } from "@/middleware/contracts/_module.js";
import { callInvocable } from "@/utilities/_module.js";

/**
 * Wraps a plugin with automatic listener-reference tracking.
 *
 * When a middleware plugin intercepts `addListener` and wraps the listener
 * function, the adapter stores the **wrapped** reference. If the caller later
 * invokes `removeListener` with the **original** listener, the adapter cannot
 * find it — the reference has changed.
 *
 * `withListenerTracking` solves this by wrapping the original listener with a
 * tracking wrapper in `addListener` and storing the `original → wrapper`
 * mapping. On `removeListener`, it resolves the original listener back to the
 * tracking wrapper before forwarding the call to the chain.
 *
 * @param plugin - The plugin to wrap with listener tracking.
 * @returns A plugin function that applies both the given plugin and listener tracking.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/plugins"`
 * @group Plugins
 */
export function withListenerTracking(
    plugin: Plugin<IEventBusAdapter>,
): PluginFn<IEventBusAdapter> {
    const listenerStore = new ListenerStore(new Map());

    return (adapter, enhance) => {
        callInvocable(plugin, adapter, enhance);

        enhance(
            adapter,
            "addListener",
            async ({ args: [eventName, listener, context], next }) => {
                const wrappedListener = listenerStore.getOrAdd(
                    eventName,
                    listener,
                    (event) => listener(event),
                );
                return next([eventName, wrappedListener, context]);
            },
        );

        enhance(
            adapter,
            "removeListener",
            async ({ args: [eventName, listener, context], next }) => {
                const wrappedListener = listenerStore.getAndRemove(
                    eventName,
                    listener,
                );
                if (wrappedListener) {
                    return next([eventName, wrappedListener, context]);
                }
                return next([eventName, listener, context]);
            },
        );
    };
}
