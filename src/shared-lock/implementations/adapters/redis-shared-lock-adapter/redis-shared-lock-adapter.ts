/**
 * @module SharedLock
 */

import { type Redis, type Result } from "ioredis";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type ISharedLockAdapter,
    type ISharedLockAdapterState,
    type SharedLockAcquireSettings,
} from "@/shared-lock/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";
import { UnexpectedError } from "@/utilities/errors.js";

/**
 * @internal
 */
type IRedisJsonWriterLockState = {
    owner: string;
    expiration: number;
};

/**
 * @internal
 */
type IRedisJsonReaderSemaphore = {
    limit: number;
    acquiredSlots: Record<string, number>;
};

/**
 * @internal
 */
type IRedisJsonSharedLockState = {
    writer?: IRedisJsonWriterLockState;
    reader?: IRedisJsonReaderSemaphore;
};

declare module "ioredis" {
    interface RedisCommander<Context> {
        daiso_shared_lock_acquire_writer(
            key: string,
            lockId: string,
            expiration: number | null,
        ): Result<1 | 0, Context>;

        daiso_shared_lock_release_writer(
            key: string,
            lockId: string,
        ): Result<1 | 0, Context>;

        daiso_shared_lock_refresh_writer(
            key: string,
            lockId: string,
            expiration: number,
        ): Result<1 | 0, Context>;

        daiso_shared_lock_force_release_writer(
            key: string,
        ): Result<1 | 0, Context>;

        daiso_shared_lock_acquire_reader(
            key: string,
            lockId: string,
            limit: number,
            expiration: number | null,
            now: number,
        ): Result<1 | 0, Context>;

        daiso_shared_lock_release_reader(
            key: string,
            lockId: string,
            now: number,
        ): Result<1 | 0, Context>;

        daiso_shared_lock_refresh_reader(
            key: string,
            lockId: string,
            expiration: number,
            now: number,
        ): Result<1 | 0, Context>;

        daiso_shared_lock_force_release_all_readers(
            key: string,
            now: number,
        ): Result<1 | 0, Context>;

        daiso_shared_lock_force_release(
            key: string,
            now: number,
        ): Result<1 | 0, Context>;

        /**
         * Returns {@link IRedisJsonSharedLockState | `IRedisJsonSharedLockState | null`} as json string.
         */
        daiso_shared_lock_get_state(
            key: string,
            now: number,
        ): Result<string, Context>;
    }
}

/**
 * To utilize the `RedisSharedLockAdapter`, you must install the [`"ioredis"`](https://www.npmjs.com/package/ioredis) package.
 *
 * Note in order to use `RedisSharedLockAdapter` correctly, ensure you use a single, consistent database across all server instances.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/redis-shared-lock-adapter"`
 * @group Adapters
 */
export class RedisSharedLockAdapter implements ISharedLockAdapter {
    /**
     * @example
     * ```ts
     * import { RedisSharedLockAdapter } from "@daiso-tech/core/shared-lock/redis-shared-lock-adapter";
     * import Redis from "ioredis";
     *
     * const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
     * const sharedLockAdapter = new RedisSharedLockAdapter(database);
     * ```
     */
    constructor(private readonly database: Redis) {
        this.initAquireWriterCommand();
        this.initReleaseWriterCommand();
        this.initRefreshWriterCommand();
        this.initForceReleaseWriterCommand();
        this.initAquireReaderCommand();
        this.initReleaseReaderCommand();
        this.initRefreshReaderCommand();
        this.initForceReleaseAllReadersCommand();
        this.initForceReleaseCommand();
        this.initGetStateCommand();
    }

    private static getWriterKey(keyVar: string): string {
        return `
            (function(key)
                return key .. "__writer";
            end)(${keyVar});
        `;
    }

    private static getReaderKey(keyVar: string): string {
        return `
            (function(key)
                return key .. "__reader";
            end)(${keyVar});
        `;
    }

