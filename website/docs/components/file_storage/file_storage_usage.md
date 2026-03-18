---
sidebar_position: 1
sidebar_label: Usage
pagination_label: FileStorage usage
tags:
 - FileStorage
 - Usage
 - Namespace
keywords:
 - FileStorage
 - Usage
 - Namespace
---

# FileStorage usage

The `@daiso-tech/core/file-storage` component provides a way for managing files independent of underlying platform or storage.

## Initial configuration

To begin using the `FileStorage` class, you'll need to create and configure an instance:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { MemoryFileStorageAdapter } from "@daiso-tech/core/file-storage/memory-file-storage-adapter";
import { FileStorage } from "@daiso-tech/core/file-storage";

const fileStorage = new FileStorage({
    // You can provide defaultContentType value by default is application/octet-stream
    defaultContentType: "text/plain",

    // You can choose the adapter to use
    adapter: new MemoryFileStorageAdapter(),
});
```
:::info
Here is a complete list of settings for the [`FileStorage`](https://daiso-tech.github.io/daiso-core/types/FileStorage.FileStorage.html) class.
:::

## FileStorage basics

### Creating a file object

```ts
const file = fileStorage.create("file.txt");
```

:::info
Note the file object represents a reference to a file and doesnt create the real underlying file.
:::


### Writing buffered files

You can add a file and true is returned if the file does not exists:
```ts
const hasAdded = await fileStorage.create("file.txt").add({ data: "CONTENT" });
```

You can update a file and true will be returned if the file exists and was updated:
```ts
const hasUpdated = await cache.create("file.txt").update({ data: "TEXT 1" });
```

You can upsert a file and true will be returned if the file was updated otherwise false is returned:
```ts
const hasUpdated = await cache.create("file.txt").put({ data: "TEXT 1" });
const hasUpdated = await cache.create("file.txt").put({ data: "TEXT 2" });
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

```ts
const hasAdded = await fileStorage.create("file.txt").add({
    data: "CONTENT"

    /**
     * You can explicitly set a custom Content-Type. If one is not provided, it will be inferred from the key. For example, a key ending in .txt (such as key-a.txt) will be assigned text/plain.
     * If the key contains a non-standard extension it will default to application/octet-stream.
     */
    contentType: "text/plain",

    /**
     * Note a default value is always provided. To explicitly unset a field and prevent it from being passed to the underlying adapter, pass in `null`.
     */
    contentLanguage: "en-US",

    /**
     * Note a default value is always provided. To explicitly unset a field and prevent it from being passed to the underlying adapter, pass in `null`.
     */
    contentEncoding: "gzip",

    /**
     * Note a default value is always provided. To explicitly unset a field and prevent it from being passed to the underlying adapter, pass in `null`.
     */
    contentDisposition: "inline",

    /**
     * Note a default value is always provided. To explicitly unset a field and prevent it from being passed to the underlying adapter, pass in `null`.
     */
    cacheControl: "no-cache",
});
```

### Writing streamed files

You can add a file stream and true is returned if the file does not exists:
```ts
import { createReadStream } from "node:fs"

const fileStream = createReadStream("./file.txt")

const hasAdded = await fileStorage.create("file.txt").addStream({ data: fileStream });
```

You can update a file stream and true will be returned if the file exists and was updated:
```ts
import { createReadStream } from "node:fs"

const fileStream = createReadStream("./file.txt")

const hasUpdated = await cache.create("file.txt").updateStream({ data: fileStream });
```

You can upsert a file stream and true will be returned if the file was updated otherwise false is returned:
```ts
import { createReadStream } from "node:fs"

const fileStream = createReadStream("./file.txt")

const hasUpdated = await cache.create("file.txt").putStream({ data: fileStream });
const hasUpdated = await cache.create("file.txt").putStream({ data: fileStream });
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

```ts
const fileStream = createReadStream("./file.txt")

const hasAdded = await fileStorage.create("file.txt").addStream({
    data: fileStream

    /**
     * You can explicitly set a custom Content-Type. If one is not provided, it will be inferred from the key. For example, a key ending in .txt (such as key-a.txt) will be assigned text/plain.
     * If the key contains a non-standard extension it will default to application/octet-stream.
     */
    contentType: "text/plain",

    /**
     * Note a default value is always provided. To explicitly unset a field and prevent it from being passed to the underlying adapter, pass in `null`.
     */
    contentLanguage: "en-US",

    /**
     * Note a default value is always provided. To explicitly unset a field and prevent it from being passed to the underlying adapter, pass in `null`.
     */
    contentEncoding: "gzip",

    /**
     * Note a default value is always provided. To explicitly unset a field and prevent it from being passed to the underlying adapter, pass in `null`.
     */
    contentDisposition: "inline",

    /**
     * Note a default value is always provided. To explicitly unset a field and prevent it from being passed to the underlying adapter, pass in `null`.
     */
    cacheControl: "no-cache",
});
```

You can also pass the file size of the stream which used for optimizations by some adapters:
```ts
import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises";
import { FileSize } from "@daiso-tech/file-size";

