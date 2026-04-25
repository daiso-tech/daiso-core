/**
 * @module EventBus
 */

import { type IEventBusAdapter } from "@/event-bus/contracts/event-bus-adapter.contract.js";
import {
    type BaseEventMap,
    type IEventBus,
} from "@/event-bus/contracts/event-bus.contract.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type EventBusInput<TEventMap extends BaseEventMap = BaseEventMap> =
    | IEventBusAdapter
    | IEventBus<TEventMap>;
