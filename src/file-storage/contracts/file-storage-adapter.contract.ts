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
 * The `IFileUrlAdapter` contract defines a way for creating temporary signed url for uploading and downloading files. It also allows for creating public url for files.
 *
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
 * The `IFileStorageAdapter` contract defines a way for storing files independent of storage.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IFileStorageAdapter = {
    exists(key: string): Promise<boolean>;

    /**
     * The `getStream` method returns the file as stream when `key` is found otherwise null will be returned.
     */
    getStream(key: string): Promise<FileAdapterStream | null>;

    /**
     * The `getBytes` method returns the file as bytes when `key` is found otherwise null will be returned.
     */
    getBytes(key: string): Promise<Uint8Array | null>;

    /**
     * The `getMetaData` method returns the file metadata when `key` is found otherwise null will be returned.
     */
    getMetaData(key: string): Promise<FileAdapterMetadata | null>;

    /**
     * The `add` method adds the file as bytes when `key` doesn't exists. Returns `true` when key doesn't exists otherwise `false` will be returned.
     */
    add(key: string, content: WritableFileAdapterContent): Promise<boolean>;

    /**
     * The `addStream` method adds the file as streaming when `key` doesn't exists. Returns `true` when key doesn't exists otherwise `false` will be returned.
     */
    addStream(key: string, stream: WritableFileAdapterStream): Promise<boolean>;

    /**
     * The `update` method updates the file by bytes. Returns `true` if the `key` where updated otherwise `false` will be returned.
     */
    update(key: string, content: WritableFileAdapterContent): Promise<boolean>;

    /**
     * The `updateStream` method updates the file by stream. Returns `true` if the `key` where updated otherwise `false` will be returned.
     */
    updateStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean>;

    /**
     * The `put` method replaces the given `key` with the given file bytes if the `key` exists othwerwise it will add the given file bytes.
     * Returns `true` if the `key` where replaced otherwise `false` is returned.
     */
    put(key: string, content: WritableFileAdapterContent): Promise<boolean>;

    /**
     * The `putStream` method replaces the given `key` with the given file stream if the `key` exists othwerwise it will add the given file stream.
     * Returns `true` if the `key` where replaced otherwise `false` is returned.
     */
    putStream(key: string, stream: WritableFileAdapterStream): Promise<boolean>;

    /**
     * The `copy` methods copies the `source` file to the given `destination` when it doesnt exists.
     *
     * Returns
     * - `FILE_WRITE_ENUM.SUCCESS` when file successfully copied.
     * - `FILE_WRITE_ENUM.NOT_FOUND` when `source` file is not found.
     * - `FILE_WRITE_ENUM.KEY_EXISTS` when `destination` file already exists.
     */
    copy(source: string, destination: string): Promise<FileWriteEnum>;

    /**
     * The `copyAndReplace` methods copies the `source` file to the given `destination`. The `destination` file will always be replaces.
     * Returns `true` if the `source` is found otherwise `false` is returned.
     */
    copyAndReplace(source: string, destination: string): Promise<boolean>;

    /**
     * The `move` methods moves the `source` file to the given `destination` when it doesnt exists.
     *
     * Returns
     * - `FILE_WRITE_ENUM.SUCCESS` when file successfully moved.
     * - `FILE_WRITE_ENUM.NOT_FOUND` when `source` file is not found.
     * - `FILE_WRITE_ENUM.KEY_EXISTS` when `destination` file already exists.
     */
    move(source: string, destination: string): Promise<FileWriteEnum>;

    /**
     * The `moveAndReplace` methods moves the `source` file to the given `destination`. The `destination` file will always be replaces.
     * Returns `true` if the `source` is found otherwise `false` is returned.
     */
    moveAndReplace(source: string, destination: string): Promise<boolean>;

    /**
     * The `removeMany` method removes many keys. Returns `true` if one of the keys where deleted otherwise `false` is returned.
     */
    removeMany(keys: Array<string>): Promise<boolean>;

    /**
     * The `removeByKeyPrefix` method removes all the keys in the file-storage that starts with the given `prefix`.
     */
    removeByPrefix(prefix: string): Promise<void>;
};

/**
 * The `ISignedFileStorageAdapter` contract defines a way for storing files independent of storage, creating temporary signed url for uploading and downloading files. It also allows for creating public url for files
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type ISignedFileStorageAdapter = IFileUrlAdapter & IFileStorageAdapter;
