import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";

const map = new Map<any, any>();
const memoryFileStorageAdapter = new MemoryFileStorageAdapter(map);
