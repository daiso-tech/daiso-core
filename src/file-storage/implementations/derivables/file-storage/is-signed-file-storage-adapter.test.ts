import { describe, expect, test } from "vitest";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type FileAdapterSignedDownloadUrlSettings,
    type FileAdapterMetadata,
    type FileAdapterStream,
    type FileAdapterSignedUploadUrlSettings,
    type FileWriteEnum,
    type IFileStorageAdapter,
    type ISignedFileStorageAdapter,
    type WritableFileAdapterContent,
    type WritableFileAdapterStream,
} from "@/file-storage/contracts/_module.js";
import { isSignedFileStorageAdapter } from "@/file-storage/implementations/derivables/file-storage/is-signed-file-storage-adapter.js";

describe("function: isSignedFileStorageAdapter", () => {
    test("Should return true when given ISignedFileStorageAdapter", () => {
        const adapter: ISignedFileStorageAdapter = {
            getPublicUrl(
                _context: IReadableContext,
                _key: string,
            ): Promise<string | null> {
                throw new Error("Function not implemented.");
            },
            getSignedDownloadUrl(
                _context: IReadableContext,
                _key: string,
                _settings: FileAdapterSignedDownloadUrlSettings,
            ): Promise<string | null> {
                throw new Error("Function not implemented.");
            },

            getSignedUploadUrl(
                _context: IReadableContext,
                _key: string,
                _settings: FileAdapterSignedUploadUrlSettings,
            ): Promise<string> {
                throw new Error("Function not implemented.");
            },
            exists(_context: IReadableContext, _key: string): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            getStream(
                _context: IReadableContext,
                _key: string,
            ): Promise<FileAdapterStream | null> {
                throw new Error("Function not implemented.");
            },
            getBytes(
                _context: IReadableContext,
                _key: string,
            ): Promise<Uint8Array | null> {
                throw new Error("Function not implemented.");
            },
            getMetaData(
                _context: IReadableContext,
                _key: string,
            ): Promise<FileAdapterMetadata | null> {
                throw new Error("Function not implemented.");
            },
            add(
                _context: IReadableContext,
                _key: string,
                _content: WritableFileAdapterContent,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            addStream(
                _context: IReadableContext,
                _key: string,
                _stream: WritableFileAdapterStream,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            update(
                _context: IReadableContext,
                _key: string,
                _content: WritableFileAdapterContent,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            updateStream(
                _context: IReadableContext,
                _key: string,
                _stream: WritableFileAdapterStream,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            put(
                _context: IReadableContext,
                _key: string,
                _content: WritableFileAdapterContent,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            putStream(
                _context: IReadableContext,
                _key: string,
                _stream: WritableFileAdapterStream,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            copy(
                _context: IReadableContext,
                _source: string,
                _destination: string,
            ): Promise<FileWriteEnum> {
                throw new Error("Function not implemented.");
            },
            copyAndReplace(
                _context: IReadableContext,
                _source: string,
                _destination: string,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            move(
                _context: IReadableContext,
                _source: string,
                _destination: string,
            ): Promise<FileWriteEnum> {
                throw new Error("Function not implemented.");
            },
            moveAndReplace(
                _context: IReadableContext,
                _source: string,
                _destination: string,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            removeMany(
                _context: IReadableContext,
                _keys: Array<string>,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            removeByPrefix(
                _context: IReadableContext,
                _prefix: string,
            ): Promise<void> {
                throw new Error("Function not implemented.");
            },
        };
        const result = isSignedFileStorageAdapter(adapter);
        expect(result).toBe(true);
    });
    test("Should return true when given IFileStorageAdapter", () => {
        const adapter: IFileStorageAdapter = {
            exists(_context: IReadableContext, _key: string): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            getStream(
                _context: IReadableContext,
                _key: string,
            ): Promise<FileAdapterStream | null> {
                throw new Error("Function not implemented.");
            },
            getBytes(
                _context: IReadableContext,
                _key: string,
            ): Promise<Uint8Array | null> {
                throw new Error("Function not implemented.");
            },
            getMetaData(
                _context: IReadableContext,
                _key: string,
            ): Promise<FileAdapterMetadata | null> {
                throw new Error("Function not implemented.");
            },
            add(
                _context: IReadableContext,
                _key: string,
                _content: WritableFileAdapterContent,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            addStream(
                _context: IReadableContext,
                _key: string,
                _stream: WritableFileAdapterStream,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            update(
                _context: IReadableContext,
                _key: string,
                _content: WritableFileAdapterContent,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            updateStream(
                _context: IReadableContext,
                _key: string,
                _stream: WritableFileAdapterStream,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            put(
                _context: IReadableContext,
                _key: string,
                _content: WritableFileAdapterContent,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            putStream(
                _context: IReadableContext,
                _key: string,
                _stream: WritableFileAdapterStream,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            copy(
                _context: IReadableContext,
                _source: string,
                _destination: string,
            ): Promise<FileWriteEnum> {
                throw new Error("Function not implemented.");
            },
            copyAndReplace(
                _context: IReadableContext,
                _source: string,
                _destination: string,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            move(
                _context: IReadableContext,
                _source: string,
                _destination: string,
            ): Promise<FileWriteEnum> {
                throw new Error("Function not implemented.");
            },
            moveAndReplace(
                _context: IReadableContext,
                _source: string,
                _destination: string,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            removeMany(
                _context: IReadableContext,
                _keys: Array<string>,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            removeByPrefix(
                _context: IReadableContext,
                _prefix: string,
            ): Promise<void> {
                throw new Error("Function not implemented.");
            },
        };
        const result = isSignedFileStorageAdapter(adapter);
        expect(result).toBe(false);
    });
});
