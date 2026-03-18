---
tags:
 - Utilities
keywords:
 - Utilities
---

# FileSize

The `@daiso-tech/core/file-size` component provides an easy way for defining, manipulating, and comparing file size. Furthermore, it is designed for easy integration with external file size libraries.

### Creating a FileSize

Creating `FileSize` from bytes:

```ts
import { FileSize } from "@daiso-tech/core/file-size";

const fileSize = FileSize.fromBytes(100);
```

Creating `FileSize` from kilo bytes:

```ts
import { FileSize } from "@daiso-tech/core/file-size";

const fileSize = FileSize.fromKiloBytes(100);
```

Creating `FileSize` from mega bytes:

```ts
import { FileSize } from "@daiso-tech/core/file-size";

const fileSize = FileSize.fromMegaBytes(100);
```

Creating `FileSize` from giga bytes:

```ts
import { FileSize } from "@daiso-tech/core/file-size";

const fileSize = FileSize.fromGigaBytes(100);
```

Creating `FileSize` from tera bytes:

```ts
import { FileSize } from "@daiso-tech/core/file-size";

const fileSize = FileSize.fromTeraBytes(1);
```

Creating `FileSize` from peta bytes:

```ts
import { FileSize } from "@daiso-tech/core/file-size";

const fileSize = FileSize.fromPetaBytes(1);
```

### Comparing FileSize:s

Equals:

```ts
// Returns false
FileSize.fromBytes(20_000).equal(FileSize.fromBytes(40_000));
```

Greater than:

```ts
// Returns false
FileSize.fromBytes(20_000).gt(FileSize.fromBytes(40_000));
```

Greater than or equals:

```ts
// Returns false
FileSize.fromBytes(20_000).gte(FileSize.fromBytes(40_000));
```

Less than:

```ts
// Returns true
FileSize.fromBytes(20_000).lt(FileSize.fromBytes(40_000));
```

Less than or equals:

```ts
// Returns true
FileSize.fromBytes(20_000).lte(FileSize.fromBytes(40_000));
```


### Converting a FileSize

You can get amount of bytes contained in the `FileSize`:

```ts
FileSize.fromKiloBytes(1).toBytes();
```

You can get amount of kilo bytes contained in the `FileSize`:

```ts
FileSize.fromMegaBytes(1).toKiloBytes();
```

You can get amount of giga bytes contained in the `FileSize`:

```ts
FileSize.fromTeraBytes(1).toGigaBytes();
```

You can get amount of tera bytes contained in the `FileSize`:

```ts
FileSize.fromPetaBytes(1).toTeraBytes();
```

You can get amount of peta bytes contained in the `FileSize`:

```ts
FileSize.fromPetaBytes(1000).toPetaBytes();
```

### Serialization and deserialization of FileSize

The `FileSize` class supports serialization and deserialization, allowing you to easily convert instances to and from serialized formats. However, registration is required first:

```ts
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import { FileSize } from "@daiso-tech/core/file-size";

const serde = new Serde(new SuperJsonSerdeAdapter());

serde.registerClass(FileSize);

const fileSize = FileSize.fromBytes(12);
const serializedFileSize = serde.serialize(fileSize);
const deserializedFileSize = serde.deserialize(serializedFileSize);

// logs false
console.log(serializedFileSize === deserializedFileSize);
```


## FileSize contract

The `IFileSize` contract provides a standardized way to express a file size as bytes.

Key components like `FileStorage`, rely on this contract, ensuring they are not tightly coupled to a specific file size implementation.

This decoupling is crucial for interoperability, allowing seamless integration with external file size libraries.
To integrate a new library, its file size objects must simply implement the `IFileSize` contract.

:::info
Note `FileSize` class implements `IFileSize` contract.
:::

The `IFileSize` contract requires you to implement the `TO_MILLISECONDS` method on the file size object, which must return the file size in milliseconds.

```ts
import { IFileSize, TO_BYTES } from "@daiso-tech/core/file-size/contracts";

export class MyFileSize implements IFileSize {
    constructor(private readonly fileSizeInBytes: number) {}

    [TO_BYTES](): number {
        return this.fileSizeInBytes;
    }
}
```

## Further information

For further information refer to [`@daiso-tech/core/file-size`](https://daiso-tech.github.io/daiso-core/modules/FileSize.html) API docs.
