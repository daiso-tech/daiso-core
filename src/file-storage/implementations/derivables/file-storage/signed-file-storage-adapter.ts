/**
 * @module FileStorage
 */

import {
    type FildeAdapterSignedUrlSettings,
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

    async getPublicUrl(key: string): Promise<string | null> {
        return await this.fileUrlAdapter.getPublicUrl(key);
    }

    async getSignedDownloadUrl(
        key: string,
        settings: FildeAdapterSignedUrlSettings,
    ): Promise<string | null> {
        return await this.fileUrlAdapter.getSignedDownloadUrl(key, settings);
    }

    async getSignedUploadUrl(
        key: string,
        settings: FildeAdapterSignedUrlSettings,
    ): Promise<string> {
        return await this.fileUrlAdapter.getSignedUploadUrl(key, settings);
    }

    async exists(key: string): Promise<boolean> {
        return await this.fileStorageAdapter.exists(key);
    }

    async getStream(key: string): Promise<FileAdapterStream | null> {
        return await this.fileStorageAdapter.getStream(key);
    }

    async getBytes(key: string): Promise<Uint8Array | null> {
        return await this.fileStorageAdapter.getBytes(key);
    }

    async getMetaData(key: string): Promise<FileAdapterMetadata | null> {
        return await this.fileStorageAdapter.getMetaData(key);
    }

    async add(
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.add(key, content);
    }

    async addStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.addStream(key, stream);
    }

    async update(
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.update(key, content);
    }

    async updateStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.updateStream(key, stream);
    }

    async put(
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.put(key, content);
    }

    async putStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.putStream(key, stream);
    }

    async copy(source: string, destination: string): Promise<FileWriteEnum> {
        return await this.fileStorageAdapter.copy(source, destination);
    }

    async copyAndReplace(
        source: string,
        destination: string,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.copyAndReplace(
            source,
            destination,
        );
    }

    async move(source: string, destination: string): Promise<FileWriteEnum> {
        return await this.fileStorageAdapter.move(source, destination);
    }

    async moveAndReplace(
        source: string,
        destination: string,
    ): Promise<boolean> {
        return await this.fileStorageAdapter.moveAndReplace(
            source,
            destination,
        );
    }

    async removeMany(keys: Array<string>): Promise<boolean> {
        return await this.fileStorageAdapter.removeMany(keys);
    }

    async removeByPrefix(prefix: string): Promise<void> {
        await this.fileStorageAdapter.removeByPrefix(prefix);
    }
}
