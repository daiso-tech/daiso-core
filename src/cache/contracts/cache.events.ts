/**
 * @module Cache
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type IKey } from "@/namespace/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * The event is dispatched when key is found.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Events
 */
export type FoundCacheEvent<TType = unknown> = {
    key: IKey;
    value: TType;
};

/**
 * The event is dispatched when key is not found.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Events
 */
export type NotFoundCacheEvent = {
    key: IKey;
};

/**
 * The event is dispatched when key is added.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Events
 */
export type AddedCacheEvent<TType = unknown> = {
    key: IKey;
    value: TType;
    ttl: TimeSpan | null;
};

/**
 * The event is dispatched when trying to add an key that exists.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Events
 */
export type KeyExistsCacheEvent = {
    key: IKey;
};

/**
 * The event is dispatched when key is updated.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Events
 */
export type UpdatedCacheEvent<TType = unknown> = {
    key: IKey;
    value: TType;
};

/**
 * The event is dispatched when key is removed.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Events
 */
export type RemovedCacheEvent = {
    key: IKey;
};

/**
 * The event is dispatched when key is incremented.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Events
 */
export type IncrementedCacheEvent = {
    key: IKey;
    value: number;
};

/**
 * The event is dispatched when key is decremented.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Events
 */
export type DecrementedCacheEvent = {
    key: IKey;
    value: number;
};

/**
 * The event is dispatched when all keys all cleared of the cache.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Events
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ClearedCacheEvent = {};

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Events
 */
export type UnexpectedErrorCacheEvent = {
    keys?: Array<string>;
    value?: unknown;
    method: string;
    error: unknown;
};

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Events
 */
export const CACHE_EVENTS = {
    FOUND: "FOUND",
    NOT_FOUND: "NOT_FOUND",
    ADDED: "ADDED",
    KEY_EXISTS: "KEY_EXISTS",
    UPDATED: "UPDATED",
    REMOVED: "REMOVED",
    INCREMENTED: "INCREMENTED",
    DECREMENTED: "DECREMENTED",
    CLEARED: "CLEARED",
    UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
} as const;

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Events
 */
export type CacheEventMap<TType = unknown> = {
    [CACHE_EVENTS.FOUND]: FoundCacheEvent<TType>;
    [CACHE_EVENTS.NOT_FOUND]: NotFoundCacheEvent;
    [CACHE_EVENTS.ADDED]: AddedCacheEvent<TType>;
    [CACHE_EVENTS.KEY_EXISTS]: KeyExistsCacheEvent;
    [CACHE_EVENTS.UPDATED]: UpdatedCacheEvent<TType>;
    [CACHE_EVENTS.REMOVED]: RemovedCacheEvent;
    [CACHE_EVENTS.INCREMENTED]: IncrementedCacheEvent;
    [CACHE_EVENTS.DECREMENTED]: DecrementedCacheEvent;
    [CACHE_EVENTS.CLEARED]: ClearedCacheEvent;
    [CACHE_EVENTS.UNEXPECTED_ERROR]: UnexpectedErrorCacheEvent;
};
