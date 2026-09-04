import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";

const memoryCacheAdapter = new MemoryCacheAdapter();

// Remove all expired cache keys manually.
await memoryCacheAdapter.removeAllExpired();
