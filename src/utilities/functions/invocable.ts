/**
 * @module Utilities
 */

import { getConstructorName } from "@/utilities/functions/get-constructor-name.js";
import { isClass } from "@/utilities/functions/is-class.js";
import { isNullable } from "@/utilities/functions/is-nullable.js";

/**
 * IMPORT_PATH: `"eridu-tech/utilities"`
 */
export type InvocableFn<
    TArgs extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = (...args: TArgs) => TReturn;

/**
 * IMPORT_PATH: `"eridu-tech/utilities"`
 */
export type IInvocableObject<
    TArgs extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = {
    invoke(...args: TArgs): TReturn;
};

/**
 * IMPORT_PATH: `"eridu-tech/utilities"`
 */
export type Invocable<
    TArgs extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = InvocableFn<TArgs, TReturn> | IInvocableObject<TArgs, TReturn>;

/**
 * @internal
 */
export function isInvocableObject<
    TValue,
    TParameters extends Array<unknown>,
    TReturn,
>(
    invocable: TValue | Invocable<TParameters, TReturn>,
): invocable is IInvocableObject<TParameters, TReturn> {
    const invocable_ = invocable as Record<string, unknown>;
    return !isNullable(invocable) && typeof invocable_["invoke"] === "function";
}

/**
 * @internal
 */
export function isInvocableFn<
    TValue,
    TParameters extends Array<unknown>,
    TReturn,
>(
    invocable: TValue | Invocable<TParameters, TReturn>,
): invocable is InvocableFn<TParameters, TReturn> {
    return typeof invocable === "function";
}

/**
 * @internal
 */
export function isInvocable<
    TValue,
    TParameters extends Array<unknown>,
    TReturn,
>(
    invocable: TValue | Invocable<TParameters, TReturn>,
): invocable is Invocable<TParameters, TReturn> {
    return (
        (isInvocableObject(invocable) || isInvocableFn(invocable)) &&
        !isClass(invocable)
    );
}

/**
 * @internal
 */
export function resolveInvocable<TParameters extends Array<unknown>, TReturn>(
    invocable: Invocable<TParameters, TReturn>,
): InvocableFn<TParameters, TReturn> {
    if (isInvocableObject(invocable)) {
        return (...args) => invocable.invoke(...args);
    }
    return (...args) => invocable(...args);
}

/**
 * @internal
 */
export function callInvocable<TParameters extends Array<unknown>, TReturn>(
    invocable: Invocable<TParameters, TReturn>,
    ...args: TParameters
): TReturn {
    if (isInvocableObject(invocable)) {
        return invocable.invoke(...args);
    }
    return invocable(...args);
}

/**
 * @internal
 */
export function getInvocableName<TParameters extends Array<unknown>, TReturn>(
    invocable: Invocable<TParameters, TReturn>,
): string {
    if (isInvocableFn(invocable)) {
        return invocable.name;
    }
    return getConstructorName(invocable);
}
