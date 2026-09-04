import { withPlugin } from "eridu-tech/middleware";
import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";
import { withSharedLockPrefix } from "eridu-tech/shared-lock/plugins";

const adapter = new MemorySharedLockAdapter();

// Apply the prefix plugin to the adapter
const prefixedAdapter = withPlugin(adapter, withSharedLockPrefix("tenant-42:"));
