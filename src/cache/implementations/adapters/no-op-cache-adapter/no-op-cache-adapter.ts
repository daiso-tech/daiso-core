/**
 * @module Cache
 */

import {
    type ICacheAdapter,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ICache,
} from "@/cache/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * The `NoOpCacheAdapter` will do nothing and is used for easily mocking {@link ICache | `ICache`} for testing.
 *
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/no-op-cache-adapter"`
 * @group Adapters
 */
export class NoOpCacheAdapter<TType = unknown> implements ICacheAdapter<TType> {
    get(_key: string): Promise<TType | null> {
        return Promise.resolve(null);
    }

    getAndRemove(_key: string): Promise<TType | null> {
        return Promise.resolve(null);
    }

    add(_key: string, _value: TType, _ttl: TimeSpan | null): Promise<boolean> {
        return Promise.resolve(true);
    }

    put(_key: string, _value: TType, _ttl: TimeSpan | null): Promise<boolean> {
        return Promise.resolve(true);
    }

    update(_key: string, _value: TType): Promise<boolean> {
        return Promise.resolve(true);
    }

    increment(_key: string, _value: number): Promise<boolean> {
        return Promise.resolve(true);
    }

    removeMany(_keys: Array<string>): Promise<boolean> {
        return Promise.resolve(true);
    }

    removeAll(): Promise<void> {
        return Promise.resolve();
    }

    removeByKeyPrefix(_prefix: string): Promise<void> {
        return Promise.resolve();
    }
}
