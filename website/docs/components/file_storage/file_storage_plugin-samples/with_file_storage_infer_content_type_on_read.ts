import { withPlugin } from "eridu-tech/middleware";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { withFileStorageInferContentTypeOnRead } from "eridu-tech/file-storage/plugins";

const adapter = new MemoryFileStorageAdapter();

// Apply the read content-type plugin to the adapter
const metadataAdapter = withPlugin(
    adapter,
    withFileStorageInferContentTypeOnRead(),
);