const fileStream = createReadStream("./file.txt")
const { size } = stat("./file.txt")

const hasAdded = await fileStorage.create("file.txt").addStream({
    data: fileStream
    fileSize: FileSize.fromBytes(size)
})
```

:::info
It is best practice to pass file size whenever possible because of the optimizations.  
:::

### Retrieving files

The file can be read as utf8 text:
```ts
const content = await fileStorage.create("file.txt").getText();

console.log(content);
```

The file can be read as `Uint8Array`:
```ts
const content = await fileStorage.create("file.txt").getBytes();

console.log(content);
```

The file can be read as node js `Buffer`:
```ts
const content = await fileStorage.create("file.txt").getBuffer();

console.log(content);
```

The file can be read as web `ArrayBuffer`:
```ts
const content = await fileStorage.create("file.txt").getArrayBuffer();

console.log(content);
```

The file can be read as node js stream:
```ts
const content = await fileStorage.create("file.txt").getReadable();

console.log(content);
```

The file can be read as web stream:
```ts
const content = await fileStorage.create("file.txt").getReadableStream();

console.log(content);
```

:::info
Note all this methods return null if the file doesnt exists.
:::

### Checking file existence

You can check if the file exists:

```ts
const exists = await fileStorage.create("file.txt").exists();
```

You can check if the file doesnt exists:

```ts
const missing = await fileStorage.create("file.txt").missing();
```

### Removing files

You can remove a file and true will be returned if the file exists and was removed:
```ts
const hasRemoved = await fileStorage.create("file.txt").remove();
console.log(hasRemoved)
```

You can remove multiple files and true will be returned when at least one file exists and was removed:
```ts
const hasRemovedAtLeastOne = await fileStorage.removeMany([
    fileStorage.create("file-1.txt"),
    fileStorage.create("file-2.txt"),
    fileStorage.create("file-3.txt")
])
console.log(hasRemovedAtLeastOne)
```

### Retrieving file metadata

You can retrieve the file metadata. Null is returned if the file doesnt exists:
```ts
const metadata = await fileStorage.create("file.txt").getMetadata();
console.log(metadata);
```
The `getMetadata` returns [FileMetadata](https://daiso-tech.github.io/daiso-core/types/FileStorage.FileMetadata.html) type.

## Patterns

### Additional methods
These variants are equivalent to the standard methods but throw an error if the file does not exist and in case of `addOrFail` it throws error if the file exists.

- `getTextOfFail`
- `getBytesOrFail`
- `getBufferOrFail`
- `getArrayBufferOrFail`
- `getReadableOrFail`
- `getReadableStreamOrFail`
- `addOrFail`
- `addStreamOrFail`
- `updateOrFail`
- `updateStreamOrFail`
- `removeOrFail`
- `getMetadataOrFail`

### Copying files
You can copy a file. True is returned if the source exists and destination doesnt exists:
```ts
await fileStorage.create("source.txt").copy("destination.txt")
```
Use `copyOrFail` method to perform the same operations as the `copy` method but it throws an error if the source file is missing or destination exists.

You can copy a file and repalce the destination. True is returned if the source exists:
```ts
await fileStorage.create("source.txt").copyAndReplace("destination.txt")
```
Use `copyAndReplaceOrFail` method to perform the same operations as the `copyAndReplace` method but it throws an error if the source file is missing.

### Moving files
You can move a file. True is returned if the source exists and destination doesnt exists:
```ts
await fileStorage.create("source.txt").move("destination.txt")
```
Use `moveOrFail` method to perform the same operations as the `move` method but it throws an error if the source file is missing or destination exists.

You can move a file and repalce the destination. True is returned if the source exists:
```ts
await fileStorage.create("source.txt").moveAndReplace("destination.txt")
```
Use `moveAndReplaceOrFail` method to perform the same operations as the `moveAndReplace` method but it throws an error if the source file is missing.

### Signed urls and public urls.

Create signed urls to allow clients to upload files directly to file-storage.

Upload url methods:
- getSignedUploadUrl: Returns the signed upload url string.

```ts
const uploadUrl = await fileStorage.create("source.txt").getSignedUploadUrl({
    // All settings are optional
    ttl: TimeSpan.fromMinutes(10)
    // The content type will be infered from the filename by default
    contentType: "text/plain"
})
console.log(uploadUrl)
```

Create signed urls to allow clients to download files directly from file-storage.

Download url methods:
- getSignedDownloadUrl: Returns the signed download url string, or null if the file does not exist.
- getSignedDownloadUrlOrFail: Returns the signed download url string, but throws an error if the file is missing.
```ts
const file = fileStorage.create("source.txt")
await file.add("CONTENT")

