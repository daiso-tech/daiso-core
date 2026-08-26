/**
 * @module Lock
 */

import type {
    ILockAdapter,
    ILockAdapterState,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ILockFactory,
} from "@/lock/contracts/_module.js";

/**
 * The `NoOpLockAdapter` will do nothing and is used for easily mocking {@link ILockFactory | `ILockFactory`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/lock/no-op-lock-adapter"`
 * @group Adapters
 */
export class NoOpLockAdapter implements ILockAdapter {
    acquire(
        _key: string,
        _lockId: string,
        _ttl: Date | null,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    release(_key: string, _lockId: string): Promise<boolean> {
        return Promise.resolve(true);
    }

    forceRelease(_key: string): Promise<boolean> {
        return Promise.resolve(true);
    }

    refresh(_key: string, _lockId: string, _ttl: Date): Promise<boolean> {
        return Promise.resolve(true);
    }

    getState(_key: string): Promise<ILockAdapterState | null> {
        return Promise.resolve(null);
    }
}
