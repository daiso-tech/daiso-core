/**
 * @module FileStorage
 */

import { Readable } from "node:stream";
import { buffer } from "node:stream/consumers";

import {
    CopyObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsCommand,
    PutObjectCommand,
    type S3Client,
    S3ServiceException,
    type ServerSideEncryption,
    CreateBucketCommand,
    DeleteBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    FILE_WRITE_ENUM,
    type FileAdapterSignedUploadUrlSettings,
    type FileAdapterSignedDownloadUrlSettings,
    type FileAdapterMetadata,
    type FileAdapterStream,
    type FileWriteEnum,
    type ISignedFileStorageAdapter,
    type WritableFileAdapterContent,
    type WritableFileAdapterStream,
} from "@/file-storage/contracts/_module.js";
import {
    callInvokable,
    UnexpectedError,
    type IDeinitizable,
    type IInitizable,
    type Invokable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/aws-file-storage-adapter"`
 * @group Adapters
 */
export type S3FilePublicUrlGenerator = Invokable<
    [settings: { key: string; bucket: string; client: S3Client }],
    Promise<string>
>;

/**
 * Configuration for `S3FileStorageAdapter`.
 * Provides AWS S3-backed file storage.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/aws-file-storage-adapter"`
 * @group Adapters
 */
export type S3FileStorageAdapterSettings = {
    /**
     * The AWS S3 client instance for communicating with the S3 API.
     */
    client: S3Client;

    /**
     * The bucket option defines the S3 bucket to use for managing files.
     */
    bucket: string;

    /**
     * The `cdnUrl` field can be used to define the base URL for generating public URL for a file. For example, If you use CloudFront alongside S3 to serve public files, the `cdnUrl` property should be the CloudFront URL.
     * @default null
     */
    cdnUrl?: string | null;

    /**
     * Define ServerSideEncryption option for all objects uploaded to S3. It can be disabled by passing null
     *
     * @default null
     */
    serverSideEncryption?: ServerSideEncryption | null;

    /**
     * If false the `put` method of {@link ISignedFileStorageAdapter | `ISignedFileStorageAdapter`} will perform one database call and thereby always return true even when the file doesnt exists.
     * Note the fewer S3 API calls the cheaper it will be when using AWS S3.
     * @default true
     */
    enableAccuratePut?: boolean;

    /**
     * If false the `getSignedDownloadUrl` method of {@link ISignedFileStorageAdapter | `ISignedFileStorageAdapter`} will perfom one database call and therby always return string even when the file doesnt exists.
     * Note the fewer S3 API calls the cheaper it will be when using AWS S3.
     * @default true
     */
    enableAccurateGetSignedDownloadUrl?: boolean;

    /**
     * If false the `getPublicUrl` method of {@link ISignedFileStorageAdapter | `ISignedFileStorageAdapter`} will perfom one database call and therby always return string even when the file doesnt exists.
     * Note the fewer S3 API calls the cheaper it will be when using AWS S3.
     * @default true
     */
    enableAccurateGetPublicUrl?: boolean;

    /**
     * When `false`, `removeMany` will skip verifying whether each key exists before deletion, reducing API calls at the cost of accuracy.
     * Note the fewer S3 API calls the cheaper it will be when using AWS S3.
     * @default true
     */
    enableAccurateRemoveMany?: boolean;

    /**
     * Define a custom public url generator for creating public and signed URLs.
     *
     * @default
     * ```ts
     * import { defaultPublicUrlGenerator } from "@daiso-tech/core/file-storage/s3-file-storage-adapter"
     * defaultPublicUrlGenerator
     * ```
     */
    publicUrlGenerator?: S3FilePublicUrlGenerator;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/aws-file-storage-adapter"`
 * @group Adapters
 */
export const defaultPublicUrlGenerator: S3FilePublicUrlGenerator = async ({
    key,
    bucket,
    client,
}) => {
    if (client.config.endpoint === undefined) {
        return new URL(
            `/${key}`,
            `https://${bucket}.s3.amazonaws.com`,
        ).toString();
    }

    const endpoint = await client.config.endpoint();
    let baseUrl = `${endpoint.protocol}//${endpoint.hostname}`;

    if (endpoint.port !== undefined) {
        baseUrl += `:${String(endpoint.port)}`;
    }

    return new URL(`/${bucket}/${key}`, baseUrl).toString();
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/aws-file-storage-adapter"`
 * @group Adapters
 */
export class S3FileStorageAdapter
    implements ISignedFileStorageAdapter, IDeinitizable, IInitizable
{
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly cdnUrl: string | null;
    private readonly serverSideEncryption: ServerSideEncryption | undefined;
    private readonly enableAccuratePut: boolean;
    private readonly enableAccurateGetSignedDownloadUrl: boolean;
    private readonly enableAccurateGetPublicUrl: boolean;
    private readonly enableAccurateRemoveMany: boolean;
    private readonly publicUrlGenerator: S3FilePublicUrlGenerator;

    /**
     * @example
     * ```ts
     * import { S3Client } from "@aws-sdk/client-s3"
     * import { S3FileStorageAdapter } from "@daiso-tech/core/file-storage/s3-file-storage-adapter";
     *
     * const s3FileStorageAdapter = new S3FileStorageAdapter({
     *   client: new S3Client({
     *     credentials: {
     *       accessKeyId: 'AWS_ACCESS_KEY_ID',
     *       secretAccessKey: 'AWS_SECRET_ACCESS_KEY',
     *     },
     *     region: "AWS_REGION",
     *   }),
     *   bucket: "files"
     * });
     * ```
     */
    constructor(settings: S3FileStorageAdapterSettings) {
        const {
            client,
            bucket,
            cdnUrl = null,
            serverSideEncryption = null,
            enableAccurateGetSignedDownloadUrl = true,
            enableAccuratePut = true,
            enableAccurateGetPublicUrl = true,
            enableAccurateRemoveMany = true,
            publicUrlGenerator = defaultPublicUrlGenerator,
        } = settings;

        this.client = client;
        this.bucket = bucket;
        this.cdnUrl = cdnUrl;
        this.serverSideEncryption = serverSideEncryption ?? undefined;
        this.enableAccurateGetSignedDownloadUrl =
            enableAccurateGetSignedDownloadUrl;
        this.enableAccuratePut = enableAccuratePut;
        this.enableAccurateGetPublicUrl = enableAccurateGetPublicUrl;
        this.enableAccurateRemoveMany = enableAccurateRemoveMany;
        this.publicUrlGenerator = publicUrlGenerator;
    }

    /**
     * Creates the bucket where the files will be saved.
     */
    async init(): Promise<void> {
        try {
            await this.client.send(
                new CreateBucketCommand({
                    Bucket: this.bucket,
                }),
            );
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Removes the bucket where the files are saved.
     */
    async deInit(): Promise<void> {
        try {
            await this.client.send(
                new DeleteBucketCommand({
                    Bucket: this.bucket,
                }),
            );
        } catch {
            /* EMPTY */
        }
    }

    private static throwUnlessS3StatusError(
        error: unknown,
        statusCode: number,
    ): void {
        if (!(error instanceof S3ServiceException)) {
            throw error;
        }
        if (error.$metadata.httpStatusCode !== statusCode) {
            throw error;
        }
    }

    async getPublicUrl(
        context: IReadableContext,
        key: string,
    ): Promise<string | null> {
        if (
            this.enableAccurateGetPublicUrl &&
            !(await this.exists(context, key))
        ) {
            return null;
        }
        if (this.cdnUrl !== null) {
            return new URL(key, this.cdnUrl).toString();
        }

        return await callInvokable(this.publicUrlGenerator, {
            key,
            bucket: this.bucket,
            client: this.client,
        });
    }

    async getSignedDownloadUrl(
        context: IReadableContext,
        key: string,
        settings: FileAdapterSignedDownloadUrlSettings,
    ): Promise<string | null> {
        if (
            this.enableAccurateGetSignedDownloadUrl &&
            !(await this.exists(context, key))
        ) {
            return null;
        }
        return await getSignedUrl(
            this.client,
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
                ResponseContentType: settings.contentType ?? undefined,
                ResponseContentDisposition:
                    settings.contentDisposition ?? undefined,
            }),
            {
                expiresIn: settings.expirationInSeconds,
            },
        );
    }

    async getSignedUploadUrl(
        _context: IReadableContext,
        key: string,
        settings: FileAdapterSignedUploadUrlSettings,
    ): Promise<string> {
        return await getSignedUrl(
            this.client,
            new PutObjectCommand({
                ServerSideEncryption: this.serverSideEncryption,
                Bucket: this.bucket,
                Key: key,
                ContentType: settings.contentType ?? undefined,
            }),
            {
                expiresIn: settings.expirationInSeconds,
            },
        );
    }

    async exists(_context: IReadableContext, key: string): Promise<boolean> {
        try {
            const response = await this.client.send(
                new HeadObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );
            return response.$metadata.httpStatusCode === 200;
        } catch (error: unknown) {
            S3FileStorageAdapter.throwUnlessS3StatusError(error, 404);
            return false;
        }
    }

    async getStream(
        _context: IReadableContext,
        key: string,
    ): Promise<FileAdapterStream | null> {
        try {
            const response = await this.client.send(
                new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );
            if (response.Body === undefined) {
                throw new UnexpectedError("response.Body is undefined");
            }
            return response.Body.transformToWebStream();
        } catch (error: unknown) {
            S3FileStorageAdapter.throwUnlessS3StatusError(error, 404);
            return null;
        }
    }

    async getBytes(
        _context: IReadableContext,
        key: string,
    ): Promise<Uint8Array | null> {
        try {
            const response = await this.client.send(
                new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );
            if (response.Body === undefined) {
                throw new UnexpectedError("response.Body is undefined");
            }
            return await response.Body.transformToByteArray();
        } catch (error: unknown) {
            S3FileStorageAdapter.throwUnlessS3StatusError(error, 404);
            return null;
        }
    }

    async getMetaData(
        _context: IReadableContext,
        key: string,
    ): Promise<FileAdapterMetadata | null> {
        try {
            const response = await this.client.send(
                new HeadObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );
            if (response.ETag === undefined) {
                throw new UnexpectedError("response.ETag is undefined");
            }
            if (response.ContentType === undefined) {
                throw new UnexpectedError("response.ContentType is undefined");
            }
            if (response.ContentLength === undefined) {
                throw new UnexpectedError(
                    "response.ContentLength is undefined",
                );
            }
            if (response.LastModified === undefined) {
                throw new UnexpectedError("response.LastModified is undefined");
            }
            return {
                etag: response.ETag,
                contentType: response.ContentType,
                fileSizeInBytes: response.ContentLength,
                updatedAt: response.LastModified,
            } satisfies FileAdapterMetadata;
        } catch (error: unknown) {
            S3FileStorageAdapter.throwUnlessS3StatusError(error, 404);
            return null;
        }
    }

    async add(
        _context: IReadableContext,
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        try {
            await this.client.send(
                new PutObjectCommand({
                    ServerSideEncryption: this.serverSideEncryption,
                    Bucket: this.bucket,
                    Key: key,
                    Body: content.data,
                    IfNoneMatch: "*",
                    ContentType: content.contentType,
                    CacheControl: content.cacheControl ?? undefined,
                    ContentDisposition: content.contentDisposition ?? undefined,
                    ContentEncoding: content.contentEncoding ?? undefined,
                    ContentLanguage: content.contentLanguage ?? undefined,
                }),
            );
            return true;
        } catch (error: unknown) {
            S3FileStorageAdapter.throwUnlessS3StatusError(error, 412);
            return false;
        }
    }

    async addStream(
        _context: IReadableContext,
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        try {
            await this.client.send(
                new PutObjectCommand({
                    ServerSideEncryption: this.serverSideEncryption,
                    Bucket: this.bucket,
                    Key: key,
                    Body:
                        stream.fileSizeInBytes === null
                            ? await buffer(Readable.from(stream.data))
                            : Readable.from(stream.data),
                    ContentLength: stream.fileSizeInBytes ?? undefined,
                    IfNoneMatch: "*",
                    ContentType: stream.contentType,
                    CacheControl: stream.cacheControl ?? undefined,
                    ContentDisposition: stream.contentDisposition ?? undefined,
                    ContentEncoding: stream.contentEncoding ?? undefined,
                    ContentLanguage: stream.contentLanguage ?? undefined,
                }),
            );
            return true;
        } catch (error: unknown) {
            S3FileStorageAdapter.throwUnlessS3StatusError(error, 412);
            return false;
        }
    }

    async update(
        _context: IReadableContext,
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        try {
            await this.client.send(
                new PutObjectCommand({
                    ServerSideEncryption: this.serverSideEncryption,
                    Bucket: this.bucket,
                    Key: key,
                    Body: content.data,
                    IfMatch: "*",
                    ContentType: content.contentType,
                    CacheControl: content.cacheControl ?? undefined,
                    ContentDisposition: content.contentDisposition ?? undefined,
                    ContentEncoding: content.contentEncoding ?? undefined,
                    ContentLanguage: content.contentLanguage ?? undefined,
                }),
            );
            return true;
        } catch (error: unknown) {
            S3FileStorageAdapter.throwUnlessS3StatusError(error, 404);
            return false;
        }
    }

    async updateStream(
        _context: IReadableContext,
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        try {
            await this.client.send(
                new PutObjectCommand({
                    ServerSideEncryption: this.serverSideEncryption,
                    Bucket: this.bucket,
                    Key: key,
                    Body:
                        stream.fileSizeInBytes === null
                            ? await buffer(Readable.from(stream.data))
                            : Readable.from(stream.data),
                    ContentLength: stream.fileSizeInBytes ?? undefined,
                    IfMatch: "*",
                    ContentType: stream.contentType,
                    CacheControl: stream.cacheControl ?? undefined,
                    ContentDisposition: stream.contentDisposition ?? undefined,
                    ContentEncoding: stream.contentEncoding ?? undefined,
                    ContentLanguage: stream.contentLanguage ?? undefined,
                }),
            );
            return true;
        } catch (error: unknown) {
            S3FileStorageAdapter.throwUnlessS3StatusError(error, 404);
            return false;
        }
    }

    private async accuratePut(
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        try {
            await this.client.send(
                new PutObjectCommand({
                    ServerSideEncryption: this.serverSideEncryption,
                    Bucket: this.bucket,
                    Key: key,
                    Body: content.data,
                    IfNoneMatch: "*",
                    ContentType: content.contentType,
                    CacheControl: content.cacheControl ?? undefined,
                    ContentDisposition: content.contentDisposition ?? undefined,
                    ContentEncoding: content.contentEncoding ?? undefined,
                    ContentLanguage: content.contentLanguage ?? undefined,
                }),
            );
            return false;
        } catch (error: unknown) {
            S3FileStorageAdapter.throwUnlessS3StatusError(error, 412);

            await this.client.send(
                new PutObjectCommand({
                    ServerSideEncryption: this.serverSideEncryption,
                    Bucket: this.bucket,
                    Key: key,
                    Body: content.data,
                    ContentType: content.contentType,
                    CacheControl: content.cacheControl ?? undefined,
                    ContentDisposition: content.contentDisposition ?? undefined,
                    ContentEncoding: content.contentEncoding ?? undefined,
                    ContentLanguage: content.contentLanguage ?? undefined,
                }),
            );
            return true;
        }
    }

    private async unaccuratePut(
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        await this.client.send(
            new PutObjectCommand({
                ServerSideEncryption: this.serverSideEncryption,
                Bucket: this.bucket,
                Key: key,
                Body: content.data,
                ContentType: content.contentType,
                CacheControl: content.cacheControl ?? undefined,
                ContentDisposition: content.contentDisposition ?? undefined,
                ContentEncoding: content.contentEncoding ?? undefined,
                ContentLanguage: content.contentLanguage ?? undefined,
            }),
        );
        return true;
    }

    async put(
        _context: IReadableContext,
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        if (!this.enableAccuratePut) {
            return await this.unaccuratePut(key, content);
        }

        return await this.accuratePut(key, content);
    }

    private async accuratePutStream(
        context: IReadableContext,
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        const exists = await this.exists(context, key);
        await this.client.send(
            new PutObjectCommand({
                ServerSideEncryption: this.serverSideEncryption,
                Bucket: this.bucket,
                Key: key,
                Body:
                    stream.fileSizeInBytes === null
                        ? await buffer(stream.data)
                        : Readable.from(stream.data),
                ContentLength: stream.fileSizeInBytes ?? undefined,
                ContentType: stream.contentType,
                CacheControl: stream.cacheControl ?? undefined,
                ContentDisposition: stream.contentDisposition ?? undefined,
                ContentEncoding: stream.contentEncoding ?? undefined,
                ContentLanguage: stream.contentLanguage ?? undefined,
            }),
        );
        return exists;
    }

    private async unaccuratePutStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        await this.client.send(
            new PutObjectCommand({
                ServerSideEncryption: this.serverSideEncryption,
                Bucket: this.bucket,
                Key: key,
                Body: Readable.from(stream.data),
                ContentType: stream.contentType,
                CacheControl: stream.cacheControl ?? undefined,
                ContentDisposition: stream.contentDisposition ?? undefined,
                ContentEncoding: stream.contentEncoding ?? undefined,
                ContentLanguage: stream.contentLanguage ?? undefined,
            }),
        );
        return true;
    }

    async putStream(
        context: IReadableContext,
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        if (!this.enableAccuratePut) {
            return await this.unaccuratePutStream(key, stream);
        }

        return await this.accuratePutStream(context, key, stream);
    }

    async copy(
        context: IReadableContext,
        source: string,
        destination: string,
    ): Promise<FileWriteEnum> {
        const sourceExists = await this.exists(context, source);
        if (!sourceExists) {
            return FILE_WRITE_ENUM.NOT_FOUND;
        }

        const destinationExists = await this.exists(context, destination);
        if (destinationExists) {
            return FILE_WRITE_ENUM.KEY_EXISTS;
        }

        try {
            await this.client.send(
                new CopyObjectCommand({
                    ServerSideEncryption: this.serverSideEncryption,
                    Bucket: this.bucket,
                    Key: destination,
                    CopySource: `${this.bucket}/${source}`,
                }),
            );
            return FILE_WRITE_ENUM.SUCCESS;
        } catch (error: unknown) {
            S3FileStorageAdapter.throwUnlessS3StatusError(error, 404);
            return FILE_WRITE_ENUM.NOT_FOUND;
        }
    }

    async copyAndReplace(
        _context: IReadableContext,
        source: string,
        destination: string,
    ): Promise<boolean> {
        try {
            await this.client.send(
                new CopyObjectCommand({
                    ServerSideEncryption: this.serverSideEncryption,
                    Bucket: this.bucket,
                    Key: destination,
                    CopySource: `${this.bucket}/${source}`,
                }),
            );
            return true;
        } catch (error: unknown) {
            S3FileStorageAdapter.throwUnlessS3StatusError(error, 404);
            return false;
        }
    }

    async move(
        context: IReadableContext,
        source: string,
        destination: string,
    ): Promise<FileWriteEnum> {
        const result = await this.copy(context, source, destination);
        if (result === FILE_WRITE_ENUM.SUCCESS) {
            await this.removeMany(context, [source]);
        }
        return result;
    }

    async moveAndReplace(
        context: IReadableContext,
        source: string,
        destination: string,
    ): Promise<boolean> {
        const hasMoved = await this.copyAndReplace(
            context,
            source,
            destination,
        );
        if (hasMoved) {
            await this.removeMany(context, [source]);
        }
        return hasMoved;
    }

    async removeMany(
        context: IReadableContext,
        keys: Array<string>,
    ): Promise<boolean> {
        if (!this.enableAccurateRemoveMany) {
            await this.client.send(
                new DeleteObjectsCommand({
                    Bucket: this.bucket,
                    Delete: {
                        Objects: keys.map((key) => ({ Key: key })),
                    },
                }),
            );
            return true;
        }

        const results = await Promise.all(
            keys.map((key) => this.exists(context, key)),
        );
        await this.client.send(
            new DeleteObjectsCommand({
                Bucket: this.bucket,
                Delete: {
                    Objects: keys.map((key) => ({ Key: key })),
                },
            }),
        );
        for (const result of results) {
            if (result) {
                return true;
            }
        }
        return false;
    }

    async removeByPrefix(
        context: IReadableContext,
        prefix: string,
    ): Promise<void> {
        const listResponse = await this.client.send(
            new ListObjectsCommand({
                Bucket: this.bucket,
                Prefix: prefix,
            }),
        );
        if (listResponse.Contents?.length === 0) {
            return;
        }
        const keysToDelete =
            listResponse.Contents?.map((item) => item.Key).filter(
                (key) => key !== undefined,
            ) ?? [];
        await this.removeMany(context, keysToDelete);
    }
}
