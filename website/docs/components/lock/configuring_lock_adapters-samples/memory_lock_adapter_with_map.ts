import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";

const map = new Map<any, any>();
const memoryLockAdapter = new MemoryLockAdapter(map);
