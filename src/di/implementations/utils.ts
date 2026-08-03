import { type DiToken } from "@/di/contracts/container.contract.js";

/**
 * All possible service lifetime scopes.
 * - `"singleton"`: one instance for the app lifetime.
 * - `"transient"`: new instance per resolution.
 * - `"scoped"`: one instance per scope (e.g., request).
 * - `"dynamic"`: dynamically registered in a child scope.
 */
/** Lifespan constants used to define service scope. */

export const LIFESPAN = {
    SINGLETON: "singleton",
    TRANSIENT: "transient",
    SCOPED: "scoped",
    DYNAMIC: "dynamic",
} as const;

export type TLifespan = (typeof LIFESPAN)[keyof typeof LIFESPAN];
export type TEdge = [DiToken, DiToken];
export type TNode = DiToken;

type CachedFunc<T, T2> = (cacheArgs: {
    nodeId: T;
    newFunc: () => Promise<T2>;
}) => () => Promise<T2>;

export function createFunctionCache<T1, T2>(): CachedFunc<T1, T2> {
    const functionCache = new Map<T1, () => Promise<T2>>();

    const reusedFunc = (cacheArgs: {
        nodeId: T1;
        newFunc: () => Promise<T2>;
    }): (() => Promise<T2>) => {
        const cachedFunc = functionCache.get(cacheArgs.nodeId);

        const isCachedAlready = cachedFunc !== undefined;

        if (isCachedAlready) {
            return cachedFunc;
        }

        functionCache.set(cacheArgs.nodeId, cacheArgs.newFunc);

        return cacheArgs.newFunc;
    };

    return reusedFunc;
}
