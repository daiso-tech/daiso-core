import {
    HeadBucketCommand,
    NotFound,
    PutBucketPolicyCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import {
    type StartedMinioContainer,
    MinioContainer,
} from "@testcontainers/minio";
import { Wait } from "testcontainers";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { S3FileStorageAdapter } from "@/file-storage/implementations/adapters/s3-file-storage-adapter/_module.js";
import { fileStorageAdapterTestSuite } from "@/file-storage/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: S3FileStorageAdapter", () => {
    let client: S3Client;
    let adapter: S3FileStorageAdapter;
    let startedContainer: StartedMinioContainer;
    const noOpContext = new ExecutionContext(new NoOpExecutionContextAdapter());
    beforeEach(async () => {
        startedContainer = await new MinioContainer(
            "minio/minio:RELEASE.2025-09-07T16-13-09Z",
        )
            .withWaitStrategy(Wait.forLogMessage(/.*API: http:\/\/.*/))
            .start();
        client = new S3Client({
            endpoint: startedContainer.getConnectionUrl(),
            region: "us-east-1",
            credentials: {
                accessKeyId: startedContainer.getUsername(),
                secretAccessKey: startedContainer.getPassword(),
            },
            forcePathStyle: true,
        });
        adapter = new S3FileStorageAdapter({
            client,
            bucket: "files",
            serverSideEncryption: null,
        });
    }, timeout.toMilliseconds());
    afterEach(async () => {
        client.destroy();
        await startedContainer.stop();
    }, timeout.toMilliseconds());
    fileStorageAdapterTestSuite({
        createAdapter: async () => {
            await adapter.init();
            return adapter;
        },
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: getPublicUrl", () => {
        test("Should return null when key doesnt exists", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();
            await client.send(
                new PutBucketPolicyCommand({
                    Bucket: bucket,
                    Policy: JSON.stringify({
                        Version: "2012-10-17",
                        Statement: [
                            {
                                Sid: "PublicRead",
                                Effect: "Allow",
                                Principal: "*",
                                Action: ["s3:GetObject"],
                                Resource: [`arn:aws:s3:::${bucket}/*`],
                            },
                        ],
                    }),
                }),
            );

            const key = "a";
            const result = await adapter.getPublicUrl(noOpContext, key);

            expect(result).toBeNull();
        });
        test("Should return string when key doesnt exists when enableAccurateGetPublicUrl setting is false", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
                enableAccurateGetPublicUrl: false,
            });
            await adapter.init();
            await client.send(
                new PutBucketPolicyCommand({
                    Bucket: bucket,
                    Policy: JSON.stringify({
                        Version: "2012-10-17",
                        Statement: [
                            {
                                Sid: "PublicRead",
                                Effect: "Allow",
                                Principal: "*",
                                Action: ["s3:GetObject"],
                                Resource: [`arn:aws:s3:::${bucket}/*`],
                            },
                        ],
                    }),
                }),
            );

            const key = "a";
            const result = await adapter.getPublicUrl(noOpContext, key);

            expect(result).toBeTypeOf("string");
        });
        test("Should return file data when key exists", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();
            await client.send(
                new PutBucketPolicyCommand({
                    Bucket: bucket,
                    Policy: JSON.stringify({
                        Version: "2012-10-17",
                        Statement: [
                            {
                                Sid: "PublicRead",
                                Effect: "Allow",
                                Principal: "*",
                                Action: ["s3:GetObject"],
                                Resource: [`arn:aws:s3:::${bucket}/*`],
                            },
                        ],
                    }),
                }),
            );

            const key = "a";
            const data = new Uint8Array(Buffer.from("CONTENT"));
            await adapter.add(noOpContext, key, {
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType: "text/plain",
                fileSizeInBytes: data.byteLength,
                data,
            });
            const url = await adapter.getPublicUrl(noOpContext, key);
            if (url === null) {
                throw new Error("url is null");
            }

            const response = await fetch(url);
            const retrievedData = new Uint8Array(await response.arrayBuffer());
            expect(retrievedData).toEqual(data);
        });
    });
    describe("method: getSignedDownloadUrl", () => {
        test("Should return null when key doesnt exists", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();

            const key = "a";
            const contentType = "text/plain";
            const contentDisposition = "inline";
            const result = await adapter.getSignedDownloadUrl(
                noOpContext,
                key,
                {
                    expirationInSeconds: 5000,
                    contentType,
                    contentDisposition,
                },
            );

            expect(result).toBeNull();
        });
        test("Should return string when key doesnt exists when enableAccurateGetSignedDownloadUrl setting is false", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
                enableAccurateGetSignedDownloadUrl: false,
            });
            await adapter.init();

            const key = "a";
            const contentType = "text/plain";
            const contentDisposition = "inline";
            const result = await adapter.getSignedDownloadUrl(
                noOpContext,
                key,
                {
                    expirationInSeconds: 5000,
                    contentType,
                    contentDisposition,
                },
            );

            expect(result).toBeTypeOf("string");
        });
        test("Should return file data when key exists", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();

            const key = "a";
            const data = new Uint8Array(Buffer.from("CONTENT"));
            const contentType = "text/plain";
            await adapter.add(noOpContext, key, {
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType,
                fileSizeInBytes: data.byteLength,
                data,
            });
            const contentDisposition = "inline";
            const url = await adapter.getSignedDownloadUrl(noOpContext, key, {
                expirationInSeconds: 5000,
                contentType,
                contentDisposition,
            });
            if (url === null) {
                throw new Error("url is null");
            }

            const response = await fetch(url);
            expect(response.headers.get("content-type")).toBe(contentType);
            expect(response.headers.get("content-disposition")).toBe(
                contentDisposition,
            );
            const retrievedData = new Uint8Array(await response.arrayBuffer());
            expect(retrievedData).toEqual(data);
        });
    });
    describe("method: getSignedUploadUrl", () => {
        test("Should persit file data when key doesnt exists", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();

            const key = "a";
            const contentType = "text/plain";
            const url = await adapter.getSignedUploadUrl(noOpContext, key, {
                expirationInSeconds: 5000,
                contentType,
            });

            const data = new Uint8Array(Buffer.from("CONTENT"));
            await fetch(url, {
                method: "PUT",
                body: data,
            });

            const bytes = await adapter.getBytes(noOpContext, key);
            expect(bytes).toEqual(data);
        });
        test("Should persit file data when key exists", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();

            const key = "a";
            const data = new Uint8Array(Buffer.from("CONTENT"));
            const contentType = "text/plain";
            await adapter.add(noOpContext, key, {
                data,
                fileSizeInBytes: data.byteLength,
                contentType,
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            });

            const url = await adapter.getSignedUploadUrl(noOpContext, key, {
                expirationInSeconds: 5000,
                contentType,
            });
            const newData = new Uint8Array(Buffer.from("NEW_CONTENT"));
            await fetch(url, {
                method: "PUT",
                body: newData,
            });

            const bytes = await adapter.getBytes(noOpContext, key);
            expect(bytes).toEqual(newData);
        });
    });
    describe("method: put", () => {
        test("Should return true when doesnt key exists and enableAccuratePut setting is false", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
                enableAccuratePut: false,
            });
            await adapter.init();

            const key = "a";

            const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
            const contentType = "application/octet-stream";
            const result = await adapter.put(noOpContext, key, {
                data,
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType,
                fileSizeInBytes: data.length,
            });

            expect(result).toBe(true);
        });
        test("Should persist data when key doesnt exist and enableAccuratePut setting is false", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
                enableAccuratePut: false,
            });
            await adapter.init();

            const key = "a";

            const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
            const contentType = "application/octet-stream";
            await adapter.put(noOpContext, key, {
                data,
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType,
                fileSizeInBytes: data.length,
            });

            const result = await adapter.getBytes(noOpContext, key);
            expect(result).toEqual(data);
        });
        test("Should return true when key exists and enableAccuratePut setting is false", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
                enableAccuratePut: false,
            });
            await adapter.init();

            const key = "a";

            const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
            const contentType = "application/octet-stream";
            await adapter.add(noOpContext, key, {
                data,
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType,
                fileSizeInBytes: data.length,
            });

            const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
            const result = await adapter.put(noOpContext, key, {
                data: newData,
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType,
                fileSizeInBytes: data.length,
            });

            expect(result).toBe(true);
        });
        test("Should persist data when key exist and enableAccuratePut setting is false", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
                enableAccuratePut: false,
            });
            await adapter.init();

            const key = "a";

            const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
            const contentType = "application/octet-stream";
            await adapter.add(noOpContext, key, {
                data,
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType,
                fileSizeInBytes: data.length,
            });

            const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
            await adapter.put(noOpContext, key, {
                data: newData,
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType,
                fileSizeInBytes: data.length,
            });

            const result = await adapter.getBytes(noOpContext, key);
            expect(result).toEqual(newData);
        });
    });
    describe("method: removeMany", () => {
        test("Should return true when all keys does not exists", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
                enableAccurateRemoveMany: false,
            });
            await adapter.init();

            const result = await adapter.removeMany(noOpContext, [
                "a",
                "b",
                "c",
            ]);

            expect(result).toBe(true);
        });
        test("Should return true when one key exists", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
                enableAccurateRemoveMany: false,
            });
            await adapter.init();

            const key = "a";

            const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
            const contentType = "application/octet-stream";
            await adapter.add(noOpContext, key, {
                data,
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType,
                fileSizeInBytes: data.length,
            });

            const result = await adapter.removeMany(noOpContext, [
                key,
                "b",
                "c",
            ]);

            expect(result).toBe(true);
        });
        test("Should persist removal of the keys that exists", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
                enableAccurateRemoveMany: false,
            });
            await adapter.init();

            const data1 = new Uint8Array(Buffer.from("CONTENT_A", "utf8"));
            const contentType = "application/octet-stream";
            await adapter.add(noOpContext, "a", {
                data: data1,
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType,
                fileSizeInBytes: data1.length,
            });

            const data2 = new Uint8Array(Buffer.from("CONTENT_B", "utf8"));
            await adapter.add(noOpContext, "b", {
                data: data2,
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType,
                fileSizeInBytes: data2.length,
            });

            const data3 = new Uint8Array(Buffer.from("CONTENT_C", "utf8"));
            await adapter.add(noOpContext, "c", {
                data: data3,
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType,
                fileSizeInBytes: data3.length,
            });

            await adapter.removeMany(noOpContext, ["a", "b"]);

            const result = [
                await adapter.getBytes(noOpContext, "a"),
                await adapter.getBytes(noOpContext, "b"),
                await adapter.getBytes(noOpContext, "c"),
            ];
            expect(result).toEqual([null, null, data3]);
        });
    });
    describe("method: init", () => {
        test("Should create the bucket", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();

            const promise = client.send(
                new HeadBucketCommand({
                    Bucket: bucket,
                }),
            );
            await expect(promise).resolves.toBeDefined();
        });
        test("Should not throw error when called multiple times", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove the bucket", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();

            await adapter.deInit();

            const promise = client.send(
                new HeadBucketCommand({
                    Bucket: bucket,
                }),
            );
            await expect(promise).rejects.toBeInstanceOf(NotFound);
        });
        test("Should not throw error when called multiple times", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();

            await adapter.deInit();
            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
});
