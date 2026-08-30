/**
 * @module EventBus
 */

import { callInvocable } from "@/utilities/_module.js";

import type {
    BaseEventMap,
    IEventDispatcher,
} from "@/event-bus/contracts/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";
import type { Invocable } from "@/utilities/_module.js";

/**
 * The settings object passed to the {@link WithDispatchBeforeSettings.payload | `payload`}
 * invocable of the `withDispatchBefore` middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchBeforePayloadSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     * The arguments passed to the wrapped function.
     */
    args: TParameters;
};

/**
 * The settings used to configure the middleware returned by
 * {@link withDispatchBeforeFactory | `withDispatchBeforeFactory`}.
 *
 * @typeParam TEventMap - The event map of the event dispatcher.
 * @typeParam TEventName - The name of the event to dispatch.
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchBeforeSettings<
    TEventMap extends BaseEventMap = BaseEventMap,
    TEventName extends keyof TEventMap = keyof TEventMap,
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     * The name of the event to dispatch before the wrapped function is invoked.
     */
    type: TEventName;

    /**
     * An invocable that produces the event payload from the wrapped function's
     * arguments. It receives a
     * {@link WithDispatchBeforePayloadSettings | settings object} containing the
     * wrapped function's `args`. Returning `undefined` skips the dispatch.
     */
    payload: Invocable<
        [settings: WithDispatchBeforePayloadSettings<TParameters>],
        TEventMap[TEventName] | null
    >;
};

/**
 * Creates a middleware factory that dispatches an event **before** the wrapped
 * function is invoked.
 *
 * When the wrapped function is called, the middleware resolves the event payload
 * from the function's arguments and dispatches the configured event on the provided
 * event dispatcher, and then invokes the wrapped function and returns its result. If
 * the payload resolves to `undefined` (or doesn't return a value), no event is dispatched and the wrapped
 * function is invoked directly.
 *
 * This is useful for emitting lifecycle events such as "about to create a user"
 * or for tracing and auditing when a function starts.
 *
 * @typeParam TEventMap - The event map of the event dispatcher.
 * @param eventDispatcher - The event dispatcher used to dispatch the event.
 * @returns A function that accepts {@link WithDispatchBeforeSettings} and returns
 *          a middleware.
 *
 * @example
 * ```ts
 * import { withDispatchBeforeFactory } from "eridu-tech/event-bus/middlewares";
 * import { EventBus } from "eridu-tech/event-bus";
 * import { use } from "eridu-tech/middleware";
 * import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus";
 *
 * type EventMap = {
 *     "user.before.create": { userId: string };
 * };
 *
 * const eventBus = new EventBus<EventMap>({
 *     adapter: new MemoryEventBusAdapter(),
 * });
 * const withDispatchBefore = withDispatchBeforeFactory(eventBus);
 *
 * const createUser = async (userId: string): Promise<string> =>
 *     `user-${userId}`;
 *
 * const wrappedCreateUser = use(
 *     createUser,
 *     withDispatchBefore({
 *         type: "user.before.create",
 *         payload: ({ args }) => ({ userId: args[0] }),
 *     }),
 * );
 * ```
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export function withDispatchBeforeFactory<
    TEventMap extends BaseEventMap = BaseEventMap,
>(eventDispatcher: IEventDispatcher<TEventMap>) {
    return <
        TEventName extends keyof TEventMap,
        TParameters extends Array<unknown>,
        TReturn,
    >(
        settings: WithDispatchBeforeSettings<
            TEventMap,
            TEventName,
            TParameters
        >,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        const { type, payload } = settings;
        return async ({ next, args }) => {
            const event = callInvocable(payload, {
                args,
            });
            if (event === null) {
                return next();
            }
            void eventDispatcher.dispatch(type, event);

            return next();
        };
    };
}
