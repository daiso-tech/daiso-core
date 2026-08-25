/**
 * @module Semaphore
 */

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    ISemaphoreAdapter,
    ISemaphoreAdapterState,
    SemaphoreAcquireSettings,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ISemaphoreFactory,
} from "@/semaphore/contracts/_module.js";

/**
 * The `NoOpSemaphoreAdapter` will do nothing and is used for easily mocking {@link ISemaphoreFactory | `ISemaphoreFactory`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/no-op-semaphore-adapter"`
 * @group Adapters
 */
export class NoOpSemaphoreAdapter implements ISemaphoreAdapter {
    getState(
        _key: string,
        _context: IReadableContext,
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
        _key: string,
        _slotId: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    forceReleaseAll(
        _key: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    refresh(
        _key: string,
        _slotId: string,
        _ttl: Date,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }
}
