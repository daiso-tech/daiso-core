---
sidebar_position: 1
sidebar_label: Usage
pagination_label: FileStorage usage
tags:
    - FileStorage
    - Usage
keywords:
    - FileStorage
    - Usage
---

# FileStorage usage

The `eridu-tech/file-storage` component provides a way for managing files independent of underlying platform or storage.

## Initial configuration

To begin using the `FileStorage` class, you'll need to create and configure an instance:

```ts file=./file_storage_usage-samples/file_storage_initial_config.ts
```

:::info
Here is a complete list of settings for the [`FileStorage`](https://eridu-tech.github.io/eridu-tech-core/types/file-storage.FileStorage.html) class.
:::

## FileStorage basics

### Creating a file object

```ts file=./file_storage_usage-samples/file_storage_create_file.ts
```

:::info
Note the file object represents a reference to a file and doesnt create the real underlying file.
:::

### Writing buffered files

You can add a file and true is returned if the file does not exists:

```ts file=./file_storage_usage-samples/file_storage_add.ts
```

You can update a file and true will be returned if the file exists and was updated:

```ts file=./file_storage_usage-samples/file_storage_update.ts
```

You can upsert a file and true will be returned if the file was updated otherwise false is returned:

```ts file=./file_storage_usage-samples/file_storage_put.ts
```

:::info
Note you can pass the following types to `add`, `update`, `put` method:

- `Buffer`
- `ArrayBuffer`
- `SharedArrayBuffer`
- `string`
- `Uint8Array`
- `Int8Array`
- `Uint16Array`
- `Int16Array`
- `Uint32Array`
- `Int32Array`
- `BigUint64Array`
- `BigInt64Array`
- `Float32Array`
- `Float64Array`
- `DataView`

But usually you would use `Uint8Array` because it represents data as bytes.
:::

You can pass additional optional metadata information to `add`, `update` and `put`:

```ts file=./file_storage_usage-samples/file_storage_add_with_metadata.ts
```

### Writing streamed files

You can add a file stream and true is returned if the file does not exists:

```ts file=./file_storage_usage-samples/file_storage_add_stream.ts
```

You can update a file stream and true will be returned if the file exists and was updated:

```ts file=./file_storage_usage-samples/file_storage_update_stream.ts
```

You can upsert a file stream and true will be returned if the file was updated otherwise false is returned:

```ts file=./file_storage_usage-samples/file_storage_put_stream.ts
```

:::info
Note you can pass the following types to `addStream`, `updateStream`, `putStream` method:

- `AsyncIteralbe<Buffer>`
- `AsyncIteralbe<ArrayBuffer>`
- `AsyncIteralbe<SharedArrayBuffer>`
- `AsyncIteralbe<string>`
- `AsyncIteralbe<Uint8Array>`
- `AsyncIteralbe<Int8Array>`
- `AsyncIteralbe<Uint16Array>`
- `AsyncIteralbe<Int16Array>`
- `AsyncIteralbe<Uint32Array>`
- `AsyncIteralbe<Int32Array>`
- `AsyncIteralbe<BigUint64Array>`
- `AsyncIteralbe<BigInt64Array>`
- `AsyncIteralbe<Float32Array>`
- `AsyncIteralbe<Float64Array>`
- `AsyncIteralbe<DataView>`

But usually you would use `AsyncIterable<Uint8Array>` because it represents stream as bytes.
:::

You can pass additional optional metadata information to `addStrem`, `updateStream` and `putStream`:

```ts file=./file_storage_usage-samples/file_storage_add_stream_with_metadata.ts
```

You can also pass the file-size of the stream which used for optimizations by some adapters:

```ts file=./file_storage_usage-samples/file_storage_add_stream_with_file_size.ts
```

:::info
It is best practice to pass file-size whenever possible because of the optimizations.  
:::

### Retrieving files

The file can be read as utf8 text:

```ts file=./file_storage_usage-samples/file_storage_get_text.ts
```

The file can be read as `Uint8Array`:

```ts file=./file_storage_usage-samples/file_storage_get_bytes.ts
```

The file can be read as web `ArrayBuffer`:

```ts file=./file_storage_usage-samples/file_storage_get_array_buffer.ts
```

console.log(content);

````

The file can be read as web stream:

```ts
const content = await fileStorage.create("file.txt").getReadableStream();

console.log(content);
````

:::info
Note all this methods return null if the file doesnt exists.
:::

### Checking file existence

You can check if the file exists:

```ts file=./file_storage_usage-samples/file_storage_exists.ts
```

You can check if the file doesnt exists:

```ts file=./file_storage_usage-samples/file_storage_missing.ts
```

### Removing files

You can remove a file and true will be returned if the file exists and was removed:

```ts file=./file_storage_usage-samples/file_storage_remove.ts
```

You can remove multiple files and true will be returned when at least one file exists and was removed:

```ts file=./file_storage_usage-samples/file_storage_remove_many.ts
```

### Retrieving file metadata

You can retrieve the file metadata. Null is returned if the file doesnt exists:

```ts file=./file_storage_usage-samples/file_storage_get_metadata.ts
```

The `getMetadata` returns [FileMetadata](https://eridu-tech.github.io/eridu-tech-core/types/file-storage.FileMetadata.html) type.

## Patterns

### Additional methods

These variants are equivalent to the standard methods but throw an error if the file does not exist and in case of `addOrFail` it throws error if the file exists.

- `getTextOfFail`
- `getBytesOrFail`
- `getArrayBufferOrFail`
- `getReadableStreamOrFail`
- `addOrFail`
- `addStreamOrFail`
- `updateOrFail`
- `updateStreamOrFail`
- `removeOrFail`
- `getMetadataOrFail`

### Copying files

You can copy a file. True is returned if the source exists and destination doesnt exists:

```ts file=./file_storage_usage-samples/file_storage_copy.ts
```

Use `copyOrFail` method to perform the same operations as the `copy` method but it throws an error if the source file is missing or destination exists.

You can copy a file and repalce the destination. True is returned if the source exists:

```ts file=./file_storage_usage-samples/file_storage_copy_and_replace.ts
```

Use `copyAndReplaceOrFail` method to perform the same operations as the `copyAndReplace` method but it throws an error if the source file is missing.

### Moving files

You can move a file. True is returned if the source exists and destination doesnt exists:

```ts file=./file_storage_usage-samples/file_storage_move.ts
```

Use `moveOrFail` method to perform the same operations as the `move` method but it throws an error if the source file is missing or destination exists.

You can move a file and repalce the destination. True is returned if the source exists:

```ts file=./file_storage_usage-samples/file_storage_move_and_replace.ts
```

Use `moveAndReplaceOrFail` method to perform the same operations as the `moveAndReplace` method but it throws an error if the source file is missing.

### Signed urls and public urls.

Create signed urls to allow clients to upload files directly to FileStorage.

Upload url methods:

- getSignedUploadUrl: Returns the signed upload url string.

```ts file=./file_storage_usage-samples/file_storage_get_signed_upload_url.ts
```

Create signed urls to allow clients to download files directly from FileStorage.

Download url methods:

- getSignedDownloadUrl: Returns the signed download url string, or null if the file does not exist.
- getSignedDownloadUrlOrFail: Returns the signed download url string, but throws an error if the file is missing.

```ts file=./file_storage_usage-samples/file_storage_get_signed_download_url.ts
```

Use these methods to retrieve a permanent link to a file that is publicly accessible within your storage provider.

- `getPublicUrl`: Returns the public url as a string, or null if the file does not exist.
- `getPublicUrlOrFail`: Returns the public url, but throws an error if the file is missing.

```ts file=./file_storage_usage-samples/file_storage_get_public_url.ts
```

### File instance variables

The `File` class exposes the key instance variable which is the filename:

```ts file=./file_storage_usage-samples/file_storage_instance_variables.ts
```

### Serialization and deserialization of file

File obejcts can be serialized, allowing them to be transmitted over the network to another server and later deserialized for reuse.

:::info
Note only file name will be saved when serialized and not it' content.
Which makes it efficient to send file over the network.
:::

In order to serialize or deserialize a file object you need pass an object that implements [`ISerderRegister`](../serde/serde.md) contract like the [`Serde`](../serde/serde.md) class to `FileStorage`.

Manually serializing and deserializing the file object:

```ts file=./file_storage_usage-samples/file_storage_manual_serialization.ts
```

:::danger
When serializing or deserializing a file, you must use the same `Serde` instances that were provided to the `FilStorage`. This is required because the `FilStorage` injects custom serialization logic for `IFile` instance into `Serde` instances.
:::

:::info
Note you only need manuall serialization and deserialization when integrating with external libraries.
:::

As long you pass the same `Serde` instances with all other components you dont need to serialize and deserialize the file object manually.

```ts file=./file_storage_usage-samples/file_storage_event_bus_serialization.ts
```

### Separating file creation from manipulation

The library includes 3 additional contracts:

- [`IReadableFile`](https://eridu-tech.github.io/eridu-tech-core/types/file-storage.IReadableFile.html) - Allows only for reading a file.

- [`IFile`](https://eridu-tech.github.io/eridu-tech-core/types/file-storage.IFile.html) - Allows for both reading and manipulating the file.

- [`IFileFactory`](https://eridu-tech.github.io/eridu-tech-core/types/file-storage.IFileFactory.html) - Allows only for creation of file.

- [`IFileStorage`](https://eridu-tech.github.io/eridu-tech-core/types/file-storage.IFileStorage.html) - Allows for creation and removal of files.

## Further information

For further information refer to [`eridu-tech/file-storage`](https://eridu-tech.github.io/eridu-tech-core/modules/file-storage.html) API docs.
