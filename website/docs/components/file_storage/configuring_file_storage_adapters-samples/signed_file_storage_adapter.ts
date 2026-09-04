import { SignedFileStorageAdapter } from "eridu-tech/file-storage/signed-file-storage-adapter";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";

const signedFileStorageAdapter = new SignedFileStorageAdapter({
    adapter: new MemoryFileStorageAdapter(),
    urlAdapter: {},
});
