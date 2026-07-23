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
 * Settings for the {@link withFileStorageLock} plugin.
 *
 * @group Plugins
 */
export type WithFileStorageLockSettings = {
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
     *   "removeByPrefix",
     *   "getPublicUrl",
     *   "getSignedDownloadUrl",
     *   "getSignedUploadUrl",
     * ]
     * ```
     */
    onlyMethods?: Array<keyof ISignedFileStorageAdapter>;
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
 * @internal
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
