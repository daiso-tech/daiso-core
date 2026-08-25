/**
 * @module SharedLock
 */

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    ISharedLockAdapter,
    ISharedLockAdapterState,
    SharedLockAcquireSettings,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ISharedLockFactory,
} from "@/shared-lock/contracts/_module.js";

/**
 * The `NoOpSharedLockAdapter` will do nothing and is used for easily mocking {@link ISharedLockFactory | `ISharedLockFactory`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/no-op-shared-lock-adapter"`
 * @group Adapters
 */
export class NoOpSharedLockAdapter implements ISharedLockAdapter {
    acquireWriter(
        _key: string,
        _lockId: string,
        _ttl: Date | null,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    releaseWriter(
        _key: string,
        _lockId: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    forceReleaseWriter(
        _key: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    refreshWriter(
        _key: string,
        _lockId: string,
        _ttl: Date,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    acquireReader(_settings: SharedLockAcquireSettings): Promise<boolean> {
        return Promise.resolve(true);
    }

    releaseReader(
        _key: string,
        _lockId: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    forceReleaseAllReaders(
        _key: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    refreshReader(
        _key: string,
        _lockId: string,
        _ttl: Date,
        _context: IReadableContext,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    forceRelease(_key: string, _context: IReadableContext): Promise<boolean> {
        return Promise.resolve(true);
    }

    getState(
        _key: string,
        _context: IReadableContext,
    ): Promise<ISharedLockAdapterState | null> {
        return Promise.resolve(null);
    }
}
