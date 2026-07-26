/**
 * @module Lock
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type ILockAdapter,
    type ILockAdapterState,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ILockFactory,
} from "@/lock/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * The `NoOpLockAdapter` will do nothing and is used for easily mocking {@link ILockFactory | `ILockFactory`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/no-op-lock-adapter"`
 * @group Adapters
 */
export class NoOpLockAdapter implements ILockAdapter {
    acquire(
        _key: string,
        _lockId: string,
        _ttl: TimeSpan | null,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    release(
        _key: string,
        _lockId: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    forceRelease(_key: string, _context: IReadableContext): Promise<boolean> {
        return Promise.resolve(true);
    }

    refresh(
        _key: string,
        _lockId: string,
        _ttl: TimeSpan,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    getState(
        _key: string,
        _context: IReadableContext,
    ): Promise<ILockAdapterState | null> {
        return Promise.resolve(null);
    }
}
