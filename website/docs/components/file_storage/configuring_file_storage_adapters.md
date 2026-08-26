---
sidebar_position: 3
sidebar_label: Configuring adapters
pagination_label: Configuring FileStorage adapters
tags:
    - FileStorage
    - Configuring adapters
    - In-memory
    - File system
    - Aws s3
    - Cloudflare r2
    - Digital ocean spaces
    - Tigris
    - Supabase Storage
    - Minio
    - NoOp
    - Signed
keywords:
    - FileStorage
    - Configuring adapters
    - In-memory
    - File system
    - Aws s3
    - Cloudflare r2
    - Digital ocean spaces
    - Tigris
    - Supabase Storage
    - Minio
    - NoOp
    - Signed
---

# Configuring FileStorage adapters

## MemoryFileStorageAdapter

To use the `MemoryFileStorageAdapter` you only need to create instance of it:

```ts
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";

const memoryFileStorageAdapter = new MemoryFileStorageAdapter();
```

You can also provide an `Map` that will be used for storing the files in memory:

```ts
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";

const map = new Map<any, any>();
const memoryFileStorageAdapter = new MemoryFileStorageAdapter(map);
```

:::info
`MemoryFileStorageAdapter` lets you test your app without external dependencies like `@aws-sdk/client-s3`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

:::warning
Note this adapter doesnt have support for creating signed upload, signed download and public urls.
:::

## FsFileStorageAdapter

To use the `FsFileStorageAdapter` you only need to create instance of it:

```ts
import { FsFileStorageAdapter } from "eridu-tech/file-storage/fs-file-storage-adapter";

const fsFileStorageAdapter = new FsFileStorageAdapter();
```

You can configure the root folder:

```ts
import { FsFileStorageAdapter } from "eridu-tech/file-storage/fs-file-storage-adapter";

const fsFileStorageAdapter = new FsFileStorageAdapter({
    location: "/my-custom-location",
});
```

You can configure codec used for file names:

```ts
import { Base64Codec } from "eridu-tech/codec/base-64-codec";
import { FsFileStorageAdapter } from "eridu-tech/file-storage/fs-file-storage-adapter";

const fsFileStorageAdapter = new FsFileStorageAdapter({
    codec: new Base64Codec(),
});
```

:::warning
Not encoding and decoding is required for `FsFileStorageAdapter` to maintain a flat hierarchy within the root folder and to ensure compatibility with OS-restricted characters.
:::

:::warning
Not this adapter does not support signed upload, signed download and public urls.
It also doesnt support explictly setting the content-type and it will instead infer the content-type from the file name.
:::

## S3FileStorageAdapter

To use the `S3FileStorageAdapter`, you'll need to:

1. Install the required dependency: [`@aws-sdk/client-s3`](https://www.npmjs.com/package/@aws-sdk/client-s3) package:

```ts
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
```

Other settings:

```ts
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
```

:::info
Note this adapter with object storage services that are compatible with aws s3 like:

- Cloudflare r2
- Digital ocean spaces
- Tigris
- Supabase Storage
- Minio
  :::

## SignedFileStorageAdapter

The `SignedFileStorageAdapter` merges a regular file storage adapter with a URL adapter into a single [`ISignedFileStorageAdapter`](https://eridu-tech.github.io/eridu-tech-core/types/FileStorage.ISignedFileStorageAdapter.html).

The `adapter` handles all file CRUD operations (create, read, update, delete, copy and move), while the `urlAdapter` handles public and signed URL generation.

This is useful for storage backends where file operations and signed URL generation are handled separately, for example a database-backed storage adapter combined with an S3 URL adapter. Since `S3FileStorageAdapter` already implements signed URL generation, you typically use `SignedFileStorageAdapter` when you need to pair a regular adapter (that does not generate URLs) with your own URL generation logic.

To use the `SignedFileStorageAdapter` you need to provide:

- `adapter`: The underlying file storage adapter that handles file operations. It is not required to implement signed URL generation.
- `urlAdapter`: A partial URL adapter for generating public and signed URLs. Only the URL methods your storage backend supports need to be provided.

Basic usage:

```ts
import { SignedFileStorageAdapter } from "eridu-tech/file-storage/signed-file-storage-adapter";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";

const signedFileStorageAdapter = new SignedFileStorageAdapter({
    adapter: new MemoryFileStorageAdapter(),
    urlAdapter: {},
});
```

You can provide the URL methods that your storage backend supports:

```ts
import { SignedFileStorageAdapter } from "eridu-tech/file-storage/signed-file-storage-adapter";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import type {
    FileAdapterSignedDownloadUrlSettings,
    FileAdapterSignedUploadUrlSettings,
} from "eridu-tech/file-storage/contracts";

const signedFileStorageAdapter = new SignedFileStorageAdapter({
    adapter: new MemoryFileStorageAdapter(),
    urlAdapter: {
        async getPublicUrl(key: string): Promise<string | null> {
            return `https://cdn.example.com/${key}`;
        },
        async getSignedDownloadUrl(
            key: string,
            settings: FileAdapterSignedDownloadUrlSettings,
        ): Promise<string | null> {
            return generateSignedDownloadUrl(key, settings);
        },
        async getSignedUploadUrl(
            key: string,
            settings: FileAdapterSignedUploadUrlSettings,
        ): Promise<string> {
            return generateSignedUploadUrl(key, settings);
        },
    },
});
```

:::info
Any omitted URL method falls back to a no-op implementation:

- `getPublicUrl` returns `null`
- `getSignedDownloadUrl` returns `null`
- `getSignedUploadUrl` returns an empty string
  :::

## NoOpFileStorageAdapter

The `NoOpFileStorageAdapter` is a no-operation implementation, it performs no actions when called:

```ts
import { NoOpFileStorageAdapter } from "eridu-tech/file-storage/no-op-file-storage-adpater";

const noOpFileStorageAdapter = new NoOpFileStorageAdapter();
```

:::info
The `NoOpFileStorageAdapter` is useful when you want to mock out or disable your `FileStorage` instance.
:::

## Further information

For further information refer to [`eridu-tech/file-storage`](https://eridu-tech.github.io/eridu-tech-core/modules/file-storage.html) API docs.
