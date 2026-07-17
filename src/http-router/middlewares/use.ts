/**
 * @module HttpRouter
 */
import {
    type WinterTcMiddleware,
    type WinterTcRequestHandler,
} from "@/http-router/contracts/_module.js";
import {
    callInvokable,
    resolveOneOrMore,
    type OneOrMore,
} from "@/utilities/_module.js";

/**
 * Wraps a core {@link WinterTcRequestHandler} with one or more
 * {@link WinterTcMiddleware} functions or objects, producing a new
 * handler that applies the middlewares before delegating to the core.
 *
 * The middlewares are applied in **reverse order** so that the first
 * middleware in the list runs outermost (receives the request first),
 * following the standard onion/chain-of-responsibility pattern.
 *
 * @param coreHandler - The innermost handler to invoke after all
 *   middlewares have run. Typically the route-resolution logic.
 * @param middlewares - One or more WinterTC middleware functions or
 *   objects to wrap around the core handler.
 * @returns A new `WinterTcRequestHandler` with the middlewares applied.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/middlewares"`
 * @group Implementations
 */
export function use(
    coreHandler: WinterTcRequestHandler,
    middlewares: OneOrMore<WinterTcMiddleware>,
): WinterTcRequestHandler {
    const middlewareList = resolveOneOrMore(middlewares);

    let handler = coreHandler;
    for (const middleware of [...middlewareList].reverse()) {
        const next = handler;
        handler = (req) => callInvokable(middleware, req, next);
    }

    return handler;
}
