import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { SignedFileStorageAdapter } from "eridu-tech/file-storage/signed-file-storage-adapter";
import { FileStorage } from "eridu-tech/file-storage";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());

const fileStorage = new FileStorage({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: new SignedFileStorageAdapter({
        adapter: new MemoryFileStorageAdapter(),
        urlAdapter: {},
    }),
});

const file = fileStorage.create("file.txt");
const serializedFIle = serde.serialize(file);
const deserializedFIle = serde.deserialize(file);
