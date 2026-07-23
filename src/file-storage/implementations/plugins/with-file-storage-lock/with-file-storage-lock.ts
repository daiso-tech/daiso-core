/**
 * @module FileStorage
 */

import {
    type IFileUrlAdapter,
    type IFileStorageAdapter,
    type ISignedFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";
import { type ILockFactory } from "@/lock/contracts/_module.js";
import { type PluginFn } from "@/middleware/contracts/_module.js";

/**
 * All methods of {@link ISignedFileStorageAdapter | `ISignedFileStorageAdapter`} that can be protected by a lock,
 * excluding `removeByPrefix` (which operates on key patterns rather than concrete keys).
 *
 * @group Plugins
 */
export type WithFileStorageLockMethods = keyof Omit<
    ISignedFileStorageAdapter,
    "removeByPrefix"
>;

/**
 * Configuration for the {@link withFileStorageLock} plugin.
 * Requires a lock factory and optionally restricts which methods are protected.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/plugins"`
 * @group Plugins
 */
export type WithFileStorageLockSettings = {
    /**
     * A factory that creates named locks.
     * Each lock is keyed by the file key to ensure concurrent operations
     * on the same file are serialised while operations on different files
     * can proceed in parallel.
     */
    lockFactory: ILockFactory;

    /**
     * @default
     * ```ts
     * [
     *   "exists",
     *   "getStream",
     *   "getBytes",
     *   "getMetaData",
     *   "add",
     *   "addStream",
     *   "update",
     *   "updateStream",
     *   "put",
     *   "putStream",
     *   "copy",
     *   "copyAndReplace",
     *   "move",
     *   "moveAndReplace",
     *   "removeMany",
     *   "getPublicUrl",
     *   "getSignedDownloadUrl",
     *   "getSignedUploadUrl",
     * ]
     * ```
     */
    /**
     * The subset of methods to protect with a lock.
     * When omitted, all methods except `removeByPrefix` are protected by default.
     * @default
     * ```ts
     * [
     *   "exists",
     *   "getStream",
     *   "getBytes",
     *   "getMetaData",
     *   "add",
     *   "addStream",
     *   "update",
     *   "updateStream",
     *   "put",
     *   "putStream",
     *   "copy",
     *   "copyAndReplace",
     *   "move",
     *   "moveAndReplace",
     *   "removeMany",
     *   "getPublicUrl",
     *   "getSignedDownloadUrl",
     *   "getSignedUploadUrl",
     * ]
     * ```
     */
    onlyMethods?: Array<WithFileStorageLockMethods>;
};

/**
 * @internal
 */
function withFileStorageReadLock(
    settings: WithFileStorageLockSettings,
): PluginFn<Partial<IFileUrlAdapter> & IFileStorageAdapter> {
    const {
        lockFactory,
        onlyMethods = [
            "getPublicUrl",
            "getSignedDownloadUrl",
            "getSignedUploadUrl",
            "exists",
            "getStream",
            "getBytes",
            "getMetaData",
        ],
    } = settings;

    return (_adapter, _enhance) => {
        if (onlyMethods.includes("getPublicUrl")) {
            _enhance(
                _adapter,
                "getPublicUrl",
                ({ args: [_context, key, ..._rest], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }

        if (onlyMethods.includes("getSignedDownloadUrl")) {
            _enhance(
                _adapter,
                "getSignedDownloadUrl",
                ({ args: [_context, key, ..._rest], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }

        if (onlyMethods.includes("getSignedUploadUrl")) {
            _enhance(
                _adapter,
                "getSignedUploadUrl",
                ({ args: [_context, key, ..._rest], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }

        if (onlyMethods.includes("exists")) {
            _enhance(_adapter, "exists", ({ args: [_context, key], next }) => {
                return lockFactory.create(key).runOrFail(() => {
                    return next();
                });
            });
        }

        if (onlyMethods.includes("getStream")) {
            _enhance(
                _adapter,
                "getStream",
                ({ args: [_context, key], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }

        if (onlyMethods.includes("getBytes")) {
            _enhance(
                _adapter,
                "getBytes",
                ({ args: [_context, key], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }

        if (onlyMethods.includes("getMetaData")) {
            _enhance(
                _adapter,
                "getMetaData",
                ({ args: [_context, key], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }
    };
}

/**
 * @internal
 */
function withFileStorageMutationLock(
    settings: WithFileStorageLockSettings,
): PluginFn<Partial<IFileUrlAdapter> & IFileStorageAdapter> {
    const {
        lockFactory,
        onlyMethods = [
            "add",
            "addStream",
            "update",
            "updateStream",
            "put",
            "putStream",
        ],
    } = settings;

    return (_adapter, _enhance) => {
        if (onlyMethods.includes("add")) {
            _enhance(
                _adapter,
                "add",
                ({ args: [_context, key, ..._rest], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }

        if (onlyMethods.includes("addStream")) {
            _enhance(
                _adapter,
                "addStream",
                ({ args: [_context, key, ..._rest], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }

        if (onlyMethods.includes("update")) {
            _enhance(
                _adapter,
                "update",
                ({ args: [_context, key, ..._rest], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }

        if (onlyMethods.includes("updateStream")) {
            _enhance(
                _adapter,
                "updateStream",
                ({ args: [_context, key, ..._rest], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }

        if (onlyMethods.includes("put")) {
            _enhance(
                _adapter,
                "put",
                ({ args: [_context, key, ..._rest], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }

        if (onlyMethods.includes("putStream")) {
            _enhance(
                _adapter,
                "putStream",
                ({ args: [_context, key, ..._rest], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }
    };
}

/**
 * @internal
 */
function withFileStorageCopyMoveLock(
    settings: WithFileStorageLockSettings,
): PluginFn<Partial<IFileUrlAdapter> & IFileStorageAdapter> {
    const {
        lockFactory,
        onlyMethods = ["copy", "copyAndReplace", "move", "moveAndReplace"],
    } = settings;

    return (_adapter, _enhance) => {
        if (onlyMethods.includes("copy")) {
            _enhance(
                _adapter,
                "copy",
                ({ args: [_context, key, ..._rest], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }

        if (onlyMethods.includes("copyAndReplace")) {
            _enhance(
                _adapter,
                "copyAndReplace",
                ({ args: [_context, key, ..._rest], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }

        if (onlyMethods.includes("move")) {
            _enhance(
                _adapter,
                "move",
                ({ args: [_context, key, ..._rest], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }

        if (onlyMethods.includes("moveAndReplace")) {
            _enhance(
                _adapter,
                "moveAndReplace",
                ({ args: [_context, key, ..._rest], next }) => {
                    return lockFactory.create(key).runOrFail(() => {
                        return next();
                    });
                },
            );
        }
    };
}

/**
 * @internal
 */
function withFileStorageRemovalLock(
    settings: WithFileStorageLockSettings,
): PluginFn<Partial<IFileUrlAdapter> & IFileStorageAdapter> {
    const { lockFactory, onlyMethods = ["removeMany"] } = settings;

    return (_adapter, _enhance) => {
        if (onlyMethods.includes("removeMany")) {
            _enhance(
                _adapter,
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

/**
 * Creates a plugin that acquires a distributed lock before executing any
 * operation on a file-storage adapter.
 *
 * This plugin wraps all methods (reads, writes, copy/move, removal, and URL
 * generation) with a lock acquired via {@link ILockFactory | `ILockFactory`}.
 * The lock key is derived from the file key (or source key for `copy`/`move`),
 * ensuring that concurrent operations on the same file are serialised while
 * operations on different files can proceed in parallel.
 *
 * By default all methods are protected. Use `onlyMethods` to restrict which
 * operations are locked.
 *
 * @param settings - Configuration for the lock behaviour.
 * @param settings.lockFactory - A factory that creates named locks.
 * @param settings.onlyMethods - The subset of methods to protect with a lock.
 *                               Defaults to all methods (except `removeByPrefix`).
 * @returns A middleware plugin that wraps an `ISignedFileStorageAdapter`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/plugins"`
 * @typeParam TType - The type of values stored in the file storage.
 * @group Plugins
 */
export function withFileStorageLock(
    settings: WithFileStorageLockSettings,
): PluginFn<Partial<IFileUrlAdapter> & IFileStorageAdapter> {
    return (adapter, enhance) => {
        withFileStorageReadLock(settings)(adapter, enhance);
        withFileStorageMutationLock(settings)(adapter, enhance);
        withFileStorageCopyMoveLock(settings)(adapter, enhance);
        withFileStorageRemovalLock(settings)(adapter, enhance);
    };
}
