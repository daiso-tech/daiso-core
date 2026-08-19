/**
 * @module FileStorage
 */

import { MergedFileUrlAdapter } from "@/file-storage/implementations/derivables/file-storage/merged-file-url-adapter.js";

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    FileAdapterSignedDownloadUrlSettings,
    FileAdapterSignedUploadUrlSettings,
    FileAdapterMetadata,
    FileAdapterStream,
    FileWriteEnum,
    IFileStorageAdapter,
    IFileUrlAdapter,
    ISignedFileStorageAdapter,
    WritableFileAdapterContent,
    WritableFileAdapterStream,
} from "@/file-storage/contracts/_module.js";

/**
 * @internal
 */
export class SignedFileStorageAdapter implements ISignedFileStorageAdapter {
    private readonly fileUrlAdapter: IFileUrlAdapter;
    constructor(
        private readonly fileStorageAdapter: IFileStorageAdapter,
        fileUrlAdapter: Partial<IFileUrlAdapter>,
    ) {
        this.fileUrlAdapter = new MergedFileUrlAdapter(fileUrlAdapter);
    }

    async getPublicUrl(
        key: string,
        context: IReadableContext,
    ): Promise<string | null> {
        return await this.fileUrlAdapter.getPublicUrl(key, context);
    }

    async getSignedDownloadUrl(
        key: string,
        settings: FileAdapterSignedDownloadUrlSettings,
        context: IReadableContext,
    ): Promise<string | null> {
        return await this.fileUrlAdapter.getSignedDownloadUrl(
            key,
            settings,
            context,
        );
    }

    async getSignedUploadUrl(
        key: string,
        settings: FileAdapterSignedUploadUrlSettings,
        context: IReadableContext,
    ): Promise<string> {
        return await this.fileUrlAdapter.getSignedUploadUrl(
            key,
            settings,
            context,
        );
    }

    async exists(key: string, context: IReadableContext): Promise<boolean> {
        return await this.fileStorageAdapter.exists(key, context);
    }

    async getStream(
        key: string,
        context: IReadableContext,
    ): Promise<FileAdapterStream | null> {
        return await this.fileStorageAdapter.getStream(key, context);
    }

    async getBytes(
        key: string,
        context: IReadableContext,
    ): Promise<Uint8Array | null> {
        return await this.fileStorageAdapter.getBytes(key, context);
    }

    async getMetaData(
        key: string,
        context: IReadableContext,
    ): Promise<FileAdapterMetadata | null> {
        return await this.fileStorageAdapter.getMetaData(key, context);
    }

    async add(
        key: string,
        content: WritableFileAdapterContent,
        context: IReadableContext,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.add(key, content, context);
    }

    async addStream(
        key: string,
        stream: WritableFileAdapterStream,
        context: IReadableContext,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.addStream(key, stream, context);
    }

    async update(
        key: string,
        content: WritableFileAdapterContent,
        context: IReadableContext,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.update(key, content, context);
    }

    async updateStream(
        key: string,
        stream: WritableFileAdapterStream,
        context: IReadableContext,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.updateStream(key, stream, context);
    }

    async put(
        key: string,
        content: WritableFileAdapterContent,
        context: IReadableContext,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.put(key, content, context);
    }

    async putStream(
        key: string,
        stream: WritableFileAdapterStream,
        context: IReadableContext,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.putStream(key, stream, context);
    }

    async copy(
        source: string,
        destination: string,
        context: IReadableContext,
    ): Promise<FileWriteEnum> {
        return await this.fileStorageAdapter.copy(source, destination, context);
    }

    async copyAndReplace(
        source: string,
        destination: string,
        context: IReadableContext,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.copyAndReplace(
            source,
            destination,
            context,
        );
    }

    async move(
        source: string,
        destination: string,
        context: IReadableContext,
    ): Promise<FileWriteEnum> {
        return await this.fileStorageAdapter.move(source, destination, context);
    }

    async moveAndReplace(
        source: string,
        destination: string,
        context: IReadableContext,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.moveAndReplace(
            source,
            destination,
            context,
        );
    }

    async removeMany(
        keys: Array<string>,
        context: IReadableContext,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.removeMany(keys, context);
    }

    async removeByPrefix(
        prefix: string,
        context: IReadableContext,
    ): Promise<void> {
        await this.fileStorageAdapter.removeByPrefix(prefix, context);
    }
}
