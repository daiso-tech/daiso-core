/**
 * @module FileStorage
 */

import { Readable } from "node:stream";

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
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
    FILE_WRITE_ENUM,
    type FildeAdapterSignedUrlSettings,
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
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/aws-file-storage-adapter"`
 * @group Adapters
 */
export type S3FileStorageAdapterSettings = {
    client: S3Client;

    bucket: string;

    /**
     * @default null
     */
    cdnUrl?: string | null;

    /**
     * @default null
     */
    serverSideEncryption?: ServerSideEncryption | null;

    /**
     * @default true
     */
    enableAccuratePut: boolean;

    /**
     * @default true
     */
    enableAccurateDownload: boolean;

    /**
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
export class S3FileStorageAdapter implements ISignedFileStorageAdapter {
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly cdnUrl: string | null;
    private readonly serverSideEncryption: ServerSideEncryption | undefined;
    private readonly enableAccuratePut: boolean;
    private readonly enableAccurateDownload: boolean;
    private readonly publicUrlGenerator: S3FilePublicUrlGenerator;

    constructor(settings: S3FileStorageAdapterSettings) {
        const {
            client,
            bucket,
            cdnUrl = null,
            serverSideEncryption = null,
            enableAccurateDownload = true,
            enableAccuratePut = true,
            publicUrlGenerator = defaultPublicUrlGenerator,
        } = settings;

        this.client = client;
        this.bucket = bucket;
        this.cdnUrl = cdnUrl;
        this.serverSideEncryption = serverSideEncryption ?? undefined;
        this.enableAccurateDownload = enableAccurateDownload;
        this.enableAccuratePut = enableAccuratePut;
        this.publicUrlGenerator = publicUrlGenerator;
    }

    async getPublicUrl(key: string): Promise<string | null> {
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
        key: string,
        settings: FildeAdapterSignedUrlSettings,
    ): Promise<string | null> {
        if (this.enableAccurateDownload && !(await this.exists(key))) {
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
        key: string,
        settings: FildeAdapterSignedUrlSettings,
    ): Promise<string> {
        return await getSignedUrl(
            this.client,
            new PutObjectCommand({
                ServerSideEncryption: this.serverSideEncryption,
                Bucket: this.bucket,
                Key: key,
                ContentType: settings.contentType ?? undefined,
                ContentDisposition: settings.contentDisposition ?? undefined,
            }),
            {
                expiresIn: settings.expirationInSeconds,
            },
        );
    }

    async exists(key: string): Promise<boolean> {
        const response = await this.client.send(
            new HeadObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }),
        );
        return response.$metadata.httpStatusCode === 200;
    }

    async getStream(key: string): Promise<FileAdapterStream | null> {
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
            if (!(error instanceof S3ServiceException)) {
                throw error;
            }
            if (error.$metadata.httpStatusCode !== 404) {
                throw error;
            }
            return null;
        }
    }

    async getBytes(key: string): Promise<Uint8Array | null> {
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
            if (!(error instanceof S3ServiceException)) {
                throw error;
            }
            if (error.$metadata.httpStatusCode !== 404) {
                throw error;
            }
            return null;
        }
    }

    async getMetaData(key: string): Promise<FileAdapterMetadata | null> {
        try {
            const response = await this.client.send(
                new HeadObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );
            if (response.ETag === undefined) {
                throw new UnexpectedError("response.Body is undefined");
            }
            if (response.ContentType === undefined) {
                throw new UnexpectedError("response.Body is undefined");
            }
            if (response.ContentLength === undefined) {
                throw new UnexpectedError("response.Body is undefined");
            }
            if (response.LastModified === undefined) {
                throw new UnexpectedError("response.Body is undefined");
            }
            const createdAt = response.Metadata?.["createdAt"];
            if (createdAt === undefined) {
                throw new UnexpectedError("response.Body is undefined");
            }
            return {
                etag: response.ETag,
                contentType: response.ContentType,
                fileSizeInBytes: response.ContentLength,
                createdAt: new Date(createdAt),
                updatedAt: response.LastModified,
            } satisfies FileAdapterMetadata;
        } catch (error: unknown) {
            if (!(error instanceof S3ServiceException)) {
                throw error;
            }
            if (error.$metadata.httpStatusCode !== 404) {
                throw error;
            }
            return null;
        }
    }

    async add(
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
            if (!(error instanceof S3ServiceException)) {
                throw error;
            }
            if (error.$metadata.httpStatusCode !== 412) {
                throw error;
            }
            return false;
        }
    }

    async addStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        try {
            await this.client.send(
                new PutObjectCommand({
                    ServerSideEncryption: this.serverSideEncryption,
                    Bucket: this.bucket,
                    Key: key,
                    Body: Readable.from(stream.data),
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
            if (!(error instanceof S3ServiceException)) {
                throw error;
            }
            if (error.$metadata.httpStatusCode !== 412) {
                throw error;
            }
            return false;
        }
    }

    async update(
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
            if (!(error instanceof S3ServiceException)) {
                throw error;
            }
            if (error.$metadata.httpStatusCode !== 412) {
                throw error;
            }
            return false;
        }
    }

    async updateStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        try {
            await this.client.send(
                new PutObjectCommand({
                    ServerSideEncryption: this.serverSideEncryption,
                    Bucket: this.bucket,
                    Key: key,
                    Body: Readable.from(stream.data),
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
            if (!(error instanceof S3ServiceException)) {
                throw error;
            }
            if (error.$metadata.httpStatusCode !== 412) {
                throw error;
            }
            return false;
        }
    }

    async put(
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        if (this.enableAccuratePut) {
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
            if (!(error instanceof S3ServiceException)) {
                throw error;
            }
            if (error.$metadata.httpStatusCode !== 412) {
                throw error;
            }

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
            return false;
        }
    }

    async putStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        if (this.enableAccuratePut) {
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

        try {
            await this.client.send(
                new PutObjectCommand({
                    ServerSideEncryption: this.serverSideEncryption,
                    Bucket: this.bucket,
                    Key: key,
                    Body: Readable.from(stream.data),
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
            if (!(error instanceof S3ServiceException)) {
                throw error;
            }
            if (error.$metadata.httpStatusCode !== 412) {
                throw error;
            }

            await this.client.send(
                new PutObjectCommand({
                    ServerSideEncryption: this.serverSideEncryption,
                    Bucket: this.bucket,
                    Key: key,
                    Body: Readable.from(stream.data),
                    IfMatch: "*",
                    ContentType: stream.contentType,
                    CacheControl: stream.cacheControl ?? undefined,
                    ContentDisposition: stream.contentDisposition ?? undefined,
                    ContentEncoding: stream.contentEncoding ?? undefined,
                    ContentLanguage: stream.contentLanguage ?? undefined,
                }),
            );
            return false;
        }
    }

    async copy(source: string, destination: string): Promise<FileWriteEnum> {
        try {
            await this.client.send(
                new CopyObjectCommand({
                    ServerSideEncryption: this.serverSideEncryption,
                    IfNoneMatch: "*",
                    Bucket: this.bucket,
                    Key: source,
                    CopySource: `${this.bucket}/${destination}`,
                }),
            );
            return FILE_WRITE_ENUM.SUCCESS;
        } catch (error: unknown) {
            if (!(error instanceof S3ServiceException)) {
                throw error;
            }
            if (error.$metadata.httpStatusCode === 404) {
                return FILE_WRITE_ENUM.NOT_FOUND;
            }
            if (error.$metadata.httpStatusCode === 412) {
                return FILE_WRITE_ENUM.KEY_EXISTS;
            }
            throw error;
        }
    }

    async copyAndReplace(
        source: string,
        destination: string,
    ): Promise<boolean> {
        try {
            await this.client.send(
                new CopyObjectCommand({
                    ServerSideEncryption: this.serverSideEncryption,
                    Bucket: this.bucket,
                    Key: source,
                    CopySource: `${this.bucket}/${destination}`,
                }),
            );
            return true;
        } catch (error: unknown) {
            if (!(error instanceof S3ServiceException)) {
                throw error;
            }
            if (error.$metadata.httpStatusCode !== 404) {
                throw error;
            }
            return false;
        }
    }

    async move(source: string, destination: string): Promise<FileWriteEnum> {
        const result = await this.copy(source, destination);
        await this.removeMany([source]);
        return result;
    }

    async moveAndReplace(
        source: string,
        destination: string,
    ): Promise<boolean> {
        const result = await this.copyAndReplace(source, destination);
        await this.removeMany([source]);
        return result;
    }

    async removeMany(keys: Array<string>): Promise<boolean> {
        const response = await this.client.send(
            new DeleteObjectsCommand({
                Bucket: this.bucket,
                Delete: {
                    Objects: keys.map((key) => ({ Key: key })),
                    Quiet: true,
                },
            }),
        );
        const actuallyDeleted =
            response.Deleted?.filter((obj) => {
                return obj.DeleteMarker === true || obj.VersionId !== undefined;
            }) ?? [];

        return actuallyDeleted.length > 0;
    }

    async removeByPrefix(prefix: string): Promise<void> {
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
        await this.removeMany(keysToDelete);
    }
}
