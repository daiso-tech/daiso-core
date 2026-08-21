/**
 * @module DI
 */
import { isClass } from "@/utilities/_module-exports.js";

import type { DiToken } from "@/di/contracts/container.contract.js";

/**
 * Converts a DI token to a readable string representation.
 *
 * Class tokens are rendered using their class name; other tokens are
 * rendered using their id.
 *
 * @param token - The token to format.
 * @returns A string representation of the token.
 * @internal
 */
export function tokenToString(token: DiToken): string {
    if (isClass(token)) {
        return token.name;
    }
    return token.id.toString();
}

/**
 * @internal
 */
type CachedFunc<T, T2> = (cacheArgs: {
    nodeId: T;
    func: () => Promise<T2>;
}) => () => Promise<T2>;

/**
 * @internal
 */
export function createFunctionCache<T1, T2>(): CachedFunc<T1, T2> {
    const functionCache = new Map<T1, () => Promise<T2>>();

    const reusedFunc = (cacheArgs: {
        nodeId: T1;
        func: () => Promise<T2>;
    }): (() => Promise<T2>) => {
        const cachedFunc = functionCache.get(cacheArgs.nodeId);

        const isCachedAlready = cachedFunc !== undefined;

        if (isCachedAlready) {
            return cachedFunc;
        }

        functionCache.set(cacheArgs.nodeId, cacheArgs.func);

        return cacheArgs.func;
    };

    return reusedFunc;
}
