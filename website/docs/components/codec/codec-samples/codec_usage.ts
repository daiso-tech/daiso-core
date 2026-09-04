import { Base64Codec } from "eridu-tech/codec/base-64-codec";

const codec = new Base64Codec();

const encodedStr = codec.encode("This is base-64 encoded");

const decodedStr = codec.decode(encodedStr);
