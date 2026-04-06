/**
 * @module FileStorage
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type FileAdapterSignedDownloadUrlSettings,
    type FileAdapterSignedUploadUrlSettings,
    type FileAdapterMetadata,
    type FileAdapterStream,
    type FileWriteEnum,
    type IFileStorageAdapter,
    type IFileUrlAdapter,
    type ISignedFileStorageAdapter,
    type WritableFileAdapterContent,
    type WritableFileAdapterStream,
} from "@/file-storage/contracts/_module.js";
import { MergedFileUrlAdapter } from "@/file-storage/implementations/derivables/file-storage/merged-file-url-adapter.js";

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
        context: IReadableContext,
        key: string,
    ): Promise<string | null> {
        return await this.fileUrlAdapter.getPublicUrl(context, key);
    }

    async getSignedDownloadUrl(
        context: IReadableContext,
        key: string,
        settings: FileAdapterSignedDownloadUrlSettings,
    ): Promise<string | null> {
        return await this.fileUrlAdapter.getSignedDownloadUrl(
            context,
            key,
            settings,
        );
    }

    async getSignedUploadUrl(
        context: IReadableContext,
        key: string,
        settings: FileAdapterSignedUploadUrlSettings,
    ): Promise<string> {
        return await this.fileUrlAdapter.getSignedUploadUrl(
            context,
            key,
            settings,
        );
    }

    async exists(context: IReadableContext, key: string): Promise<boolean> {
        return await this.fileStorageAdapter.exists(context, key);
    }

    async getStream(
        context: IReadableContext,
        key: string,
    ): Promise<FileAdapterStream | null> {
        return await this.fileStorageAdapter.getStream(context, key);
    }

    async getBytes(
        context: IReadableContext,
        key: string,
    ): Promise<Uint8Array | null> {
        return await this.fileStorageAdapter.getBytes(context, key);
    }

    async getMetaData(
        context: IReadableContext,
        key: string,
    ): Promise<FileAdapterMetadata | null> {
        return await this.fileStorageAdapter.getMetaData(context, key);
    }

    async add(
        context: IReadableContext,
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.add(context, key, content);
    }

    async addStream(
        context: IReadableContext,
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.addStream(context, key, stream);
    }

    async update(
        context: IReadableContext,
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.update(context, key, content);
    }

    async updateStream(
        context: IReadableContext,
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.updateStream(context, key, stream);
    }

    async put(
        context: IReadableContext,
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.put(context, key, content);
    }

    async putStream(
        context: IReadableContext,
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.putStream(context, key, stream);
    }

    async copy(
        context: IReadableContext,
        source: string,
        destination: string,
    ): Promise<FileWriteEnum> {
        return await this.fileStorageAdapter.copy(context, source, destination);
    }

    async copyAndReplace(
        context: IReadableContext,
        source: string,
        destination: string,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.copyAndReplace(
            context,
            source,
            destination,
        );
    }

    async move(
        context: IReadableContext,
        source: string,
        destination: string,
    ): Promise<FileWriteEnum> {
        return await this.fileStorageAdapter.move(context, source, destination);
    }

    async moveAndReplace(
        context: IReadableContext,
        source: string,
        destination: string,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.moveAndReplace(
            context,
            source,
            destination,
        );
    }

    async removeMany(
        context: IReadableContext,
        keys: Array<string>,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.removeMany(context, keys);
    }

    async removeByPrefix(
        context: IReadableContext,
        prefix: string,
    ): Promise<void> {
        await this.fileStorageAdapter.removeByPrefix(context, prefix);
    }
}
