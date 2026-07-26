/**
 * @module FileStorage
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    FILE_WRITE_ENUM,
    type ISignedFileStorageAdapter,
    type FileAdapterMetadata,
    type FileAdapterStream,
    type FileWriteEnum,
    type WritableFileAdapterContent,
    type WritableFileAdapterStream,
    type FileAdapterSignedDownloadUrlSettings,
    type FileAdapterSignedUploadUrlSettings,
} from "@/file-storage/contracts/_module.js";

/**
 * The `NoOpFileStorageAdapter` will do nothing and is used for easily mocking {@link ISignedFileStorageAdapter | `ISignedFileStorageAdapter`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/no-op-file-storage-adapter"`
 * @group Adapters
 */
export class NoOpFileStorageAdapter implements ISignedFileStorageAdapter {
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

    exists(_key: string, _context: IReadableContext): Promise<boolean> {
        return Promise.resolve(false);
    }

    getStream(
        _key: string,
        _context: IReadableContext,
    ): Promise<FileAdapterStream | null> {
        return Promise.resolve(null);
    }

    getBytes(
        _key: string,
        _context: IReadableContext,
    ): Promise<Uint8Array | null> {
        return Promise.resolve(null);
    }

    getMetaData(
        _key: string,
        _context: IReadableContext,
    ): Promise<FileAdapterMetadata | null> {
        return Promise.resolve(null);
    }

    add(
        _key: string,
        _content: WritableFileAdapterContent,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    addStream(
        _key: string,
        _stream: WritableFileAdapterStream,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    update(
        _key: string,
        _content: WritableFileAdapterContent,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    updateStream(
        _key: string,
        _stream: WritableFileAdapterStream,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    put(
        _key: string,
        _content: WritableFileAdapterContent,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    putStream(
        _key: string,
        _stream: WritableFileAdapterStream,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    copy(
        _source: string,
        _destination: string,
        _context: IReadableContext,
    ): Promise<FileWriteEnum> {
        return Promise.resolve(FILE_WRITE_ENUM.SUCCESS);
    }

    copyAndReplace(
        _source: string,
        _destination: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    move(
        _source: string,
        _destination: string,
        _context: IReadableContext,
    ): Promise<FileWriteEnum> {
        return Promise.resolve(FILE_WRITE_ENUM.SUCCESS);
    }

    moveAndReplace(
        _source: string,
        _destination: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    removeMany(
        _keys: Array<string>,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    removeByPrefix(_prefix: string, _context: IReadableContext): Promise<void> {
        return Promise.resolve();
    }
}
