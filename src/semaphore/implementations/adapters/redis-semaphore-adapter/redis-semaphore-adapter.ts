/**
 * @module Semaphore
 */

import { type Redis, type Result } from "ioredis";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type ISemaphoreAdapter,
    type ISemaphoreAdapterState,
    type SemaphoreAcquireSettings,
} from "@/semaphore/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * @internal
 */
type IRedisJsonSemaphoreState = {
    limit: number;
    acquiredSlots: Record<string, number>;
};

declare module "ioredis" {
    interface RedisCommander<Context> {
        daiso_semaphore_acquire(
            key: string,
            slotId: string,
            limit: number,
            expiration: number | null,
            now: number,
        ): Result<1 | 0, Context>;

        daiso_semaphore_release(
            key: string,
            slotId: string,
            now: number,
        ): Result<1 | 0, Context>;

        daiso_semaphore_force_release_all(
            key: string,
            now: number,
        ): Result<1 | 0, Context>;

        daiso_semaphore_refresh(
            key: string,
            slotId: string,
            newExpiration: number,
            now: number,
        ): Result<1 | 0, Context>;

        /**
         * Returns {@link IRedisJsonSemaphoreState | `IRedisJsonSemaphoreState | null`} as json string.
         */
        daiso_semaphore_get_state(
            key: string,
            now: number,
        ): Result<string, Context>;
    }
}

// acquiredSlots: Map<string, Date | null>;

/**
 * To utilize the `RedisSemaphoreAdapter`, you must install the `"ioredis"` package.
 *
 * Note in order to use `RedisSemaphoreAdapter` correctly, ensure you use a single, consistent database across all server instances.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/redis-semaphore-adapter"`
 * @group Adapters
 */
