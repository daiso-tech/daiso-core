/**
 * @module FileStorage
 */
import {
    type FildeAdapterSignedUrlSettings,
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
        _settings: FildeAdapterSignedUrlSettings,
    ): Promise<string | null> {
        return Promise.resolve(null);
    }

    getSignedUploadUrl(
        _key: string,
        _settings: FildeAdapterSignedUrlSettings,
    ): Promise<string> {
        return Promise.resolve("");
    }
}
