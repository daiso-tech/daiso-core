/**
 * @module SharedLock
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type ISharedLockAdapter,
    type ISharedLockAdapterState,
    type SharedLockAcquireSettings,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ISharedLockFactory,
} from "@/shared-lock/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * The `NoOpSharedLockAdapter` will do nothing and is used for easily mocking {@link ISharedLockFactory | `ISharedLockFactory`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/no-op-shared-lock-adapter"`
 * @group Adapters
 */
export class NoOpSharedLockAdapter implements ISharedLockAdapter {
    acquireWriter(
        _context: IReadableContext,
        _key: string,
        _lockId: string,
        _ttl: TimeSpan | null,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    releaseWriter(
        _context: IReadableContext,
        _key: string,
        _lockId: string,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    forceReleaseWriter(
        _context: IReadableContext,
        _key: string,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    refreshWriter(
        _context: IReadableContext,
        _key: string,
        _lockId: string,
        _ttl: TimeSpan,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    acquireReader(_settings: SharedLockAcquireSettings): Promise<boolean> {
        return Promise.resolve(true);
    }

    releaseReader(
        _context: IReadableContext,
        _key: string,
        _lockId: string,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    forceReleaseAllReaders(
        _context: IReadableContext,
        _key: string,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    refreshReader(
        _context: IReadableContext,
        _key: string,
        _lockId: string,
        _ttl: TimeSpan,
    ): Promise<boolean> {
        return Promise.resolve(true);
    }

    forceRelease(_context: IReadableContext, _key: string): Promise<boolean> {
        return Promise.resolve(true);
    }

    getState(
        _context: IReadableContext,
        _key: string,
    ): Promise<ISharedLockAdapterState | null> {
        return Promise.resolve(null);
    }
}
