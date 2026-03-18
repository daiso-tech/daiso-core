/**
 * @module FileStorage
 */
import {
    type FileAdapterSignedDownloadUrlSettings,
    type FileAdapterSignedUploadUrlSettings,
    type IFileUrlAdapter,
} from "@/file-storage/contracts/_module.js";

/**
 * @internal
 */
export class NoOpFileUrlAdapter implements IFileUrlAdapter {
    getPublicUrl(_key: string): Promise<string | null> {
        return Promise.resolve(null);
    }

    getSignedDownloadUrl(
        _key: string,
        _settings: FileAdapterSignedDownloadUrlSettings,
    ): Promise<string | null> {
        return Promise.resolve(null);
    }

    getSignedUploadUrl(
        _key: string,
        _settings: FileAdapterSignedUploadUrlSettings,
    ): Promise<string> {
        return Promise.resolve("");
    }
}
