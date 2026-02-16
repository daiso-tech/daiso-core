/**
 * @module FileStorage
 */
import {
    type FildeAdapterSignedUrlSettings,
    type IFileUrlAdapter,
} from "@/file-storage/contracts/_module.js";
import { NoOpFileUrlAdapter } from "@/file-storage/implementations/derivables/file-storage/no-op-file-url-adapter.js";

export class MergedFileUrlAdapter implements IFileUrlAdapter {
    private readonly noOpUrlAdapter = new NoOpFileUrlAdapter();

    constructor(private readonly adapter: Partial<IFileUrlAdapter>) {}

    async getPublicUrl(key: string): Promise<string | null> {
        if (this.adapter.getPublicUrl === undefined) {
            return this.noOpUrlAdapter.getPublicUrl(key);
        }
        return this.adapter.getPublicUrl(key);
    }

    async getSignedDownloadUrl(
        key: string,
        settings: FildeAdapterSignedUrlSettings,
    ): Promise<string | null> {
        if (this.adapter.getSignedDownloadUrl === undefined) {
            return this.noOpUrlAdapter.getSignedDownloadUrl(key, settings);
        }
        return this.adapter.getSignedDownloadUrl(key, settings);
    }

    async getSignedUploadUrl(
        key: string,
        settings: FildeAdapterSignedUrlSettings,
    ): Promise<string> {
        if (this.adapter.getSignedUploadUrl === undefined) {
            return this.noOpUrlAdapter.getSignedUploadUrl(key, settings);
        }
        return this.adapter.getSignedUploadUrl(key, settings);
    }
}
