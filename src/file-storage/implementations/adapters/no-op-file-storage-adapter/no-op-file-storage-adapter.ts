/**
 * @module FileStorage
 */

import {
    FILE_WRITE_ENUM,
    type ISignedFileStorageAdapter,
    type FileAdapterMetadata,
    type FileAdapterStream,
    type FileWriteEnum,
    type WritableFileAdapterContent,
    type WritableFileAdapterStream,
    type FildeAdapterSignedUrlSettings,
} from "@/file-storage/contracts/_module.js";

/**
 * This `NoOpFileStorageAdapter` will do nothing and is used for easily mocking {@link ISignedFileStorageAdapter | `ISignedFileStorageAdapter`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/no-op-file-storage-adapter"`
 * @group Adapters
 */
export class NoOpFileStorageAdapter implements ISignedFileStorageAdapter {
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

    exists(_key: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    getStream(_key: string): Promise<FileAdapterStream | null> {
        return Promise.resolve(null);
    }

    getBytes(_key: string): Promise<Uint8Array | null> {
        return Promise.resolve(null);
    }

    getMetaData(_key: string): Promise<FileAdapterMetadata | null> {
        return Promise.resolve(null);
    }

    add(_key: string, _content: WritableFileAdapterContent): Promise<boolean> {
        return Promise.resolve(true);
    }

    addStream(
        _key: string,
        _stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    update(
        _key: string,
        _content: WritableFileAdapterContent,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    updateStream(
        _key: string,
        _stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    put(_key: string, _content: WritableFileAdapterContent): Promise<boolean> {
        return Promise.resolve(true);
    }

    putStream(
        _key: string,
        _stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    copy(_source: string, _destination: string): Promise<FileWriteEnum> {
        return Promise.resolve(FILE_WRITE_ENUM.SUCCESS);
    }

    copyAndReplace(_source: string, _destination: string): Promise<boolean> {
        return Promise.resolve(true);
    }

    move(_source: string, _destination: string): Promise<FileWriteEnum> {
        return Promise.resolve(FILE_WRITE_ENUM.SUCCESS);
    }

    moveAndReplace(_source: string, _destination: string): Promise<boolean> {
        return Promise.resolve(true);
    }

    removeMany(_keys: Array<string>): Promise<boolean> {
        return Promise.resolve(true);
    }

    removeByPrefix(_prefix: string): Promise<void> {
        return Promise.resolve();
    }
}
