---
sidebar_position: 3
sidebar_label: Configuring adapters
pagination_label: Configuring file-storage adapters
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
---

# Configuring file-storage adapters

## MemoryFileStorageAdapter

To use the `MemoryFileStorageAdapter` you only need to create instance of it:

```ts
import { MemoryFileStorageAdapter } from "@daiso-tech/core/file-storage/memory-file-storage-adapter";

const memoryFileStorageAdapter = new MemoryFileStorageAdapter();
```

You can also provide an `Map` that will be used for storing the files in memory:

```ts
import { MemoryFileStorageAdapter } from "@daiso-tech/core/file-storage/memory-file-storage-adapter";

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
import { FsFileStorageAdapter } from "@daiso-tech/core/file-storage/fs-file-storage-adapter";

const fsFileStorageAdapter = new FsFileStorageAdapter();
```

You can configure the root folder:

```ts
import { FsFileStorageAdapter } from "@daiso-tech/core/file-storage/fs-file-storage-adapter";

const fsFileStorageAdapter = new FsFileStorageAdapter({
    location: "/my-custom-location",
});
```

You can configure codec used for file names:

```ts
import { Base64Codec } from "@daiso-tech/core/codec/base-64-codec";
import { FsFileStorageAdapter } from "@daiso-tech/core/file-storage/fs-file-storage-adapter";

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
import { S3FileStorageAdapter } from "@daiso-tech/core/file-storage/s3-file-storage-adapter";

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
} from "@daiso-tech/core/file-storage/s3-file-storage-adapter";

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

## NoOpFileStorageAdapter

The `NoOpFileStorageAdapter` is a no-operation implementation, it performs no actions when called:

```ts
import { NoOpFileStorageAdapter } from "@daiso-tech/core/file-storage/no-op-file-storage-adpater";

const noOpFileStorageAdapter = new NoOpFileStorageAdapter();
```

:::info
The `NoOpFileStorageAdapter` is useful when you want to mock out or disable your `FileStorage` instance.
:::

## Further information

For further information refer to [`@daiso-tech/core/file-storage`](https://daiso-tech.github.io/daiso-core/modules/FileStorage.html) API docs.
