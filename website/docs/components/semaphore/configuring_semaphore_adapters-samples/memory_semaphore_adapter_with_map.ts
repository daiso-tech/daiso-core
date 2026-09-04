import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";

const map = new Map<any, any>();
const memorySemaphoreAdapter = new MemorySemaphoreAdapter(map);