const donwloadUrl = await file.getSignedDownloadUrl({
    // All settings are optional
    ttl: TimeSpan.fromMinutes(10)
    // The content type will be infered from the filename by default
    contentType: "text/plain",
    contentDisposition: "inline"
})
console.log(donwloadUrl)
```

Use these methods to retrieve a permanent link to a file that is publicly accessible within your storage provider.
- `getPublicUrl`: Returns the public url as a string, or null if the file does not exist.
- `getPublicUrlOrFail`: Returns the public url, but throws an error if the file is missing.

```ts
const file = fileStorage.create("source.txt")
await file.add("CONTENT")

const publicUrl = await file.getPublicUrl();

console.log(publicUrl);
```

:::info
Note since not all file-storage adapters support signed or public URLs, you can manually override these behaviors using the `urlAdapter` setting:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { MemoryFileStorageAdapter } from "@daiso-tech/core/file-storage/memory-file-storage-adapter";
import { FildeAdapterDownloadUrlSettings, FildeAdapterUploadUrlSettings } from "@daiso-tech/core/file-storage/contracts";
import { FileStorage } from "@daiso-tech/core/file-storage";

const fileStorage = new FileStorage({
    // You can provide defaultContentType value by default is application/octet-stream
    defaultContentType: "text/plain",

    // You can choose the adapter to use
    adapter: new MemoryFileStorageAdapter(),

    urlAdapter: {
        getPublicUrl(key: string): Promise<string | null> {
            return null
        },
        getSignedDownloadUrl(
            key: string,
            settings: FildeAdapterDownloadUrlSettings,
        ): Promise<string | null> {
            return null
        },
        getSignedUploadUrl(
            key: string,
            settings: FildeAdapterUploadUrlSettings,
        ): Promise<string> {
            return ""
        }
    }
});
```
:::

### File instance variables

The `File` class exposes the key instance variable which is the filename:

```ts
const file = fileStorage.create("file.txt");

// Will return the file name
console.log(file.key.toString());
```

### Namespacing

You can use the `Namespace` class to group related files without conflicts. Since namespacing is not used be default, you need to pass an obeject that implements `INamespace` object.

:::info
For further information about namespacing refer to [`@daiso-tech/core/namespace`](../namespace.md) documentation.
:::

```ts
import { Namespace } from "@daiso-tech/core/namespace";
import { MemoryFileStorageAdapter } from "@daiso-tech/core/file-storage/memory-file-storage-adapter";
import { FileStorage } from "@daiso-tech/core/file-storage";

const fileStorageA = new FileStorage({
    namespace: new Namespace("@file-storage-a"),
    adapter: new MemoryFileStorageAdapter(),
});
const fileStorageB = new FileStorage({
    namespace: new Namespace("@file-storage-b"),
    adapter: new MemoryFileStorageAdapter(),
});

const fileA = await fileStorageA.create("file.txt");
const fileB = await fileStorageB.create("file.txt");

await fileA.add({ data: "CONTENT_A"});
await fileB.add({ data: "CONTENT_B"});

// Will log "CONTENT_A"
console.log(fileA.getText())

// Will log "CONTENT_B"
console.log(fileB.getText())
```

### Serialization and deserialization of file

File obejcts can be serialized, allowing them to be transmitted over the network to another server and later deserialized for reuse.

:::info
Note when only file name will be saved when serialized and not it' content.
Which makes it efficient to send file over the network.
:::

In order to serialize or deserialize a file object you need pass an object that implements [`ISerderRegister`](../serde.md) contract like the [`Serde`](../serde.md) class to `FileStorage`. 

Manually serializing and deserializing the file object:

```ts
import { MemoryFileStorageAdapter } from "@daiso-tech/core/file-storage/memory-file-storage-adapter";
import { FileStorage } from "@daiso-tech/core/file-storage";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());

const fileStorage = new FileStorage({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: new MemoryFileStorageAdapter(),
});

const file = fileStorage.create("file.txt");
const serializedFIle = serde.serialize(file);
const deserializedFIle = serde.deserialize(file);
```

:::danger
When serializing or deserializing a file, you must use the same `Serde` instances that were provided to the `FilStorage`. This is required because the `FilStorage` injects custom serialization logic for `IFile` instance into `Serde` instances.
:::

:::info
Note you only need manuall serialization and deserialization when integrating with external libraries.
:::

As long you pass the same `Serde` instances with all other components you dont need to serialize and deserialize the file object manually.

