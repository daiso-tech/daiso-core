import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import { FileSize } from "eridu-tech/file-size";

const serde = new Serde(new SuperJsonSerdeAdapter());

serde.registerClass(FileSize);

const fileSize = FileSize.fromBytes(12);
const serializedFileSize = serde.serialize(fileSize);
const deserializedFileSize = serde.deserialize(serializedFileSize);

// logs false
console.log(serializedFileSize === deserializedFileSize);
