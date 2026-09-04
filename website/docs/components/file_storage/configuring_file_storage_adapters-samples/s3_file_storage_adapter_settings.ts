import {
    S3FileStorageAdapter,
    defaultPublicUrlGenerator,
} from "eridu-tech/file-storage/s3-file-storage-adapter";

const s3Client = new S3Client({
    credentials: {
        accessKeyId: "AWS_ACCESS_KEY_ID",
        secretAccessKey: "AWS_SECRET_ACCESS_KEY",
    },
    region: "AWS_REGION",
});
const s3FileStorageAdapter = new S3FileStorageAdapter({
    client: s3Client,

    /**
     * The bucket option defines the S3 bucket to use for managing files.
     */
    bucket: "bucket",

    /**
     * The cdnUrl field can be used to define the base URL for generating public URL for a file. For example, If you use CloudFront alongside S3 to serve public files, the cdnUrl property should be the CloudFront URL.
     */
    cdnUrl: null,

    /**
     * Define ServerSideEncryption option for all objects uploaded to S3.
     */
    serverSideEncryption: "AES256",

    /**
     * If false the put method of ISignedFileStorageAdapter will perform one database call and thereby always return true even when the file doesnt exists.
     * Note the fewer database calls the cheaper when using aws s3.
     */
    enableAccuratePut: true,

    /**
     * If false the getSignedDownloadUrl method of ISignedFileStorageAdapter will perfom one database call and therby always return string even when the file doesnt exists.
     * Note the fewer database calls the cheaper when using aws s3.
     */
    enableAccurateDownload: true,

    /**
     * Define a custom public url generator for creating public and signed URLs.
     */
    publicUrlGenerator: defaultPublicUrlGenerator,
});
