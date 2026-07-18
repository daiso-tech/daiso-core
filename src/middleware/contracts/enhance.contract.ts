/**
 * @module Middleware
 */

import { type Middleware } from "@/middleware/contracts/use.contract.js";
import { type InvokableFn, type OneOrMore } from "@/utilities/_module.js";

/**
 * Extracts the keys of an object whose values are invokable functions.
 *
 * This utility type filters the keys of `TInstance` to only include those
 * that are functions, enabling type-safe method selection when applying
 * middleware to specific methods of an object.
 *
 * @typeParam TInstance - The object type to extract method names from
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Contracts
 */
export type InferMethodNames<TInstance> = {
    [TKey in keyof TInstance]: TInstance[TKey] extends InvokableFn<any, any>
        ? TKey
        : never;
}[keyof TInstance];

/**
 * Infers the parameter tuple type from an invokable function or method.
 *
 * Given an invokable value, extracts its arguments as a tuple type.
 * This is used internally by the middleware system to derive the correct
 * type parameters for middleware from the enhanced method's signature.
 *
 * @typeParam TValue - The invokable type to extract parameters from
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Contracts
 */
export type InferParameters<TValue> =
    TValue extends InvokableFn<infer R, any> ? R : never;

/**
 * Infers the return type from an invokable function or method.
 *
 * Given an invokable value, extracts its return type.
 * This is used internally by the middleware system to derive the correct
 * type parameters for middleware from the enhanced method's return type.
 *
 * @typeParam TValue - The invokable type to extract the return type from
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Contracts
 */
export type InferReturn<TValue> =
    TValue extends InvokableFn<Array<any>, infer R> ? R : never;

/**
 * Enhances a method on an object by wrapping it with one or more middleware.
 *
 * Unlike {@link Use | `Use`}, which creates a new standalone wrapped function,
 * `Enhance` mutates the target object **in-place** by replacing `obj[field]` with
 * a version that runs through the middleware chain before delegating to the
 * original method.
 *
 * This is useful for augmenting existing class instances or objects with
 * cross-cutting concerns (logging, caching, retry, metrics, etc.) without
 * changing their public API — callers continue to invoke the method the same way.
 *
 * `Enhance` works with object literal methods, static class methods, class instance methods, class prototype methods.
 *
 * @typeParam TInstance - The type of the object containing the method
 * @typeParam TField - The method name (constrained to invokable keys of `TInstance`)
 *
 * @param obj - The target object whose method will be enhanced
 * @param field - The name of the method to wrap with middleware
 * @param middlewares - One or more middleware to apply, executed in priority order
 *
 * @returns `void` — the object is mutated directly
 *
 * @example
 * ```ts
 * // 2. Define a class with a method to enhance
 * class UserService {
 *   async getUser(id: string): Promise<{ name: string }> {
 *     console.log(`Fetching user ${id}...`);
 *     return { name: "Alice" };
 *   }
 * }
 *
 * function main(enhance: Enhance): void {
 *   // 4. Enhance the method — mutates the instance in-place
 *   const service = new UserService();
 *   enhance(service, "getUser", [loggingMiddleware, cacheMiddleware]);
 *
 *   // 5. Call as usual — middleware runs automatically
 *   await service.getUser("123");
 *   // Logs:
 *   //   getUser called with: ["123"]
 *   //   Fetching user 123...
 *   //   getUser returned: { name: "Alice" }
 * }
 *
 * ```
 *
 * @see {@link Use | `Use`} — creates a new wrapped function without mutation
 * @see {@link Middleware | `Middleware`} — the middleware type
 * @see {@link enhanceFactory | `enhanceFactory`} — factory to create an `Enhance` function
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Contracts
 */
export type Enhance = <TInstance, TField extends InferMethodNames<TInstance>>(
    obj: TInstance,
    field: TField,
    middlewares: OneOrMore<
        Middleware<
            InferParameters<TInstance[TField]>,
            InferReturn<TInstance[TField]>
        >
    >,
) => void;
