/**
 * @module FileStorage
 */

import {
    type ISignedFileStorageAdapter,
    type IFileStorageAdapter,
} from "@/file-storage/contracts/file-storage-adapter.contract.js";

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Contracts
 */
export type FileStorageAdapterVariants =
    ISignedFileStorageAdapter | IFileStorageAdapter;