    private initAquireWriterCommand(): void {
        if (
            typeof this.database.daiso_shared_lock_acquire_writer === "function"
        ) {
            return;
        }

        this.database.defineCommand("daiso_shared_lock_acquire_writer", {
            numberOfKeys: 1,
            lua: `
                local key = KEYS[1];
                local lockId = ARGV[1];
                local writerKey = ${RedisSharedLockAdapter.getWriterKey("key")}
                
                local readerKey = ${RedisSharedLockAdapter.getReaderKey("key")}
                if redis.call("exists", readerKey) == 1 then
                    return 0
                end
                
                -- Expiration time as unix timestamp in ms
                local expiration = tonumber(ARGV[2]);

                if redis.call("exists", writerKey) == 1 then
                    return redis.call("get", writerKey) == lockId;
                end
                
                if expiration == nil then
                    redis.call("set", writerKey, lockId, "nx");
                else
                    redis.call("set", writerKey, lockId, "pxat", expiration, "nx");
                end
                
                return 1;
            `,
        });
    }

    private initReleaseWriterCommand(): void {
        if (
            typeof this.database.daiso_shared_lock_release_writer === "function"
        ) {
            return;
        }
        this.database.defineCommand("daiso_shared_lock_release_writer", {
            numberOfKeys: 1,
            lua: `
                local key = KEYS[1];
                local lockId = ARGV[1];
                local writerKey = ${RedisSharedLockAdapter.getWriterKey("key")}

                local readerKey = ${RedisSharedLockAdapter.getReaderKey("key")}
                if redis.call("exists", readerKey) == 1 then
                    return 0
                end

                if redis.call("exists", writerKey) == 0 then
                    return 0
                end

                local isNotCurrentOwner = redis.call("get", writerKey) ~= lockId
                if isNotCurrentOwner then
                    return 0
                end

                redis.call("del", writerKey)
                
                return 1
            `,
        });
    }

    private initRefreshWriterCommand(): void {
        if (
            typeof this.database.daiso_shared_lock_refresh_writer === "function"
        ) {
            return;
        }
        this.database.defineCommand("daiso_shared_lock_refresh_writer", {
            numberOfKeys: 1,
            lua: `
                -- Arguments
                local key = KEYS[1];
                local lockId = ARGV[1];
                local writerKey = ${RedisSharedLockAdapter.getWriterKey("key")}

                local readerKey = ${RedisSharedLockAdapter.getReaderKey("key")}
                if redis.call("exists", readerKey) == 1 then
                    return 0
                end

                -- Expiration time as unix timestamp in ms
                local expiration = tonumber(ARGV[2]);

                if redis.call("exists", writerKey) == 0 then
                    return 0
                end
                
                local isNotCurrentOwner = redis.call("get", writerKey) ~= lockId
                if redis.call("get", writerKey) ~= lockId then
                    return 0
                end

                local currentExpiration = redis.call("pttl", writerKey)
                local isUnexpireable = currentExpiration == -1
                if isUnexpireable then
                    return 0
                end

                redis.call("pexpireat", writerKey, expiration)
                return 1
            `,
        });
    }

    private static _forceReleaseWriter(keyVar: string): string {
        return `
            (function(key)
                local writerKey = ${RedisSharedLockAdapter.getWriterKey("key")}

                local readerKey = ${RedisSharedLockAdapter.getReaderKey("key")}
                if redis.call("exists", readerKey) == 1 then
                    return 0
                end

                return redis.call("del", writerKey);
            end)(${keyVar});
        `;
    }

    private initForceReleaseWriterCommand(): void {
        if (
            typeof this.database.daiso_shared_lock_force_release_writer ===
            "function"
        ) {
            return;
        }
        this.database.defineCommand("daiso_shared_lock_force_release_writer", {
            numberOfKeys: 1,
            lua: `
                -- Arguments
                local key = KEYS[1];
                
                return ${RedisSharedLockAdapter._forceReleaseWriter("key")}
            `,
        });
    }

    private static getLimitKey(keyVar: string): string {
        return `
            (function(key)
                return key .. "__limit";
            end)(${keyVar});
        `;
    }

