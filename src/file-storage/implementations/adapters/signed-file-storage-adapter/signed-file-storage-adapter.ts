/**
 * @module FileStorage
 */

import { MergedFileUrlAdapter } from "@/file-storage/implementations/adapters/signed-file-storage-adapter/merged-file-url-adapter.js";

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
 * IMPORT_PATH: `"eridu-tech/file-storage/signed-file-storage-adapter"`
 * @group Adapters
 */
export type SignedFileStorageAdapterSettings = {
    adapter: IFileStorageAdapter;
    urlAdapter: Partial<IFileUrlAdapter>;
};

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/signed-file-storage-adapter"`
 * @group Adapters
 */
export class SignedFileStorageAdapter implements ISignedFileStorageAdapter {
    private readonly urlAdapter: IFileUrlAdapter;
    private readonly adapter: IFileStorageAdapter;

    constructor(settings: SignedFileStorageAdapterSettings) {
        const { adapter, urlAdapter: urlAdapter } = settings;
        this.adapter = adapter;
        this.urlAdapter = new MergedFileUrlAdapter(urlAdapter);
    }

    async getPublicUrl(key: string): Promise<string | null> {
        return await this.urlAdapter.getPublicUrl(key);
    }

    async getSignedDownloadUrl(
        key: string,
        settings: FileAdapterSignedDownloadUrlSettings,
    ): Promise<string | null> {
        return await this.urlAdapter.getSignedDownloadUrl(key, settings);
    }

    async getSignedUploadUrl(
        key: string,
        settings: FileAdapterSignedUploadUrlSettings,
    ): Promise<string> {
        return await this.urlAdapter.getSignedUploadUrl(key, settings);
    }

    async exists(key: string): Promise<boolean> {
        return await this.adapter.exists(key);
    }

    async getStream(key: string): Promise<FileAdapterStream | null> {
        return await this.adapter.getStream(key);
    }

    async getBytes(key: string): Promise<Uint8Array | null> {
        return await this.adapter.getBytes(key);
    }

    async getMetaData(key: string): Promise<FileAdapterMetadata | null> {
        return await this.adapter.getMetaData(key);
    }

    async add(
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        return await this.adapter.add(key, content);
    }

    async addStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        return await this.adapter.addStream(key, stream);
    }

    async update(
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        return await this.adapter.update(key, content);
    }

    async updateStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        return await this.adapter.updateStream(key, stream);
    }

    async put(
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        return await this.adapter.put(key, content);
    }

    async putStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        return await this.adapter.putStream(key, stream);
    }

    async copy(source: string, destination: string): Promise<FileWriteEnum> {
        return await this.adapter.copy(source, destination);
    }

    async copyAndReplace(
        source: string,
        destination: string,
    ): Promise<boolean> {
        return await this.adapter.copyAndReplace(source, destination);
    }

    async move(source: string, destination: string): Promise<FileWriteEnum> {
        return await this.adapter.move(source, destination);
    }

    async moveAndReplace(
        source: string,
        destination: string,
    ): Promise<boolean> {
        return await this.adapter.moveAndReplace(source, destination);
    }

    async removeMany(keys: Array<string>): Promise<boolean> {
        return await this.adapter.removeMany(keys);
    }

    async removeByPrefix(prefix: string): Promise<void> {
        await this.adapter.removeByPrefix(prefix);
    }
}
