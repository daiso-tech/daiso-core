/**
 * @module EventBus
 */

import type { IEventBusAdapter } from "@/event-bus/contracts/event-bus-adapter.contract.js";
import type {
    BaseEventMap,
    IEventBus,
} from "@/event-bus/contracts/event-bus.contract.js";

/**
 * IMPORT_PATH: `"eridu-tech/lock/contracts"`
 * @group Contracts
 */
export type EventBusInput<TEventMap extends BaseEventMap = BaseEventMap> =
    IEventBusAdapter | IEventBus<TEventMap>;
