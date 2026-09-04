import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import { EventEmitter } from "node:events";

const eventEmitter = new EventEmitter<any>();
const eventBusAdapter = new MemoryEventBusAdapter(eventEmitter);
