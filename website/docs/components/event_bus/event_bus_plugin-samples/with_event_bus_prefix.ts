import { withPlugin } from "eridu-tech/middleware";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import { withEventBusPrefix } from "eridu-tech/event-bus/plugins";

const adapter = new MemoryEventBusAdapter();

// Apply the prefix plugin to the adapter
const prefixedAdapter = withPlugin(adapter, withEventBusPrefix("tenant-42:"));
