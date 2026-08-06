/**
 * @module FileStorage
 */

import { isSignedFileStorageAdapter } from "@/file-storage/implementations/derivables/file-storage/is-signed-file-storage-adapter.js";
import { SignedFileStorageAdapter } from "@/file-storage/implementations/derivables/file-storage/signed-file-storage-adapter.js";

import type {
    FileStorageAdapterVariants,
    IFileUrlAdapter,
    ISignedFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";

/**
 * @internal
 */
export function resolveFileStorageAdapter(
    fileStorageAdapter: FileStorageAdapterVariants,
    fileUrlAdapter: Partial<IFileUrlAdapter>,
): ISignedFileStorageAdapter {
    if (isSignedFileStorageAdapter(fileStorageAdapter)) {
        return fileStorageAdapter;
    }
    return new SignedFileStorageAdapter(fileStorageAdapter, fileUrlAdapter);
}
