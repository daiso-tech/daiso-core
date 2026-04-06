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
        "getSignedDownloadUrl" in adapter &&
        typeof adapter.getSignedDownloadUrl === "function" &&
        "getSignedUploadUrl" in adapter &&
        typeof adapter.getSignedUploadUrl === "function" &&
        "exists" in adapter &&
        typeof adapter.exists === "function" &&
        "getStream" in adapter &&
        typeof adapter.getStream === "function" &&
        "getBytes" in adapter &&
        typeof adapter.getBytes === "function" &&
        "getMetaData" in adapter &&
        typeof adapter.getMetaData === "function" &&
        "add" in adapter &&
        typeof adapter.add === "function" &&
        "addStream" in adapter &&
        typeof adapter.addStream === "function" &&
        "update" in adapter &&
        typeof adapter.update === "function" &&
        "updateStream" in adapter &&
        typeof adapter.updateStream === "function" &&
        "put" in adapter &&
        typeof adapter.put === "function" &&
        "putStream" in adapter &&
        typeof adapter.putStream === "function" &&
        "copy" in adapter &&
        typeof adapter.copy === "function" &&
        "copyAndReplace" in adapter &&
        typeof adapter.copyAndReplace === "function" &&
        "move" in adapter &&
        typeof adapter.move === "function" &&
        "moveAndReplace" in adapter &&
        typeof adapter.moveAndReplace === "function"
    );
}
