/**
 * @module FileStorage
 */

import {
    type ISignedFileStorageAdapter,
    type IFileStorageAdapter,
} from "@/file-storage/contracts/file-storage-adapter.contract.js";

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type FileStorageAdapterVariants =
    | ISignedFileStorageAdapter
    | IFileStorageAdapter;
