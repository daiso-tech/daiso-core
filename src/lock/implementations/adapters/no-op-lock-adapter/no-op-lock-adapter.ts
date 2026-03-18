/**
 * @module Lock
 */

import {
    type ILockAdapter,
    type ILockAdapterState,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ILockProvider,
} from "@/lock/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * The `NoOpLockAdapter` will do nothing and is used for easily mocking {@link ILockProvider | `ILockProvider`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/no-op-lock-adapter"`
 * @group Adapters
 */
export class NoOpLockAdapter implements ILockAdapter {
    acquire(
        _key: string,
        _lockId: string,
        _ttl: TimeSpan | null,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    release(_key: string, _lockId: string): Promise<boolean> {
        return Promise.resolve(true);
    }

    forceRelease(_key: string): Promise<boolean> {
        return Promise.resolve(true);
    }

    refresh(_key: string, _lockId: string, _ttl: TimeSpan): Promise<boolean> {
        return Promise.resolve(true);
    }

    getState(_key: string): Promise<ILockAdapterState | null> {
        return Promise.resolve(null);
    }
}
