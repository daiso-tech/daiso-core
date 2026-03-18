/**
 * @module Utilities
 */

import { getConstructorName } from "@/utilities/functions/get-constructor-name.js";
import { isClass } from "@/utilities/functions/is-class.js";
import { isNullable } from "@/utilities/functions/is-nullable.js";
import { type NoneFunc } from "@/utilities/types/none-func.type.js";
import { type Promisable } from "@/utilities/types/promiseable.type.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type InvokableFn<
    TArgs extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = (...args: TArgs) => TReturn;

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type IInvokableObject<
    TArgs extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = {
    invoke(...args: TArgs): TReturn;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type Invokable<
    TArgs extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = InvokableFn<TArgs, TReturn> | IInvokableObject<TArgs, TReturn>;
/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type IAsyncFactoryObject<TInput, TOutput> = IInvokableObject<
    [value: TInput],
    Promisable<NoneFunc<TOutput>>
>;

/**
 * @internal
 */
export function isInvokableObject<
    TValue,
    TParameters extends Array<unknown>,
    TReturn,
>(
    invokable: TValue | Invokable<TParameters, TReturn>,
): invokable is IInvokableObject<TParameters, TReturn> {
    const invokable_ = invokable as Record<string, unknown>;
    return !isNullable(invokable) && typeof invokable_["invoke"] === "function";
}

/**
 * @internal
 */
export function isInvokableFn<
    TValue,
    TParameters extends Array<unknown>,
    TReturn,
>(
    invokable: TValue | Invokable<TParameters, TReturn>,
): invokable is InvokableFn<TParameters, TReturn> {
    return typeof invokable === "function";
}

/**
 * @internal
 */
export function isInvokable<
    TValue,
    TParameters extends Array<unknown>,
    TReturn,
>(
    invokable: TValue | Invokable<TParameters, TReturn>,
): invokable is Invokable<TParameters, TReturn> {
    return (
        (isInvokableObject(invokable) || isInvokableFn(invokable)) &&
        !isClass(invokable)
    );
}

/**
 * @internal
 */
export function resolveInvokable<TParameters extends Array<unknown>, TReturn>(
    invokable: Invokable<TParameters, TReturn>,
): InvokableFn<TParameters, TReturn> {
    if (isInvokableObject(invokable)) {
        return (...args) => invokable.invoke(...args);
    }
    return (...args) => invokable(...args);
}

/**
 * @internal
 */
export function callInvokable<TParameters extends Array<unknown>, TReturn>(
    invokable: Invokable<TParameters, TReturn>,
    ...args: TParameters
): TReturn {
    if (isInvokableObject(invokable)) {
        return invokable.invoke(...args);
    }
    return invokable(...args);
}

/**
 * @internal
 */
export function getInvokableName<TParameters extends Array<unknown>, TReturn>(
    invokable: Invokable<TParameters, TReturn>,
): string {
    if (isInvokableFn(invokable)) {
        return invokable.name;
    }
    return getConstructorName(invokable);
}
