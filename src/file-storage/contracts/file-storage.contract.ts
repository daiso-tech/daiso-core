/**
 * @module FileStorage
 */
import { type IEventListenable } from "@/event-bus/contracts/_module.js";
import { type IFile } from "@/file-storage/contracts/file.contract.js";
import { type FileEventMap } from "@/file-storage/contracts/file.events.js";
import { type ITask } from "@/task/contracts/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IFileListenable = IEventListenable<FileEventMap>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IFileProvider = {
    create(key: string): IFile;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IFileStorageBase = IFileProvider & {
    clear(): ITask<void>;

    removeMany(files: Iterable<IFile>): ITask<boolean>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IFileStorage = IFileStorageBase & {
    readonly events: IFileListenable;
};
