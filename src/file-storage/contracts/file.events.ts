/**
 * @module FileStorage
 */

import { type IReadableFile } from "@/file-storage/contracts/file.contract.js";
import { type IKey } from "@/namespace/contracts/namespace.contract.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Events
 */
export type FileEventBase = {
    file: IReadableFile;
};

/**
 * The event is dispatched when file is found.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Events
 */
export type FoundFileEvent = FileEventBase;

/**
 * The event is dispatched when file is not found.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Events
 */
export type NotFoundFileEvent = FileEventBase;

/**
 * The event is dispatched when file is added.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Events
 */
export type AddedFileEvent = FileEventBase;

/**
 * The event is dispatched when trying to add an key that exists.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Events
 */
export type KeyExistsFileEvent = FileEventBase;

/**
 * The event is dispatched when file is updated.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Events
 */
export type UpdatedFileEvent = FileEventBase;

/**
 * The event is dispatched when file is removed.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Events
 */
export type RemovedFileEvent = FileEventBase;

/**
 * The event is dispatched when file is moved.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Events
 */
export type MovedFileEvent = FileEventBase & {
    destination: IKey;
    replaced: boolean;
};

/**
 * The event is dispatched when file is copeid.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Events
 */
export type CopiedFileEvent = FileEventBase & {
    destination: IKey;
    replaced: boolean;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Events
 */
export type UnexpectedErrorLockEvent = {
    file?: IReadableFile;
    error: unknown;
};

/**
 * The event is dispatched when all keys all cleared of the cache.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Events
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ClearedFileEvent = {};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Events
 */
export const FILE_EVENTS = {
    FOUND: "FOUND",
    NOT_FOUND: "NOT_FOUND",
    ADDED: "ADDED",
    KEY_EXISTS: "KEY_EXISTS",
    UPDATED: "UPDATED",
    REMOVED: "REMOVED",
    CLEARED: "CLEARED",
    MOVED: "MOVED",
    COPIED: "COPIED",
    UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Events
 */
export type FileEventMap = {
    [FILE_EVENTS.NOT_FOUND]: NotFoundFileEvent;
    [FILE_EVENTS.FOUND]: FoundFileEvent;
    [FILE_EVENTS.ADDED]: AddedFileEvent;
    [FILE_EVENTS.KEY_EXISTS]: KeyExistsFileEvent;
    [FILE_EVENTS.UPDATED]: UpdatedFileEvent;
    [FILE_EVENTS.REMOVED]: RemovedFileEvent;
    [FILE_EVENTS.CLEARED]: ClearedFileEvent;
    [FILE_EVENTS.MOVED]: MovedFileEvent;
    [FILE_EVENTS.COPIED]: CopiedFileEvent;
    [FILE_EVENTS.UNEXPECTED_ERROR]: UnexpectedErrorLockEvent;
};
