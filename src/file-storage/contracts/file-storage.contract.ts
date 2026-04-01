/**
 * @module FileStorage
 */
import { type IEventListenable } from "@/event-bus/contracts/_module.js";
import { type IFile } from "@/file-storage/contracts/file.contract.js";
import { type FileEventMap } from "@/file-storage/contracts/file.events.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IFileListenable = IEventListenable<FileEventMap>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IFileFactory = {
    create(key: string): IFile;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IFileStorageBase = IFileFactory & {
    clear(): Promise<void>;

    removeMany(files: Iterable<IFile>): Promise<boolean>;
};

/**
 * The `IFileStorage` contract defines a way for managing files independent of the underlying technology.
 * It commes with more convient methods compared to `IFileStorageAdapter`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IFileStorage = IFileStorageBase & {
    readonly events: IFileListenable;
};
