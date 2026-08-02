/**
 * @module Utilities
 */

import {
    type Invocable,
    isInvocable,
    resolveInvocable,
} from "@/utilities/functions/invocable.js";
import { type Promisable } from "@/utilities/types/promiseable.type.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type Lazy<TValue> = Invocable<[], TValue>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type Lazyable<TValue> = TValue | Lazy<TValue>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type AsyncLazy<TValue> = Invocable<[], Promisable<TValue>>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type AsyncLazyable<TValue> = TValue | AsyncLazy<TValue>;

/**
 * @internal
 */
export function isLazy<TValue>(
    lazyable: Lazyable<TValue>,
): lazyable is Lazy<TValue> {
    return isInvocable(lazyable);
}

/**
 * @internal
 */
export function isPromiseLike<TValue>(
    value: unknown,
): value is PromiseLike<TValue> {
    return (
        typeof value === "object" &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        typeof (value as any)?.then === "function"
    );
}
/**
 * @internal
 */
export function isAsyncLazy<TValue>(
    lazyable: AsyncLazyable<TValue>,
): lazyable is AsyncLazy<TValue> {
    return isInvocable(lazyable);
}

/**
 * @internal
 */
export function resolveLazyable<TValue>(lazyable: Lazyable<TValue>): TValue {
    if (isLazy(lazyable)) {
        return resolveInvocable(lazyable)();
    }
    return lazyable;
}

/**
 * @internal
 */
export async function resolveAsyncLazyable<TValue>(
    lazyable: AsyncLazyable<TValue>,
): Promise<TValue> {
    if (isAsyncLazy(lazyable)) {
        return await resolveInvocable(lazyable)();
    }
    return lazyable;
}
