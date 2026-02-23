import { describe, expect, test } from "vitest";

import {
    type FildeAdapterSignedUrlSettings,
    type FileAdapterMetadata,
    type FileAdapterStream,
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
            getPublicUrl(_key: string): Promise<string | null> {
                throw new Error("Function not implemented.");
            },

            getSignedDownloadUrl(
                _key: string,
                _settings: FildeAdapterSignedUrlSettings,
            ): Promise<string | null> {
                throw new Error("Function not implemented.");
            },

            getSignedUploadUrl(
                _key: string,
                _settings: FildeAdapterSignedUrlSettings,
            ): Promise<string> {
                throw new Error("Function not implemented.");
            },

            exists: function (_key: string): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            getStream: function (
                _key: string,
            ): Promise<FileAdapterStream | null> {
                throw new Error("Function not implemented.");
            },
            getBytes: function (_key: string): Promise<Uint8Array | null> {
                throw new Error("Function not implemented.");
            },
            getMetaData: function (
                _key: string,
            ): Promise<FileAdapterMetadata | null> {
                throw new Error("Function not implemented.");
            },
            add: function (
                _key: string,
                _content: WritableFileAdapterContent,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            addStream: function (
                _key: string,
                _stream: WritableFileAdapterStream,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            update: function (
                _key: string,
                _content: WritableFileAdapterContent,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            updateStream: function (
                _key: string,
                _stream: WritableFileAdapterStream,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            put: function (
                _key: string,
                _content: WritableFileAdapterContent,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            putStream: function (
                _key: string,
                _stream: WritableFileAdapterStream,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            copy: function (
                _source: string,
                _destination: string,
            ): Promise<FileWriteEnum> {
                throw new Error("Function not implemented.");
            },
            copyAndReplace: function (
                _source: string,
                _destination: string,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            move: function (
                _source: string,
                _destination: string,
            ): Promise<FileWriteEnum> {
                throw new Error("Function not implemented.");
            },
            moveAndReplace: function (
                _source: string,
                _destination: string,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            removeMany: function (_keys: Array<string>): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            removeByPrefix: function (_prefix: string): Promise<void> {
                throw new Error("Function not implemented.");
            },
        };
        const result = isSignedFileStorageAdapter(adapter);
        expect(result).toBe(true);
    });
    test("Should return true when given IFileStorageAdapter", () => {
        const adapter: IFileStorageAdapter = {
            exists: function (_key: string): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            getStream: function (
                _key: string,
            ): Promise<FileAdapterStream | null> {
                throw new Error("Function not implemented.");
            },
            getBytes: function (_key: string): Promise<Uint8Array | null> {
                throw new Error("Function not implemented.");
            },
            getMetaData: function (
                _key: string,
            ): Promise<FileAdapterMetadata | null> {
                throw new Error("Function not implemented.");
            },
            add: function (
                _key: string,
                _content: WritableFileAdapterContent,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            addStream: function (
                _key: string,
                _stream: WritableFileAdapterStream,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            update: function (
                _key: string,
                _content: WritableFileAdapterContent,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            updateStream: function (
                _key: string,
                _stream: WritableFileAdapterStream,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            put: function (
                _key: string,
                _content: WritableFileAdapterContent,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            putStream: function (
                _key: string,
                _stream: WritableFileAdapterStream,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            copy: function (
                _source: string,
                _destination: string,
            ): Promise<FileWriteEnum> {
                throw new Error("Function not implemented.");
            },
            copyAndReplace: function (
                _source: string,
                _destination: string,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            move: function (
                _source: string,
                _destination: string,
            ): Promise<FileWriteEnum> {
                throw new Error("Function not implemented.");
            },
            moveAndReplace: function (
                _source: string,
                _destination: string,
            ): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            removeMany: function (_keys: Array<string>): Promise<boolean> {
                throw new Error("Function not implemented.");
            },
            removeByPrefix: function (_prefix: string): Promise<void> {
                throw new Error("Function not implemented.");
            },
        };
        const result = isSignedFileStorageAdapter(adapter);
        expect(result).toBe(false);
    });
});
