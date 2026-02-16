/**
 * @module FileStorage
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type FildeAdapterSignedUrlSettings = {
    expirationInSeconds: number;
    contentType: string | null;
    contentDisposition: string | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IFileUrlAdapter = {
    getPublicUrl(key: string): Promise<string | null>;

    getSignedDownloadUrl(
        key: string,
        settings: FildeAdapterSignedUrlSettings,
    ): Promise<string | null>;

    getSignedUploadUrl(
        key: string,
        settings: FildeAdapterSignedUrlSettings,
    ): Promise<string>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type FileAdapterMetadata = {
    etag: string;
    contentType: string;
    fileSizeInBytes: number;
    createdAt: Date;
    updatedAt: Date | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type FileAdapterStream = AsyncIterable<Uint8Array>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type WritableFileAdapterCommonSettings = {
    contentType: string;
    contentLanguage: string | null;
    contentEncoding: string | null;
    contentDisposition: string | null;
    cacheControl: string | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type WritableFileAdapterContent = WritableFileAdapterCommonSettings & {
    data: Uint8Array;
    fileSizeInBytes: number;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type WritableFileAdapterStream = WritableFileAdapterCommonSettings & {
    data: FileAdapterStream;
    fileSizeInBytes: number | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export const FILE_WRITE_ENUM = {
    SUCCESS: "SUCCESS",
    NOT_FOUND: "NOT_FOUND",
    KEY_EXISTS: "KEY_EXISTS",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type FileWriteEnum =
    (typeof FILE_WRITE_ENUM)[keyof typeof FILE_WRITE_ENUM];

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IFileStorageAdapter = {
    exists(key: string): Promise<boolean>;

    getStream(key: string): Promise<FileAdapterStream | null>;

    getBytes(key: string): Promise<Uint8Array | null>;

    getMetaData(key: string): Promise<FileAdapterMetadata | null>;

    add(key: string, content: WritableFileAdapterContent): Promise<boolean>;

    addStream(key: string, stream: WritableFileAdapterStream): Promise<boolean>;

    update(key: string, content: WritableFileAdapterContent): Promise<boolean>;

    updateStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean>;

    put(key: string, content: WritableFileAdapterContent): Promise<boolean>;

    putStream(key: string, stream: WritableFileAdapterStream): Promise<boolean>;

    copy(source: string, destination: string): Promise<FileWriteEnum>;

    copyAndReplace(source: string, destination: string): Promise<boolean>;

    move(source: string, destination: string): Promise<FileWriteEnum>;

    moveAndReplace(source: string, destination: string): Promise<boolean>;

    removeMany(keys: Array<string>): Promise<boolean>;

    removeByPrefix(prefix: string): Promise<void>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type ISignedFileStorageAdapter = IFileUrlAdapter & IFileStorageAdapter;
