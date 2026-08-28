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
 * The settings object passed to the {@link WithDispatchAfterSettings.payload | `payload`}
 * invocable of the `withDispatchAfter` middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @typeParam TReturn - The return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchAfterPayloadSettings<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = {
    /**
     * The arguments passed to the wrapped function.
     */
    args: TParameters;

    /**
     * The value returned by the wrapped function.
     */
    returnValue: TReturn;
};

/**
 * The settings used to configure the middleware returned by
 * {@link withDispatchAfterFactory | `withDispatchAfterFactory`}.
 *
 * @typeParam TEventMap - The event map of the event dispatcher.
 * @typeParam TEventName - The name of the event to dispatch.
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @typeParam TReturn - The return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchAfterSettings<
    TEventMap extends BaseEventMap = BaseEventMap,
    TEventName extends keyof TEventMap = keyof TEventMap,
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = {
    /**
     * The name of the event to dispatch after the wrapped function resolves.
     */
    type: TEventName;

    /**
     * An invocable that produces the event payload from the wrapped function's
     * arguments and return value. It receives a
     * {@link WithDispatchAfterPayloadSettings | settings object} containing the
     * wrapped function's `args` and `returnValue`.
     */
    payload: Invocable<
        [settings: WithDispatchAfterPayloadSettings<TParameters, TReturn>],
        TEventMap[TEventName]
    >;
};

/**
 * Creates a middleware factory that dispatches an event **after** the wrapped
 * function resolves.
 *
 * When the wrapped function completes, the middleware resolves the event payload
 * from the function's arguments and return value, dispatches the configured event
 * on the provided event dispatcher, and then returns the wrapped function's result
 * unchanged.
 *
 * This is useful for emitting completion events such as "user created" or for
 * recording the outcome of a function.
 *
 * @typeParam TEventMap - The event map of the event dispatcher.
 * @param eventDispatcher - The event dispatcher used to dispatch the event.
 * @returns A function that accepts {@link WithDispatchAfterSettings} and returns
 *          a middleware.
 *
 * @example
 * ```ts
 * import { withDispatchAfterFactory } from "eridu-tech/event-bus/middlewares";
 * import { EventBus } from "eridu-tech/event-bus";
 * import { use } from "eridu-tech/middleware";
 * import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus";
 *
 * type EventMap = {
 *     "user.after.create": { userId: string; name: string };
 * };
 *
 * const eventBus = new EventBus<EventMap>({
 *     adapter: new MemoryEventBusAdapter(),
 * });
 * const withDispatchAfter = withDispatchAfterFactory(eventBus);
 *
 * const createUser = async (userId: string): Promise<string> =>
 *     `user-${userId}`;
 *
 * const wrappedCreateUser = use(
 *     createUser,
 *     withDispatchAfter({
 *         type: "user.after.create",
 *         payload: ({ args, returnValue }) => ({
 *             userId: args[0],
 *             name: returnValue,
 *         }),
 *     }),
 * );
 * ```
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export function withDispatchAfterFactory<
    TEventMap extends BaseEventMap = BaseEventMap,
>(eventDispatcher: IEventDispatcher<TEventMap>) {
    return <
        TEventName extends keyof TEventMap,
        TParameters extends Array<unknown>,
        TReturn,
    >(
        settings: WithDispatchAfterSettings<
            TEventMap,
            TEventName,
            TParameters,
            TReturn
        >,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        const { type, payload } = settings;
        return async ({ next, args }) => {
            const returnValue = await next();

            void eventDispatcher.dispatch(
                type,
                callInvocable(payload, {
                    args,
                    returnValue,
                }),
            );

            return returnValue;
        };
    };
}