```ts
import { MemoryFileStorageAdapter } from "@daiso-tech/core/file-storage/memory-file-storage-adapter";
import type { IFile } from "@daiso-tech/core/file-storage/contracts";
import { FileStorage } from "@daiso-tech/core/file-storage";
import { RedisPubSubEventBusAdapter } from "@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter";
import { EventBus } from "@daiso-tech/core/event-bus";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());
const redis = new Redis("YOUR_REDIS_CONNECTION");

type EventMap = {
    "sending-file-over-network": {
        file: IFile;
    };
};
const eventBus = new EventBus<EventMap>({
    adapter: new RedisPubSubEventBusAdapter({
        client: redis,
        serde,
    }),
});

const fileStorage = new FileStorage({
    serde,
    adapter: new MemoryFileStorageAdapter(),
    eventBus,
});
const file = fileStorage.create("file.txt");

// We are sending the file over the network to other servers.
await eventBus.dispatch("sending-file-over-network", {
    file,
});

// The other servers will recieve the serialized file and automattically deserialize it.
await eventBus.addListener("sending-file-over-network", ({ file }) => {
    // The file is deserialized and can be used
    console.log("file:", file);
});
```

### File events

You can listen to different [file events](https://daiso-tech.github.io/daiso-core/modules/File.html) that are triggered by the `File` instance.

Refer to the [`EventBus`](../event_bus/event_bus_usage.md) documentation to learn how to use events. Since no events are dispatched by default, you need to pass an object that implements `IEventBus` contract.

```ts
import { MemoryFileStorageAdapter } from "@daiso-tech/core/file-storage/memory-file-storage-adapter";
import { FileStorage, FILE_EVENTS } from "@daiso-tech/core/file-storage";
import { EventBus } from "@daiso-tech/core/event-bus";
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";

const fileStorage = new FileStorage({
    adapter: new MemoryFileStorageAdapter(),
    eventBus: new EventBus({
        adapter: new MemoryEventBusAdapter(),
    }),
});

await fileStorage.events.addListener(FILE_EVENTS.ADDED, () => {
    console.log("File added");
});

await fileStorage.create("file.txt").add({ data: "CONTENT" });
```

:::warning
If multiple file-storage adapters (e.g., `FsFileStorageAdapter` and `MemoryFileStorageAdapter`) are used at the same time, you need to isolate their events by assigning separate namespaces. This prevents listeners from unintentionally capturing events across adapters.

```ts
import { FsFileStorageAdapter } from "@daiso-tech/core/file-storage/fs-file-storage-adapter";
import { MemoryFileStorageAdapter } from "@daiso-tech/core/file-storage/memory-file-storage-adapter";
import { EventBus } from "@daiso-tech/core/event-bus";
import { RedisPubSubEventBusAdapter } from "@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import { Namespace } from "@daiso-tech/core/namespace";

const serde = new Serde(new SuperJsonSerdeAdapter());

const redisPubSubEventBusAdapter = new RedisPubSubEventBusAdapter({
    client: new Redis("YOUR_REDIS_CONNECTION_STRING"),
    serde,
});

const memoryFileStorageAdapter = new MemoryFileStorageAdapter();
const memoryFileStorage = new FileStorage({
    adapter: memoryFileStorageAdapter,
    eventBus: new EventBus({
        // We assign distinct namespaces to MemoryFileStorageAdapter and FsFileStorageAdapter to isolate their events.
        namespace: new Namespace(["memory", "event-bus"]),
        adapter: redisPubSubEventBusAdapter,
    }),
});

const fsFileStorageAdapter = new FsFileStorageAdapter();
const fsFileStorage = new FileStorage({
    adapter: fsFileStorageAdapter,
    eventBus: new EventBus({
        // We assign distinct namespaces to MemoryFileStorageAdapter and FsFileStorageAdapter to isolate their events.
        namespace: new Namespace(["fs", "event-bus"]),
        adapter: redisPubSubEventBusAdapter,
    }),
});
```

:::

### Separating creating, listening to and manipulating files

The library includes 3 additional contracts:

- [`IFile`](https://daiso-tech.github.io/daiso-core/types/FileStorage.IFile.html) - Allows only for manipulating of the file.

- [`IFileProvider`](https://daiso-tech.github.io/daiso-core/types/FileStorage.IFileStorageBase.html) - Allows only for creation of file.

- [`IFileStorageBase`](https://daiso-tech.github.io/daiso-core/types/FileStorage.IFileStorageBase.html) - Allows for creation and removal of files.

- [`IFileListenable`](https://daiso-tech.github.io/daiso-core/types/FileStorage.IFileListenable.html) - Allows only to listening to file events.

## Further information

For further information refer to [`@daiso-tech/core/file-storage`](https://daiso-tech.github.io/daiso-core/modules/FileStorage.html) API docs.