    private static removeExpiredSlots(keyVar: string, nowVar: string): string {
        return `
            (function(key, now)
                redis.call("zremrangebyscore", key, 1, now + 1);
            end)(${keyVar}, ${nowVar});
        `;
    }

    private static getOrSetLimit(
        limitKeyVar: string,
        limitVar: string,
    ): string {
        return `
            (function(limitKey, limit)
                local currentLimit = tonumber(redis.call("set", limitKey, limit, "nx", "get"));
                if currentLimit == nil then
                    currentLimit = limit;
                end
                return currentLimit;
            end)(${limitKeyVar}, ${limitVar});
        `;
    }

    private static isLimitReached(keyVar: string, limitVar: string): string {
        return `
            (function(key, limit)
                return tonumber(redis.call("zcard", key)) >= limit;
            end)(${keyVar}, ${limitVar});
        `;
    }

    private static hasSlotId(keyVar: string, slotIdVar: string): string {
        return `
            (function(key, slotId)
                return tonumber(redis.call("zscore", key, slotId)) ~= nil;
            end)(${keyVar}, ${slotIdVar});
        `;
    }

    private static addSlot(
        keyVar: string,
        slotIdVar: string,
        expirationVar: string,
    ): string {
        return `
            (function(key, slotId, expiration)
                local isSlotNotExpirable = expiration == nil;
                if isSlotNotExpirable then
                    redis.call("zadd", key, 0, slotId);
                else
                    redis.call("zadd", key, expiration, slotId);
                end
            end)(${keyVar}, ${slotIdVar}, ${expirationVar});
        `;
    }

    private static updateKeyExpiration(
        keyVar: string,
        limitKeyVar: string,
    ): string {
        return `
            (function(key, limitKey)
                local hasAtLeastOneUnexpirableSlot = tonumber(redis.call("zcount", key, 0, 0)) > 0;
                if hasAtLeastOneUnexpirableSlot then
                    redis.call("persist", key);
                    redis.call("persist", limitKey);
                    return
                end
                
                local longestExpiration = tonumber(redis.call("zrange", key, 0, 0, "BYSCORE", "REV", "WITHSCORES")[2]);
                local hasAtLeastOneExpireableSlot = longestExpiration ~= nil and longestExpiration > 0;

                if hasAtLeastOneExpireableSlot then
                    redis.call("pexpireat", key, longestExpiration);
                    redis.call("pexpireat", limitKey, longestExpiration);
                end
            end)(${keyVar}, ${limitKeyVar});
        `;
    }

    private static removeSemaphoreIfEmpty(
        keyVar: string,
        limitKeyVar: string,
    ): string {
        return `
            (function(key, limitKey)
                local slotCount = redis.call("zcard", key)
                if slotCount <= 0 then
                    redis.call("del", key)
                    redis.call("del", limitKey)
                end
            end)(${keyVar}, ${limitKeyVar});
        `;
    }

    private initAquireReaderCommand(): void {
        if (
            typeof this.database.daiso_shared_lock_acquire_reader === "function"
        ) {
            return;
        }

        this.database.defineCommand("daiso_shared_lock_acquire_reader", {
            numberOfKeys: 1,
            lua: `
                local key = KEYS[1];
                local slotId = ARGV[1];
                local limit = tonumber(ARGV[2]);
                local readerKey = ${RedisSharedLockAdapter.getReaderKey("key")}

                local writerKey = ${RedisSharedLockAdapter.getWriterKey("key")}
                if redis.call("exists", writerKey) == 1 then
                    return 0
                end

                -- Expiration time as unix timestamp in ms
                local expiration = tonumber(ARGV[3]);

                -- Current time as unix timestamp in ms
                local now = tonumber(ARGV[4]);
                
                local limitKey = ${RedisSharedLockAdapter.getLimitKey("readerKey")}
                limit = ${RedisSharedLockAdapter.getOrSetLimit("limitKey", "limit")}

                ${RedisSharedLockAdapter.removeExpiredSlots("readerKey", "now")}

                local isLimitReached = ${RedisSharedLockAdapter.isLimitReached("readerKey", "limit")}
                if isLimitReached then
                    return 0;
                end

                local hasSlotId = ${RedisSharedLockAdapter.hasSlotId("readerKey", "slotId")}
                if hasSlotId then
                    return 1;
                end

                ${RedisSharedLockAdapter.addSlot("readerKey", "slotId", "expiration")}

                ${RedisSharedLockAdapter.updateKeyExpiration("readerKey", "limitKey")}

                return 1;
            `,
        });
    }

