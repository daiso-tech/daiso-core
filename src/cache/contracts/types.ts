/**
 * @module Cache
 */

import { type ICacheAdapter } from "@/cache/contracts/cache-adapter.contract.js";
import { type ICacheBase } from "@/cache/contracts/cache.contract.js";
import { type IDatabaseCacheAdapter } from "@/cache/contracts/database-cache-adapter.contract.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type CacheAdapterVariants<TType = unknown> =
    | ICacheAdapter<TType>
    | IDatabaseCacheAdapter<TType>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type CacheVariants<TType = unknown> =
    | ICacheBase<TType>
    | CacheAdapterVariants<TType>;
