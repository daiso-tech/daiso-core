import { withPlugin } from "eridu-tech/middleware";
import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";
import { withSemaphorePrefix } from "eridu-tech/semaphore/plugins";

const adapter = new MemorySemaphoreAdapter();

// Apply the prefix plugin to the adapter
const prefixedAdapter = withPlugin(adapter, withSemaphorePrefix("pool-1:"));