    private initReleaseReaderCommand(): void {
        if (
            typeof this.database.daiso_shared_lock_release_reader === "function"
        ) {
            return;
        }

        this.database.defineCommand("daiso_shared_lock_release_reader", {
            numberOfKeys: 1,
            lua: `
                local key = KEYS[1];
                local lockId = ARGV[1];
                local readerKey = ${RedisSharedLockAdapter.getReaderKey("key")}
                
                local writerKey = ${RedisSharedLockAdapter.getWriterKey("key")}
                if redis.call("exists", writerKey) == 1 then
                    return 0
                end

                -- The key where the slot limit will be stored
                local limitKey = ${RedisSharedLockAdapter.getLimitKey("readerKey")}

                -- Current time as unix timestamp in ms
                local now = tonumber(ARGV[2]);

                ${RedisSharedLockAdapter.removeExpiredSlots("readerKey", "now")}

                -- Removes the given slot
                local removedCount = redis.call("zrem", readerKey, lockId);
                local hasRemoved = removedCount == 1;

                ${RedisSharedLockAdapter.removeSemaphoreIfEmpty("readerKey", "limitKey")}

                ${RedisSharedLockAdapter.updateKeyExpiration("readerKey", "limitKey")}

                return removedCount;
            `,
        });
    }

    private initRefreshReaderCommand(): void {
        if (
            typeof this.database.daiso_shared_lock_refresh_reader === "function"
        ) {
            return;
        }
        this.database.defineCommand("daiso_shared_lock_refresh_reader", {
            numberOfKeys: 1,
            lua: `
                local key = KEYS[1];
                local lockId = ARGV[1];
                local readerKey = ${RedisSharedLockAdapter.getReaderKey("key")}

                local writerKey = ${RedisSharedLockAdapter.getWriterKey("key")}
                if redis.call("exists", writerKey) == 1 then
                    return 0
                end

                -- unix timestamp in ms
                local newExpiration = tonumber(ARGV[2]);

                -- current time as unix timestamp in ms
                local now = tonumber(ARGV[3]);

                -- The key where the slot limit will be stored
                local limitKey = ${RedisSharedLockAdapter.getLimitKey("readerKey")}

                ${RedisSharedLockAdapter.removeExpiredSlots("readerKey", "now")}

                local expiration = tonumber(redis.call("zscore", readerKey, lockId));
                local isExpiredOrDoesNotExist = expiration == nil;
                if isExpiredOrDoesNotExist then
                    return 0
                end

                local isUnexpireable = expiration == 0;
                if isUnexpireable then
                    return 0
                end
                
                -- Update expiration if lockId exists
                redis.call("zadd", readerKey, "xx", newExpiration, lockId);

                local hasAtLeastOneUnexpirableSlot = tonumber(redis.call("zcount", readerKey, 0, 0)) > 0;
                local longestExpiration = tonumber(redis.call("zrange", readerKey, 0, 0, "BYSCORE", "REV", "WITHSCORES")[2]);
                if hasAtLeastOneUnexpirableSlot then
                    redis.call("persist", readerKey);
                    redis.call("persist", limitKey);
                elseif longestExpiration ~= nil and longestExpiration > 0 then
                    redis.call("pexpireat", readerKey, longestExpiration);
                    redis.call("pexpireat", limitKey, longestExpiration);
                end

                return 1
            `,
        });
    }

