import { S3FileStorageAdapter } from "eridu-tech/file-storage/s3-file-storage-adapter";

const s3Client = new S3Client({
    credentials: {
        accessKeyId: "AWS_ACCESS_KEY_ID",
        secretAccessKey: "AWS_SECRET_ACCESS_KEY",
    },
    region: "AWS_REGION",
});
const s3FileStorageAdapter = new S3FileStorageAdapter({
    client: s3Client,
});
