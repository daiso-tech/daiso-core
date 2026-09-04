import { withPlugin } from "eridu-tech/middleware";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { withCacheJitter } from "eridu-tech/cache/plugins";

const adapter = new MemoryCacheAdapter();

// Apply the jitter plugin to the adapter
const jitteredAdapter = withPlugin(adapter, withCacheJitter());
