/**
 * @module FileStorage
 */
import { NoOpFileUrlAdapter } from "@/file-storage/implementations/derivables/file-storage/no-op-file-url-adapter.js";

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    FileAdapterSignedDownloadUrlSettings,
    FileAdapterSignedUploadUrlSettings,
    IFileUrlAdapter,
} from "@/file-storage/contracts/_module.js";

/**
 * @internal
 */
export class MergedFileUrlAdapter implements IFileUrlAdapter {
    private readonly noOpUrlAdapter = new NoOpFileUrlAdapter();

    constructor(private readonly adapter: Partial<IFileUrlAdapter>) {}

    async getPublicUrl(
        key: string,
        context: IReadableContext,
    ): Promise<string | null> {
        if (this.adapter.getPublicUrl === undefined) {
            return this.noOpUrlAdapter.getPublicUrl(key, context);
        }
        return this.adapter.getPublicUrl(key, context);
    }

    async getSignedDownloadUrl(
        key: string,
        settings: FileAdapterSignedDownloadUrlSettings,
        context: IReadableContext,
    ): Promise<string | null> {
        if (this.adapter.getSignedDownloadUrl === undefined) {
            return this.noOpUrlAdapter.getSignedDownloadUrl(
                key,
                settings,
                context,
            );
        }
        return this.adapter.getSignedDownloadUrl(key, settings, context);
    }

    async getSignedUploadUrl(
        key: string,
        settings: FileAdapterSignedUploadUrlSettings,
        context: IReadableContext,
    ): Promise<string> {
        if (this.adapter.getSignedUploadUrl === undefined) {
            return this.noOpUrlAdapter.getSignedUploadUrl(
                key,
                settings,
                context,
            );
        }
        return this.adapter.getSignedUploadUrl(key, settings, context);
    }
}
