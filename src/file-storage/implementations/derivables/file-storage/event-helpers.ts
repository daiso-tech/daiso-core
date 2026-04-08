/**
 * @module FileStorage
 */

import { type IEventDispatcher } from "@/event-bus/contracts/_module.js";
import {
    FILE_EVENTS,
    isFileError,
    type FileEventMap,
    type IFile,
    type IReadableFile,
} from "@/file-storage/contracts/_module.js";
import { type MiddlewareFn } from "@/middleware/_module.js";
import { callInvokable, type WaitUntil } from "@/utilities/_module.js";

/**
 * @internal
 */
export function handleUnexpectedErrorEvent<
    TParameters extends Array<unknown>,
    TReturn,
>(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher<FileEventMap>,
    file?: IReadableFile,
): MiddlewareFn<TParameters, Promise<TReturn>> {
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
export function handleNullableFoundEvent<
    TParameters extends Array<unknown>,
    TReturn,
>(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    file: IFile,
): MiddlewareFn<TParameters, Promise<TReturn | null>> {
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
export function handleBooleanFoundEvent<TParameters extends Array<unknown>>(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    file: IFile,
): MiddlewareFn<TParameters, Promise<boolean>> {
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
export function handleAddEvent<TParameters extends Array<unknown>>(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    file: IFile,
): MiddlewareFn<TParameters, Promise<boolean>> {
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
export function handleUpdateEvent<TParameters extends Array<unknown>>(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    file: IFile,
): MiddlewareFn<TParameters, Promise<boolean>> {
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
export function handlePutEvent<TParameters extends Array<unknown>>(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    file: IFile,
): MiddlewareFn<TParameters, Promise<boolean>> {
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
export function handleRemoveEvent<TParameters extends Array<unknown>>(
    waitUntil: WaitUntil,
    eventDispatcher: IEventDispatcher,
    file: IFile,
): MiddlewareFn<TParameters, Promise<boolean>> {
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
