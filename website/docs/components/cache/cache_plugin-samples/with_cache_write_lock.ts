import { withPlugin } from "eridu-tech/middleware";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { withCacheWriteLock } from "eridu-tech/cache/plugins";
import { MemoryLockFactory } from "eridu-tech/lock/memory-lock-factory";

const adapter = new MemoryCacheAdapter();
const lockFactory = new MemoryLockFactory();

// Apply the write lock plugin to the adapter
const lockedAdapter = withPlugin(adapter, withCacheWriteLock({ lockFactory }));