    private static _forceReleaseAllReaders(
        keyVar: string,
        nowVar: string,
    ): string {
        return `
            (function(key, now)
                local readerKey = ${RedisSharedLockAdapter.getReaderKey("key")}

                -- The key where the slot limit will be stored
                local limitKey = ${RedisSharedLockAdapter.getLimitKey("readerKey")}
            
                local writerKey = ${RedisSharedLockAdapter.getWriterKey("key")}
                if redis.call("exists", writerKey) == 1 then
                    return 0
                end

                ${RedisSharedLockAdapter.removeExpiredSlots("readerKey", "now")}

                local slotCount = redis.call("zcard", readerKey);
                redis.call("del", readerKey);
                redis.call("del", limitKey);
                
                local hasSlots = slotCount > 0
                if hasSlots then
                    return 1;
                end

                return 0;
            end)(${keyVar}, ${nowVar});
        `;
    }

    private initForceReleaseAllReadersCommand(): void {
        if (
            typeof this.database.daiso_shared_lock_force_release_all_readers ===
            "function"
        ) {
            return;
        }
        this.database.defineCommand(
            "daiso_shared_lock_force_release_all_readers",
            {
                numberOfKeys: 1,
                lua: `
                    local key = KEYS[1];

                    -- current time as unix timestamp in ms
                    local now = ARGV[1];

                    return ${RedisSharedLockAdapter._forceReleaseAllReaders("key", "now")}
                `,
            },
        );
    }

    private initForceReleaseCommand(): void {
        if (
            typeof this.database.daiso_shared_lock_force_release === "function"
        ) {
            return;
        }
        this.database.defineCommand("daiso_shared_lock_force_release", {
            numberOfKeys: 1,
            lua: `
                local key = KEYS[1];

                -- current time as unix timestamp in ms
                local now = ARGV[1];

                local hasReleasedReader = ${RedisSharedLockAdapter._forceReleaseAllReaders("key", "now")}
                local hasReleasedWriter = ${RedisSharedLockAdapter._forceReleaseWriter("key")}

                return hasReleasedReader == 1 or hasReleasedWriter == 1
            `,
        });
    }

    private static getWriterState(keyVar: string): string {
        return `
            (function(key)
                local writerKey = ${RedisSharedLockAdapter.getWriterKey("key")}

                if tonumber(redis.call("exists", writerKey)) == 0 then
                    return nil;
                end

                local state = {
                    owner = redis.call("get", writerKey),
                    expiration = tonumber(redis.call("pexpiretime", writerKey))
                };

                return state;
            end)(${keyVar});
        `;
    }

    private static getReaderState(keyVar: string, nowVar: string): string {
        return `
            (function(key, now)
                local readerKey = ${RedisSharedLockAdapter.getReaderKey("key")}
                
                if tonumber(redis.call("exists", readerKey)) == 0 then
                    return nil;
                end

                local limitKey = ${RedisSharedLockAdapter.getLimitKey("readerKey")}

                ${RedisSharedLockAdapter.removeExpiredSlots("readerKey", "now")}

                local limit = redis.call("get", limitKey);
                if limit == nil then
                    return nil;
                end

                local acquiredSlots = {};

                local unexpiredSlotsArr = redis.call("zrange", readerKey, now + 1, "+inf", "BYSCORE", "WITHSCORES");
                for i = 1, #unexpiredSlotsArr, 2 do
                    local member = unexpiredSlotsArr[i];
                    local score = unexpiredSlotsArr[i+1];
                    acquiredSlots[member] = tonumber(score);
                end

                local unexpireableSlotsArr = redis.call("zrange", readerKey, 0, 0, "BYSCORE", "WITHSCORES");
                for i = 1, #unexpireableSlotsArr, 2 do
                    local member = unexpireableSlotsArr[i];
                    local score = unexpireableSlotsArr[i+1];
                    acquiredSlots[member] = tonumber(score);
                end

                local isEmpty = next(acquiredSlots) == nil;
                if isEmpty then
                    return nil;
                end

                local state = {
                    limit = tonumber(limit),
                    acquiredSlots = acquiredSlots
                }

                return state;
            end)(${keyVar}, ${nowVar});
        `;
    }

