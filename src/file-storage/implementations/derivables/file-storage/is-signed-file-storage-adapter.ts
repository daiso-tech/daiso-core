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
        adapter.getPublicUrl.length === 2 &&
        "getSignedDownloadUrl" in adapter &&
        typeof adapter.getSignedDownloadUrl === "function" &&
        adapter.getSignedDownloadUrl.length === 3 &&
        "getSignedUploadUrl" in adapter &&
        typeof adapter.getSignedUploadUrl === "function" &&
        adapter.getSignedUploadUrl.length === 3 &&
        "exists" in adapter &&
        typeof adapter.exists === "function" &&
        adapter.exists.length === 2 &&
        "getStream" in adapter &&
        typeof adapter.getStream === "function" &&
        adapter.getStream.length === 2 &&
        "getBytes" in adapter &&
        typeof adapter.getBytes === "function" &&
        adapter.getBytes.length === 2 &&
        "getMetaData" in adapter &&
        typeof adapter.getMetaData === "function" &&
        adapter.getMetaData.length === 2 &&
        "add" in adapter &&
        typeof adapter.add === "function" &&
        adapter.add.length === 3 &&
        "addStream" in adapter &&
        typeof adapter.addStream === "function" &&
        adapter.addStream.length === 3 &&
        "update" in adapter &&
        typeof adapter.update === "function" &&
        adapter.update.length === 3 &&
        "updateStream" in adapter &&
        typeof adapter.updateStream === "function" &&
        adapter.updateStream.length === 3 &&
        "put" in adapter &&
        typeof adapter.put === "function" &&
        adapter.put.length === 3 &&
        "putStream" in adapter &&
        typeof adapter.putStream === "function" &&
        adapter.putStream.length === 3 &&
        "copy" in adapter &&
        typeof adapter.copy === "function" &&
        adapter.copy.length === 3 &&
        "copyAndReplace" in adapter &&
        typeof adapter.copyAndReplace === "function" &&
        adapter.copyAndReplace.length === 3 &&
        "move" in adapter &&
        typeof adapter.move === "function" &&
        adapter.move.length === 3 &&
        "moveAndReplace" in adapter &&
        typeof adapter.moveAndReplace === "function" &&
        adapter.moveAndReplace.length === 3
    );
}
