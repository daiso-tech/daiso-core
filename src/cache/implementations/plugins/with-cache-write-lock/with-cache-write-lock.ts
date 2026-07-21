/**
 * @module Cache
 */

import { type ICacheAdapter } from "@/cache/contracts/_module.js";
import { type ILockFactory } from "@/lock/contracts/_module.js";
import { type PluginFn } from "@/middleware/contracts/_module.js";

/**
 * @group Plugins
 */
export type WithCacheWriteLockMethods = keyof Pick<
    ICacheAdapter,
    "getAndRemove" | "add" | "put" | "update" | "increment" | "removeMany"
>;

/**
 * @group Plugins
 */
export type WithCacheWriteLockSettings = {
    lockFactory: ILockFactory;

    /**
     * @default
     * ```ts
     * ["getAndRemove", "add", "put", "update", "increment", "removeMany"]
     * ```
     */
    onlyMethods?: Array<WithCacheWriteLockMethods>;
};

/**
 * @group Plugins
 */
export function withCacheWriteLock<TType>(
    settings: WithCacheWriteLockSettings,
): PluginFn<ICacheAdapter<TType>> {
    const {
        lockFactory,
        onlyMethods = [
            "getAndRemove",
            "add",
            "put",
            "update",
            "increment",
            "removeMany",
        ],
    } = settings;
    return (adapter, enhance) => {
        if (
            onlyMethods.includes(
                "getAndRemove" satisfies WithCacheWriteLockMethods,
            )
        ) {
            enhance(
                adapter,
                "getAndRemove",
                ({ args: [_context, key], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }

        if (onlyMethods.includes("add" satisfies WithCacheWriteLockMethods)) {
            enhance(adapter, "add", ({ args: [_context, key], next }) => {
                return lockFactory.create(key).runOrFail(() => {
                    return next();
                });
            });
        }

        if (onlyMethods.includes("put" satisfies WithCacheWriteLockMethods)) {
            enhance(adapter, "put", ({ args: [_context, key], next }) => {
                return lockFactory.create(key).runOrFail(() => {
                    return next();
                });
            });
        }

        if (
            onlyMethods.includes("update" satisfies WithCacheWriteLockMethods)
        ) {
            enhance(adapter, "update", ({ args: [_context, key], next }) => {
                return lockFactory.create(key).runOrFail(() => {
                    return next();
                });
            });
        }

        if (
            onlyMethods.includes(
                "increment" satisfies WithCacheWriteLockMethods,
            )
        ) {
            enhance(adapter, "increment", ({ args: [_context, key], next }) => {
                return lockFactory.create(key).runOrFail(() => {
                    return next();
                });
            });
        }

        if (
            onlyMethods.includes(
                "removeMany" satisfies WithCacheWriteLockMethods,
            )
        ) {
            enhance(
                adapter,
                "removeMany",
                ({ args: [_context, keys], next }) => {
                    let fn = () => next();
                    for (const key of keys) {
                        const prevFn = fn;
                        fn = () => lockFactory.create(key).runOrFail(prevFn);
                    }
                    return fn();
                },
            );
        }
    };
}