    private initGetStateCommand(): void {
        if (typeof this.database.daiso_shared_lock_get_state === "function") {
            return;
        }

        this.database.defineCommand("daiso_shared_lock_get_state", {
            numberOfKeys: 1,
            lua: `
                local key = KEYS[1];
                
                -- current time as unix timestamp in ms
                local now = tonumber(ARGV[1]);

                local writerState = ${RedisSharedLockAdapter.getWriterState("key")}
                local readerState = ${RedisSharedLockAdapter.getReaderState("key", "now")}

                if writerState == nil and readerState == nil then
                    return cjson.encode(nil);
                end

                return cjson.encode({
                    writer = writerState,
                    reader = readerState
                });
            `,
        });
    }

    async acquireWriter(
        _context: IReadableContext,
        key: string,
        lockId: string,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        const result = await this.database.daiso_shared_lock_acquire_writer(
            key,
            lockId,
            ttl?.toEndDate().getTime() ?? null,
        );
        return result === 1;
    }

    async releaseWriter(
        _context: IReadableContext,
        key: string,
        lockId: string,
    ): Promise<boolean> {
        const result = await this.database.daiso_shared_lock_release_writer(
            key,
            lockId,
        );
        return result === 1;
    }

    async refreshWriter(
        _context: IReadableContext,
        key: string,
        lockId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        const result = await this.database.daiso_shared_lock_refresh_writer(
            key,
            lockId,
            ttl.toEndDate().getTime(),
        );
        return result === 1;
    }

    async forceReleaseWriter(
        _context: IReadableContext,
        key: string,
    ): Promise<boolean> {
        const result =
            await this.database.daiso_shared_lock_force_release_writer(key);
        return result === 1;
    }

    async acquireReader(settings: SharedLockAcquireSettings): Promise<boolean> {
        const { key, lockId, limit, ttl } = settings;
        const result = await this.database.daiso_shared_lock_acquire_reader(
            key,
            lockId,
            limit,
            ttl?.toEndDate().getTime() ?? null,
            Date.now(),
        );
        return result === 1;
    }

    async releaseReader(
        _context: IReadableContext,
        key: string,
        lockId: string,
    ): Promise<boolean> {
        const result = await this.database.daiso_shared_lock_release_reader(
            key,
            lockId,
            Date.now(),
        );
        return result === 1;
    }

    async refreshReader(
        _context: IReadableContext,
        key: string,
        lockId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        const result = await this.database.daiso_shared_lock_refresh_reader(
            key,
            lockId,
            ttl.toEndDate().getTime(),
            Date.now(),
        );
        return result === 1;
    }

    async forceReleaseAllReaders(
        _context: IReadableContext,
        key: string,
    ): Promise<boolean> {
        const result =
            await this.database.daiso_shared_lock_force_release_all_readers(
                key,
                Date.now(),
            );
        return result === 1;
    }

    async forceRelease(
        _context: IReadableContext,
        key: string,
    ): Promise<boolean> {
        const result = await this.database.daiso_shared_lock_force_release(
            key,
            Date.now(),
        );
        return result === 1;
    }

    async getState(
        _context: IReadableContext,
        key: string,
    ): Promise<ISharedLockAdapterState | null> {
        const json = JSON.parse(
            await this.database.daiso_shared_lock_get_state(key, Date.now()),
        ) as IRedisJsonSharedLockState | null;
        if (json === null) {
            return null;
        }

        if (json.reader === undefined && json.writer !== undefined) {
            return {
                reader: null,
                writer: {
                    owner: json.writer.owner,
                    expiration:
                        json.writer.expiration === -1
                            ? null
                            : new Date(json.writer.expiration),
                },
            };
        }

        if (json.writer === undefined && json.reader !== undefined) {
            return {
                writer: null,
                reader: {
                    limit: json.reader.limit,
                    acquiredSlots: new Map(
                        Object.entries(json.reader.acquiredSlots).map(
                            ([key, expiration]) => {
                                if (expiration === 0) {
                                    return [key, null] as const;
                                }
                                return [key, new Date(expiration)];
                            },
                        ),
                    ),
                },
            };
        }

        throw new UnexpectedError(
            "Invalid ISharedLockAdapterState, expected either the reader field must be defined or the writer field must be defined, but not both.",
        );
    }
}
