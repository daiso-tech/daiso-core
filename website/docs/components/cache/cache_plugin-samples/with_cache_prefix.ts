import { withPlugin } from "eridu-tech/middleware";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { withCachePrefix } from "eridu-tech/cache/plugins";

const adapter = new MemoryCacheAdapter();

// Apply the prefix plugin to the adapter
const prefixedAdapter = withPlugin(adapter, withCachePrefix("tenant-42:"));
