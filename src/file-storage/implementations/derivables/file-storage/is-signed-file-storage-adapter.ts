/**
 * @module FileStorage
 */
import {
    type FileStorageAdapterVariants,
    type ISignedFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";

/**
 * @internal
 */
export function isSignedFileStorageAdapter(
    adapter: FileStorageAdapterVariants,
): adapter is ISignedFileStorageAdapter {
    return (
        typeof adapter === "object" &&
        "getPublicUrl" in adapter &&
        typeof adapter.getPublicUrl === "function" &&
        adapter.getPublicUrl.length === 1 &&
        "getSignedDownloadUrl" in adapter &&
        typeof adapter.getSignedDownloadUrl === "function" &&
        adapter.getSignedDownloadUrl.length === 2 &&
        "getSignedUploadUrl" in adapter &&
        typeof adapter.getSignedUploadUrl === "function" &&
        adapter.getSignedUploadUrl.length === 2 &&
        "exists" in adapter &&
        typeof adapter.exists === "function" &&
        adapter.exists.length === 1 &&
        "getStream" in adapter &&
        typeof adapter.getStream === "function" &&
        adapter.getStream.length === 1 &&
        "getBytes" in adapter &&
        typeof adapter.getBytes === "function" &&
        adapter.getBytes.length === 1 &&
        "getMetaData" in adapter &&
        typeof adapter.getMetaData === "function" &&
        adapter.getMetaData.length === 1 &&
        "add" in adapter &&
        typeof adapter.add === "function" &&
        adapter.add.length === 2 &&
        "addStream" in adapter &&
        typeof adapter.addStream === "function" &&
        adapter.addStream.length === 2 &&
        "update" in adapter &&
        typeof adapter.update === "function" &&
        adapter.update.length === 2 &&
        "updateStream" in adapter &&
        typeof adapter.updateStream === "function" &&
        adapter.updateStream.length === 2 &&
        "put" in adapter &&
        typeof adapter.put === "function" &&
        adapter.put.length === 2 &&
        "putStream" in adapter &&
        typeof adapter.putStream === "function" &&
        adapter.putStream.length === 2 &&
        "copy" in adapter &&
        typeof adapter.copy === "function" &&
        adapter.copy.length === 2 &&
        "copyAndReplace" in adapter &&
        typeof adapter.copyAndReplace === "function" &&
        adapter.copyAndReplace.length === 2 &&
        "move" in adapter &&
        typeof adapter.move === "function" &&
        adapter.move.length === 2 &&
        "moveAndReplace" in adapter &&
        typeof adapter.moveAndReplace === "function" &&
        adapter.moveAndReplace.length === 2
    );
}
