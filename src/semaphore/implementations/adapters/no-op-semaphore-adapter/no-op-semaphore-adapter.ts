/**
 * @module Semaphore
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type ISemaphoreAdapter,
    type ISemaphoreAdapterState,
    type SemaphoreAcquireSettings,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ISemaphoreFactory,
} from "@/semaphore/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * The `NoOpSemaphoreAdapter` will do nothing and is used for easily mocking {@link ISemaphoreFactory | `ISemaphoreFactory`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/no-op-semaphore-adapter"`
 * @group Adapters
 */
export class NoOpSemaphoreAdapter implements ISemaphoreAdapter {
    getState(
        _context: IReadableContext,
        _key: string,
    ): Promise<ISemaphoreAdapterState | null> {
        return Promise.resolve({
            limit: Infinity,
            acquiredSlots: new Map(),
        });
    }

    acquire(_settings: SemaphoreAcquireSettings): Promise<boolean> {
        return Promise.resolve(true);
    }

    release(
        _context: IReadableContext,
        _key: string,
        _slotId: string,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    forceReleaseAll(
        _context: IReadableContext,
        _key: string,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    refresh(
        _context: IReadableContext,
        _key: string,
        _slotId: string,
        _ttl: TimeSpan,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }
}
