import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";
import {
    type StartedMinioContainer,
    MinioContainer,
} from "@testcontainers/minio";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { S3FileStorageAdapter } from "@/file-storage/implementations/adapters/s3-file-storage-adapter/_module.js";
import { fileStorageAdapterTestSuite } from "@/file-storage/implementations/test-utilities/file-storage-adapter.test-suite.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: s3FileStorageAdapter", () => {
    let client: S3Client;
    let adapter: S3FileStorageAdapter;
    let startedContainer: StartedMinioContainer;
    beforeEach(async () => {
        startedContainer = await new MinioContainer(
            "minio/minio:RELEASE.2024-12-13T22-19-12Zs",
        ).start();
        client = new S3Client({
            endpoint: startedContainer.getConnectionUrl(),
            region: "us-east-1",
            credentials: {
                accessKeyId: startedContainer.getUsername(),
                secretAccessKey: startedContainer.getPassword(),
            },
            forcePathStyle: true,
        });
        const bucket = "files";
        await client.send(
            new CreateBucketCommand({
                Bucket: bucket,
            }),
        );
        adapter = new S3FileStorageAdapter({
            client,
            bucket,
        });
    }, timeout.toMilliseconds());
    afterEach(async () => {
        client.destroy();
        await startedContainer.stop();
    }, timeout.toMilliseconds());
    fileStorageAdapterTestSuite({
        createAdapter: () => adapter,
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: getPublicUrl", () => {
        test.todo("Write tests!!!");
    });
    describe("method: getSignedDownloadUrl", () => {
        test.todo("Write tests!!!");
    });
    describe("method: getSignedUploadUrl", () => {
        test.todo("Write tests!!!");
    });
    describe("method: deInit", () => {
        test.todo("Should clear map");
    });
});
