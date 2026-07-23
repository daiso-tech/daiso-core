/**
 * @module Cache
 */

import { type ICacheAdapter } from "@/cache/contracts/_module.js";
import { type ILockFactory } from "@/lock/contracts/_module.js";
import { type PluginFn } from "@/middleware/contracts/_module.js";

/**
 * Cache adapter methods that can be protected by a write lock.
 *
 * Only the mutable methods that modify cache state are eligible for write-lock
 * protection.
 *
 * @group Plugins
 */
export type WithCacheWriteLockMethods = keyof Pick<
    ICacheAdapter,
    | "getAndRemove"
    | "add"
    | "put"
    | "update"
    | "increment"
    | "removeMany"
    | "getOrAdd"
>;

/**
 * Settings for the {@link withCacheWriteLock} plugin.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/plugins"`
 * @group Plugins
 */
export type WithCacheWriteLockSettings = {
    /**
     * A factory that creates named locks.
     * Each lock is keyed by the cache key to ensure concurrent writes
     * to the same cache entry are serialised while writes to different
     * entries can proceed in parallel.
     */
    lockFactory: ILockFactory;

    /**
     * The subset of mutating methods to protect with a write lock.
     * When omitted, all mutating methods are protected.
     *
     * @default
     * ```ts
     * ["getAndRemove", "add", "put", "update", "increment", "removeMany", "getOrAdd"]
     * ```
     */
    onlyMethods?: Array<WithCacheWriteLockMethods>;
};

/**
 * Creates a plugin that acquires a distributed lock before executing mutating
 * cache operations.
 *
 * This plugin wraps write operations (`add`, `put`, `update`, `increment`,
 * `getAndRemove`, `removeMany`) with a lock acquired via {@link ILockFactory}.
 * The lock key is derived from the cache key, ensuring that concurrent writes
 * to the same cache entry are serialised. By default all mutating methods are
 * protected; use `onlyMethods` to restrict which operations are locked.
 *
 * @param settings - Configuration for the write-lock behaviour.
 * @param settings.lockFactory - A factory that creates named locks.
 * @param settings.onlyMethods - The subset of methods to protect with a write
 *                               lock. Defaults to all mutating methods.
 * @returns A middleware plugin that wraps an `ICacheAdapter`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/plugins"`
 * @typeParam TType - The type of values stored in the cache.
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
                    for (const key of [...new Set(keys)].reverse()) {
                        const prevFn = fn;
                        fn = () => lockFactory.create(key).runOrFail(prevFn);
                    }
                    return fn();
                },
            );
        }
    };
}
