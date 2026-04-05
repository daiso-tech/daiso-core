/**
 * @module FileStorage
 */
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type FileAdapterSignedDownloadUrlSettings,
    type FileAdapterSignedUploadUrlSettings,
    type IFileUrlAdapter,
} from "@/file-storage/contracts/_module.js";
import { NoOpFileUrlAdapter } from "@/file-storage/implementations/derivables/file-storage/no-op-file-url-adapter.js";

/**
 * @internal
 */
export class MergedFileUrlAdapter implements IFileUrlAdapter {
    private readonly noOpUrlAdapter = new NoOpFileUrlAdapter();

    constructor(private readonly adapter: Partial<IFileUrlAdapter>) {}

    async getPublicUrl(
        context: IReadableContext,
        key: string,
    ): Promise<string | null> {
        if (this.adapter.getPublicUrl === undefined) {
            return this.noOpUrlAdapter.getPublicUrl(context, key);
        }
        return this.adapter.getPublicUrl(context, key);
    }

    async getSignedDownloadUrl(
        context: IReadableContext,
        key: string,
        settings: FileAdapterSignedDownloadUrlSettings,
    ): Promise<string | null> {
        if (this.adapter.getSignedDownloadUrl === undefined) {
            return this.noOpUrlAdapter.getSignedDownloadUrl(
                context,
                key,
                settings,
            );
        }
        return this.adapter.getSignedDownloadUrl(context, key, settings);
    }

    async getSignedUploadUrl(
        context: IReadableContext,
        key: string,
        settings: FileAdapterSignedUploadUrlSettings,
    ): Promise<string> {
        if (this.adapter.getSignedUploadUrl === undefined) {
            return this.noOpUrlAdapter.getSignedUploadUrl(
                context,
                key,
                settings,
            );
        }
        return this.adapter.getSignedUploadUrl(context, key, settings);
    }
}
