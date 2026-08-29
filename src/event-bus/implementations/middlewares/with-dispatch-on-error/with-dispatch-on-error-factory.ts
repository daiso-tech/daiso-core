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
 * The settings object passed to the {@link WithDispatchOnErrorSettings.payload | `payload`}
 * invocable of the `withDispatchOnError` middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchOnErrorPayloadSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     * The arguments passed to the wrapped function.
     */
    args: TParameters;

    /**
     * The error thrown by the wrapped function.
     */
    error: unknown;
};

/**
 * The settings used to configure the middleware returned by
 * {@link withDispatchOnErrorFactory | `withDispatchOnErrorFactory`}.
 *
 * @typeParam TEventMap - The event map of the event dispatcher.
 * @typeParam TEventName - The name of the event to dispatch.
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchOnErrorSettings<
    TEventMap extends BaseEventMap = BaseEventMap,
    TEventName extends keyof TEventMap = keyof TEventMap,
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     * The name of the event to dispatch when the wrapped function throws.
     */
    type: TEventName;

    /**
     * An invocable that produces the event payload from the wrapped function's
     * arguments and the caught error. It receives a
     * {@link WithDispatchOnErrorPayloadSettings | settings object} containing the
     * wrapped function's `args` and `error`. Returning `undefined` skips the
     * dispatch.
     */
    payload: Invocable<
        [settings: WithDispatchOnErrorPayloadSettings<TParameters>],
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        TEventMap[TEventName] | void
    >;
};

/**
 * Creates a middleware factory that dispatches an event when the wrapped function
 * **throws**.
 *
 * When the wrapped function fails, the middleware resolves the event payload from
 * the function's arguments and the caught error, dispatches the configured event on
 * the provided event dispatcher, and then re-throws the original error so the failure
 * still propagates to the caller. If the payload resolves to `undefined` (or doesn't return a value), no event is
 * dispatched and the original error is re-thrown as-is.
 *
 * This is useful for emitting failure events such as "user creation failed" or for
 * feeding an error-monitoring pipeline without swallowing the exception.
 *
 * @typeParam TEventMap - The event map of the event dispatcher.
 * @param eventDispatcher - The event dispatcher used to dispatch the event.
 * @returns A function that accepts {@link WithDispatchOnErrorSettings} and returns
 *          a middleware.
 *
 * @example
 * ```ts
 * import { withDispatchOnErrorFactory } from "eridu-tech/event-bus/middlewares";
 * import { EventBus } from "eridu-tech/event-bus";
 * import { use } from "eridu-tech/middleware";
 * import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus";
 *
 * type EventMap = {
 *     "user.error": { userId: string; error: unknown };
 * };
 *
 * const eventBus = new EventBus<EventMap>({
 *     adapter: new MemoryEventBusAdapter(),
 * });
 * const withDispatchOnError = withDispatchOnErrorFactory(eventBus);
 *
 * const createUser = async (userId: string): Promise<string> => {
 *     throw new Error("boom");
 * };
 *
 * const wrappedCreateUser = use(
 *     createUser,
 *     withDispatchOnError({
 *         type: "user.error",
 *         payload: ({ args, error }) => ({
 *             userId: args[0],
 *             error,
 *         }),
 *     }),
 * );
 * ```
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export function withDispatchOnErrorFactory<
    TEventMap extends BaseEventMap = BaseEventMap,
>(eventDispatcher: IEventDispatcher<TEventMap>) {
    return <
        TEventName extends keyof TEventMap,
        TParameters extends Array<unknown>,
        TReturn,
    >(
        settings: WithDispatchOnErrorSettings<
            TEventMap,
            TEventName,
            TParameters
        >,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        const { type, payload } = settings;
        return async ({ next, args }) => {
            try {
                return await next();
            } catch (error: unknown) {
                const event = callInvocable(payload, {
                    args,
                    error,
                });
                if (event === undefined) {
                    throw error;
                }

                void eventDispatcher.dispatch(type, event);

                throw error;
            }
        };
    };
}
