/**
 * @module FileStorage
 */
import { type IFile } from "@/file-storage/contracts/file.contract.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IFileFactory = {
    create(key: string): IFile;
};

/**
 * The `IFileStorage` contract defines a way for managing files independent of the underlying technology.
 * It commes with more convient methods compared to `IFileStorageAdapter`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IFileStorage = IFileFactory & {
    clear(): Promise<void>;

    removeMany(files: Iterable<IFile>): Promise<boolean>;
};
