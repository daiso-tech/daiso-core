import { FileStorageResolver } from "eridu-tech/file-storage";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { FsFileStorageAdapter } from "eridu-tech/file-storage/fs-file-storage-adapter";

const fileStorageResolver = new FileStorageResolver({
    adapters: {
        memory: new MemoryFileStorageAdapter(),
        fs: new FsFileStorageAdapter(),
    },
    // You can set an optional default adapter
    defaultAdapter: "memory",
});
