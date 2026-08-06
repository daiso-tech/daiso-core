import { describe, expect, test } from "vitest";

import { isSignedFileStorageAdapter } from "@/file-storage/implementations/derivables/file-storage/is-signed-file-storage-adapter.js";

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    FileAdapterSignedDownloadUrlSettings,
    FileAdapterMetadata,
    FileAdapterStream,
    FileAdapterSignedUploadUrlSettings,
    FileWriteEnum,
    IFileStorageAdapter,
    ISignedFileStorageAdapter,
    WritableFileAdapterContent,
    WritableFileAdapterStream,
} from "@/file-storage/contracts/_module.js";

describe("function: isSignedFileStorageAdapter", () => {
    test("Should return true when given ISignedFileStorageAdapter", () => {
        const adapter: ISignedFileStorageAdapter = {
            getPublicUrl(
                _key: string,
                _context: IReadableContext,
            ): Promise<string | null> {
                throw new Error("Function not implemented.");
            },
            getSignedDownloadUrl(
                _key: string,
                _settings: FileAdapterSignedDownloadUrlSettings,
                _context: IReadableContext,
            ): Promise<string | null> {
                throw new Error("Function not implemented.");
            },

            getSignedUploadUrl(
                _key: string,
                _settings: FileAdapterSignedUploadUrlSettings,
                _context: IReadableContext,
            ): Promise<string> {
                throw new Error("Function not implemented.");
            },
            exists(_key: string, _context: IReadableContext): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            getStream(
                _key: string,
                _context: IReadableContext,
            ): Promise<FileAdapterStream | null> {
                throw new Error("Function not implemented.");
            },
            getBytes(
                _key: string,
                _context: IReadableContext,
            ): Promise<Uint8Array | null> {
                throw new Error("Function not implemented.");
            },
            getMetaData(
                _key: string,
                _context: IReadableContext,
            ): Promise<FileAdapterMetadata | null> {
                throw new Error("Function not implemented.");
            },
            add(
                _key: string,
                _content: WritableFileAdapterContent,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            addStream(
                _key: string,
                _stream: WritableFileAdapterStream,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            update(
                _key: string,
                _content: WritableFileAdapterContent,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            updateStream(
                _key: string,
                _stream: WritableFileAdapterStream,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            put(
                _key: string,
                _content: WritableFileAdapterContent,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            putStream(
                _key: string,
                _stream: WritableFileAdapterStream,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            copy(
                _source: string,
                _destination: string,
                _context: IReadableContext,
            ): Promise<FileWriteEnum> {
                throw new Error("Function not implemented.");
            },
            copyAndReplace(
                _source: string,
                _destination: string,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            move(
                _source: string,
                _destination: string,
                _context: IReadableContext,
            ): Promise<FileWriteEnum> {
                throw new Error("Function not implemented.");
            },
            moveAndReplace(
                _source: string,
                _destination: string,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            removeMany(
                _keys: Array<string>,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            removeByPrefix(
                _prefix: string,
                _context: IReadableContext,
            ): Promise<void> {
                throw new Error("Function not implemented.");
            },
        };
        const result = isSignedFileStorageAdapter(adapter);
        expect(result).toBe(true);
    });
    test("Should return true when given IFileStorageAdapter", () => {
        const adapter: IFileStorageAdapter = {
            exists(_key: string, _context: IReadableContext): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            getStream(
                _key: string,
                _context: IReadableContext,
            ): Promise<FileAdapterStream | null> {
                throw new Error("Function not implemented.");
            },
            getBytes(
                _key: string,
                _context: IReadableContext,
            ): Promise<Uint8Array | null> {
                throw new Error("Function not implemented.");
            },
            getMetaData(
                _key: string,
                _context: IReadableContext,
            ): Promise<FileAdapterMetadata | null> {
                throw new Error("Function not implemented.");
            },
            add(
                _key: string,
                _content: WritableFileAdapterContent,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            addStream(
                _key: string,
                _stream: WritableFileAdapterStream,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            update(
                _key: string,
                _content: WritableFileAdapterContent,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            updateStream(
                _key: string,
                _stream: WritableFileAdapterStream,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            put(
                _key: string,
                _content: WritableFileAdapterContent,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            putStream(
                _key: string,
                _stream: WritableFileAdapterStream,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            copy(
                _source: string,
                _destination: string,
                _context: IReadableContext,
            ): Promise<FileWriteEnum> {
                throw new Error("Function not implemented.");
            },
            copyAndReplace(
                _source: string,
                _destination: string,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            move(
                _source: string,
                _destination: string,
                _context: IReadableContext,
            ): Promise<FileWriteEnum> {
                throw new Error("Function not implemented.");
            },
            moveAndReplace(
                _source: string,
                _destination: string,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            removeMany(
                _keys: Array<string>,
                _context: IReadableContext,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            removeByPrefix(
                _prefix: string,
                _context: IReadableContext,
            ): Promise<void> {
                throw new Error("Function not implemented.");
            },
        };
        const result = isSignedFileStorageAdapter(adapter);
        expect(result).toBe(false);
    });
});
