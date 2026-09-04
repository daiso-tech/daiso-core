import { withPlugin } from "eridu-tech/middleware";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { withFileStorageInferFileTypeOnWrite } from "eridu-tech/file-storage/plugins";

const adapter = new MemoryFileStorageAdapter();

// Apply the write file-type plugin to the adapter
const fileTypeAdapter = withPlugin(
    adapter,
    withFileStorageInferFileTypeOnWrite(),
);
