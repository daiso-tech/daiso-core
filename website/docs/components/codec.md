---
tags:
    - Utilities
keywords:
    - Utilities
---

# Codec

The `@daiso-tech/core/codec` component provides seamless way to encode/decode data.

## Usage

```ts
import { Base64Codec } from "@daiso-tech/core/codec/base-64-codec";

const codec = new Base64Codec();

const encodedStr = codec.encode("This is base-64 encoded");

const decodedStr = codec.decode(encodedStr);
```

## Separating encoding and decoding

The library includes 4 additional contracts:

- `IEncoder` - Allows only for encoding.

- `IDecoder` - Allows only for decoding.

- `ICodec` - Allows for both encoding and decoding.

## Existing Codec:s

Currently the library only included `Base64Codec` class.

## Further information

For further information refer to [`@daiso-tech/core/codec`](https://daiso-tech.github.io/daiso-core/modules/Codec.html) API docs.
