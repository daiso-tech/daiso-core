import { Base64Codec } from "eridu-tech/codec/base-64-codec";
import { FsFileStorageAdapter } from "eridu-tech/file-storage/fs-file-storage-adapter";

const fsFileStorageAdapter = new FsFileStorageAdapter({
    codec: new Base64Codec(),
});
