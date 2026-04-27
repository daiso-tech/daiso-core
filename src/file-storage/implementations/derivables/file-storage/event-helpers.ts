/**
 * @module FileStorage
 */

import { type IEventDispatcher } from "@/event-bus/contracts/_module.js";
import {
    FILE_EVENTS,
    FILE_WRITE_ENUM,
    isFileError,
    type FileEventMap,
    type FileWriteEnum,
    type IFile,
    type IReadableFile,
} from "@/file-storage/contracts/_module.js";
import { type MiddlewareFn } from "@/middleware/contracts/_module.js";
import { type IKey } from "@/namespace/contracts/_module.js";
import { callInvokable, type WaitUntil } from "@/utilities/_module.js";

/**
 * @internal
 */
export function handleUnexpectedErrorEvent<TReturn>(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher<FileEventMap>,
    file?: IReadableFile,
): MiddlewareFn<[], Promise<TReturn>> {
    return async ({ next }) => {
        try {
            return await next();
        } catch (error: unknown) {
            if (isFileError(error)) {
                throw error;
            }

            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.UNEXPECTED_ERROR, {
                    error,
                    file,
                }),
            );

            throw error;
        }
    };
}

/**
 * @internal
 */
export function handleNullableFoundEvent<TReturn>(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    file: IFile,
): MiddlewareFn<[], Promise<TReturn | null>> {
    return async ({ next }) => {
        const value = await next();
        if (value === null) {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                    file,
                }),
            );
        } else {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.FOUND, {
                    file,
                }),
            );
        }
        return value;
    };
}

/**
 * @internal
 */
export function handleBooleanFoundEvent(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    file: IFile,
): MiddlewareFn<[], Promise<boolean>> {
    return async ({ next }) => {
        const exists = await next();
        if (exists) {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.FOUND, {
                    file,
                }),
            );
        } else {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                    file,
                }),
            );
        }
        return exists;
    };
}

/**
 * @internal
 */
export function handleAddEvent(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    file: IFile,
): MiddlewareFn<[], Promise<boolean>> {
    return async ({ next }) => {
        const hasAdded = await next();
        if (hasAdded) {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.ADDED, {
                    file,
                }),
            );
        } else {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.KEY_EXISTS, {
                    file,
                }),
            );
        }
        return hasAdded;
    };
}

/**
 * @internal
 */
export function handleUpdateEvent(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    file: IFile,
): MiddlewareFn<[], Promise<boolean>> {
    return async ({ next }) => {
        const hasUpdated = await next();
        if (hasUpdated) {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.UPDATED, {
                    file,
                }),
            );
        } else {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                    file,
                }),
            );
        }
        return hasUpdated;
    };
}

/**
 * @internal
 */
export function handlePutEvent(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    file: IFile,
): MiddlewareFn<[], Promise<boolean>> {
    return async ({ next }) => {
        const hasUpdated = await next();
        if (hasUpdated) {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.UPDATED, {
                    file,
                }),
            );
        } else {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.ADDED, {
                    file,
                }),
            );
        }
        return hasUpdated;
    };
}

/**
 * @internal
 */
export function handleRemoveEvent(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    file: IFile,
): MiddlewareFn<[], Promise<boolean>> {
    return async ({ next }) => {
        const hasRemoved = await next();
        if (hasRemoved) {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.REMOVED, {
                    file,
                }),
            );
        } else {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                    file,
                }),
            );
        }
        return hasRemoved;
    };
}

/**
 * @internal
 */
export function handleCopyEvent(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    destinationKey: IKey,
    file: IReadableFile,
): MiddlewareFn<[], Promise<FileWriteEnum>> {
    return async ({ next }) => {
        const hasCopied = await next();
        if (hasCopied === FILE_WRITE_ENUM.KEY_EXISTS) {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.DESTINATION_EXISTS, {
                    source: file,
                    destination: destinationKey,
                }),
            );
        }
        if (hasCopied === FILE_WRITE_ENUM.NOT_FOUND) {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                    file,
                }),
            );
        }
        if (hasCopied === FILE_WRITE_ENUM.SUCCESS) {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.COPIED, {
                    source: file,
                    destination: destinationKey,
                    replaced: false,
                }),
            );
        }
        return hasCopied;
    };
}

/**
 * @internal
 */
export function handleCopyAndReplaceEvent(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    destinationKey: IKey,
    file: IReadableFile,
): MiddlewareFn<[], Promise<boolean>> {
    return async ({ next }) => {
        const hasCopied = await next();
        if (hasCopied) {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.COPIED, {
                    source: file,
                    destination: destinationKey,
                    replaced: true,
                }),
            );
        } else {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                    file,
                }),
            );
        }
        return hasCopied;
    };
}

/**
 * @internal
 */
export function handleMoveEvent(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    destinationKey: IKey,
    file: IReadableFile,
): MiddlewareFn<[], Promise<FileWriteEnum>> {
    return async ({ next }) => {
        const hasMoved = await next();
        if (hasMoved === FILE_WRITE_ENUM.KEY_EXISTS) {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.DESTINATION_EXISTS, {
                    source: file,
                    destination: destinationKey,
                }),
            );
        }
        if (hasMoved === FILE_WRITE_ENUM.NOT_FOUND) {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                    file,
                }),
            );
        }
        if (hasMoved === FILE_WRITE_ENUM.SUCCESS) {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.MOVED, {
                    source: file,
                    destination: destinationKey,
                    replaced: false,
                }),
            );
        }
        return hasMoved;
    };
}

/**
 * @internal
 */
export function handleMoveAndReplaceEvent(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    destinationKey: IKey,
    file: IReadableFile,
): MiddlewareFn<[], Promise<boolean>> {
    return async ({ next }) => {
        const hasMoved = await next();
        if (hasMoved) {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.MOVED, {
                    source: file,
                    destination: destinationKey,
                    replaced: true,
                }),
            );
        } else {
            callInvokable(
                waitUntil,
                eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                    file,
                }),
            );
        }
        return hasMoved;
    };
}

/**
 * @internal
 */
export function handleClearEvent(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    filesArr: Array<IReadableFile>,
): MiddlewareFn<[], Promise<boolean>> {
    return async ({ next }) => {
        const hasRemovedAtLeastOne = await next();
        if (hasRemovedAtLeastOne) {
            for (const file of filesArr) {
                callInvokable(
                    waitUntil,
                    eventDispatcher.dispatch(FILE_EVENTS.REMOVED, {
                        file,
                    }),
                );
            }
        } else {
            for (const file of filesArr) {
                callInvokable(
                    waitUntil,
                    eventDispatcher.dispatch(FILE_EVENTS.NOT_FOUND, {
                        file,
                    }),
                );
            }
        }

        return hasRemovedAtLeastOne;
    };
}
