import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";

const map = new Map<any, any>();
const memorySharedLockAdapter = new MemorySharedLockAdapter(map);