export class RedisSemaphoreAdapter implements ISemaphoreAdapter {
    constructor(private readonly database: Redis) {
        this.initAquireCommand();
        this.initReleaseCommand();
        this.initRefreshCommand();
        this.initForceReleaseAllCommand();
        this.initGetStateCommand();
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

    private static addSlot(slotIdVar: string, expirationVar: string): string {
        return `
            (function(slotId, expiration)
                local isSlotNotExpirable = expiration == nil;
                if isSlotNotExpirable then
                    redis.call("zadd", key, 0, slotId);
                else
                    redis.call("zadd", key, expiration, slotId);
                end
            end)(${slotIdVar}, ${expirationVar});
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

    private initAquireCommand(): void {
        if (typeof this.database.daiso_semaphore_acquire === "function") {
            return;
        }

        this.database.defineCommand("daiso_semaphore_acquire", {
            numberOfKeys: 1,
            lua: `
                local key = KEYS[1];
                local slotId = ARGV[1];
                local limit = tonumber(ARGV[2]);

                -- Expiration time as unix timestamp in ms
                local expiration = tonumber(ARGV[3]);

                -- Current time as unix timestamp in ms
                local now = tonumber(ARGV[4]);
                
                local limitKey = ${RedisSemaphoreAdapter.getLimitKey("key")}
                limit = ${RedisSemaphoreAdapter.getOrSetLimit("limitKey", "limit")}

                ${RedisSemaphoreAdapter.removeExpiredSlots("key", "now")}

                local isLimitReached = ${RedisSemaphoreAdapter.isLimitReached("key", "limit")}
                if isLimitReached then
                    return 0;
                end

                local hasSlotId = ${RedisSemaphoreAdapter.hasSlotId("key", "slotId")}
                if hasSlotId then
                    return 1;
                end

                ${RedisSemaphoreAdapter.addSlot("slotId", "expiration")}

                ${RedisSemaphoreAdapter.updateKeyExpiration("key", "limitKey")}

                return 1;
            `,
        });
    }

    private initReleaseCommand(): void {
        if (typeof this.database.daiso_semaphore_release === "function") {
            return;
        }
        this.database.defineCommand("daiso_semaphore_release", {
            numberOfKeys: 1,
            lua: `
                local key = KEYS[1];
                local slotId = ARGV[1];
                -- The key where the slot limit will be stored
                local limitKey = ${RedisSemaphoreAdapter.getLimitKey("key")}

                -- Current time as unix timestamp in ms
                local now = tonumber(ARGV[2]);

                ${RedisSemaphoreAdapter.removeExpiredSlots("key", "now")}

                -- Removes the given slot
                local removedCount = redis.call("zrem", key, slotId);
                local hasRemoved = removedCount == 1;

                ${RedisSemaphoreAdapter.removeSemaphoreIfEmpty("key", "limitKey")}

                ${RedisSemaphoreAdapter.updateKeyExpiration("key", "limitKey")}

                return hasRemoved;
            `,
        });
    }

    private initForceReleaseAllCommand(): void {
        if (
            typeof this.database.daiso_semaphore_force_release_all ===
            "function"
        ) {
            return;
        }

        this.database.defineCommand("daiso_semaphore_force_release_all", {
            numberOfKeys: 1,
            lua: `
                local key = KEYS[1];

                -- current time as unix timestamp in ms
                local now = ARGV[1];

                -- The key where the slot limit will be stored
                local limitKey = ${RedisSemaphoreAdapter.getLimitKey("key")}
            
                ${RedisSemaphoreAdapter.removeExpiredSlots("key", "now")}

                local slotCount = redis.call("zcard", key);
                redis.call("del", key);
                redis.call("del", limitKey);
                
                local hasSlots = slotCount > 0
                if hasSlots then
                    return 1;
                end

                return 0;
            `,
        });
    }

    private initRefreshCommand(): void {
        if (typeof this.database.daiso_semaphore_refresh === "function") {
            return;
        }

        this.database.defineCommand("daiso_semaphore_refresh", {
            numberOfKeys: 1,
            lua: `
                local key = KEYS[1];
                local slotId = ARGV[1];

                -- unix timestamp in ms
                local newExpiration = tonumber(ARGV[2]);

                -- current time as unix timestamp in ms
                local now = tonumber(ARGV[3]);

                -- The key where the slot limit will be stored
                local limitKey = ${RedisSemaphoreAdapter.getLimitKey("key")}

                ${RedisSemaphoreAdapter.removeExpiredSlots("key", "now")}

                local expiration = tonumber(redis.call("zscore", key, slotId));
                local isExpiredOrDoesNotExist = expiration == nil;
                if isExpiredOrDoesNotExist then
                    return 0
                end

                local isUnexpireable = expiration == 0;
                if isUnexpireable then
                    return 0
                end
                
                -- Update expiration if slotId exists
                redis.call("zadd", key, "xx", newExpiration, slotId);

                local hasAtLeastOneUnexpirableSlot = tonumber(redis.call("zcount", key, 0, 0)) > 0;
                local longestExpiration = tonumber(redis.call("zrange", key, 0, 0, "BYSCORE", "REV", "WITHSCORES")[2]);
                if hasAtLeastOneUnexpirableSlot then
                    redis.call("persist", key);
                    redis.call("persist", limitKey);
                elseif longestExpiration ~= nil and longestExpiration > 0 then
                    redis.call("pexpireat", key, longestExpiration);
                    redis.call("pexpireat", limitKey, longestExpiration);
                end

                return 1
            `,
        });
    }

    private initGetStateCommand(): void {
        if (typeof this.database.daiso_semaphore_get_state === "function") {
            return;
        }

        this.database.defineCommand("daiso_semaphore_get_state", {
            numberOfKeys: 1,
            lua: `
                local key = KEYS[1];
                
                -- current time as unix timestamp in ms
                local now = tonumber(ARGV[1]);

                local limitKey = ${RedisSemaphoreAdapter.getLimitKey("key")}

                ${RedisSemaphoreAdapter.removeExpiredSlots("key", "now")}

                local limit = redis.call("get", limitKey);
                if limit == nil then
                    return cjson.encode(nil);
                end

                local acquiredSlots = {};

                local unexpiredSlotsArr = redis.call("zrange", key, now + 1, "+inf", "BYSCORE", "WITHSCORES");
                for i = 1, #unexpiredSlotsArr, 2 do
                    local member = unexpiredSlotsArr[i];
                    local score = unexpiredSlotsArr[i+1];
                    acquiredSlots[member] = tonumber(score);
                end

                local unexpireableSlotsArr = redis.call("zrange", key, 0, 0, "BYSCORE", "WITHSCORES");
                for i = 1, #unexpireableSlotsArr, 2 do
                    local member = unexpireableSlotsArr[i];
                    local score = unexpireableSlotsArr[i+1];
                    acquiredSlots[member] = tonumber(score);
                end

                local isEmpty = next(acquiredSlots) == nil;
                if isEmpty then
                    return cjson.encode(nil);
                end

                local state = {
                    limit = tonumber(limit),
                    acquiredSlots = acquiredSlots
                }

                return cjson.encode(state);
            `,
        });
    }

    async acquire(settings: SemaphoreAcquireSettings): Promise<boolean> {
        const { key, slotId, limit, ttl } = settings;
        const result = await this.database.daiso_semaphore_acquire(
            key,
            slotId,
            limit,
            ttl?.toEndDate().getTime() ?? null,
            Date.now(),
        );
        return result === 1;
    }

    async release(
        _context: IReadableContext,
        key: string,
        slotId: string,
    ): Promise<boolean> {
        const result = await this.database.daiso_semaphore_release(
            key,
            slotId,
            Date.now(),
        );
        return result === 1;
    }

    async forceReleaseAll(
        _context: IReadableContext,
        key: string,
    ): Promise<boolean> {
        const hasDeleted =
            await this.database.daiso_semaphore_force_release_all(
                key,
                Date.now(),
            );
        return hasDeleted === 1;
    }

    async refresh(
        _context: IReadableContext,
        key: string,
        slotId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        const result = await this.database.daiso_semaphore_refresh(
            key,
            slotId,
            ttl.toEndDate().getTime(),
            Date.now(),
        );
        return result === 1;
    }

    async getState(
        _context: IReadableContext,
        key: string,
    ): Promise<ISemaphoreAdapterState | null> {
        const json = JSON.parse(
            await this.database.daiso_semaphore_get_state(key, Date.now()),
        ) as IRedisJsonSemaphoreState | null;
        if (json === null) {
            return null;
        }
        return {
            limit: json.limit,
            acquiredSlots: new Map(
                Object.entries(json.acquiredSlots).map(([key, expiration]) => {
                    if (expiration === 0) {
                        return [key, null] as const;
                    }
                    return [key, new Date(expiration)];
                }),
            ),
        };
    }
}
