/**
 * @module FileStorage
 */
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type FileAdapterSignedDownloadUrlSettings,
    type FileAdapterSignedUploadUrlSettings,
    type IFileUrlAdapter,
} from "@/file-storage/contracts/_module.js";

/**
 * @internal
 */
export class NoOpFileUrlAdapter implements IFileUrlAdapter {
    getPublicUrl(
        _key: string,
        _context: IReadableContext,
    ): Promise<string | null> {
        return Promise.resolve(null);
    }

    getSignedDownloadUrl(
        _key: string,
        _settings: FileAdapterSignedDownloadUrlSettings,
        _context: IReadableContext,
    ): Promise<string | null> {
        return Promise.resolve(null);
    }

    getSignedUploadUrl(
        _key: string,
        _settings: FileAdapterSignedUploadUrlSettings,
        _context: IReadableContext,
    ): Promise<string> {
        return Promise.resolve("");
    }
}
