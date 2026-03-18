/**
 * @module Cache
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

import {
    type CacheAdapterVariants,
    type ICache,
    type ICacheFactory,
} from "@/cache/contracts/_module.js";
import {
    Cache,
    type CacheSettingsBase,
} from "@/cache/implementations/derivables/cache/_module.js";
import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache"`
 * @group Derivables
 */
export type CacheAdapters<TAdapters extends string = string> = Partial<
    Record<TAdapters, CacheAdapterVariants<any>>
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache"`
 * @group Derivables
 */
export type CacheFactorySettings<
    TAdapters extends string = string,
    TType = unknown,
> = CacheSettingsBase<TType> & {
    adapters: CacheAdapters<TAdapters>;

    defaultAdapter?: NoInfer<TAdapters>;
};

/**
 * The `CacheFactory` class is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache"`
 * @group Derivables
 */
export class CacheFactory<TAdapters extends string = string, TType = unknown>
    implements ICacheFactory<TAdapters, TType>
{
    /**
     * @example
     * ```ts
     * import { CacheFactory } from "@daiso-tech/core/cache";
     * import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
     * import { RedisCacheAdapter } from "@daiso-tech/core/cache/redis-cache-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import type { ISerde } from "@daiso-tech/core/serde/contracts";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Redis from "ioredis"
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const cacheFactory = new CacheFactory({
     *   adapters: {
     *     memory: new MemoryCacheAdapter(),
     *     redis: new RedisCacheAdapter({
     *       database: new Redis("YOUR_REDIS_CONNECTION"),
     *       serde,
     *     }),
     *   },
     *   defaultAdapter: "memory",
     * });
     */
    constructor(
        private readonly settings: CacheFactorySettings<TAdapters, TType>,
    ) {}

    setNamespace(namespace: INamespace): CacheFactory<TAdapters, TType> {
        return new CacheFactory({
            ...this.settings,
            namespace,
        });
    }

    setDefaultTtl(ttl: ITimeSpan): CacheFactory<TAdapters, TType> {
        return new CacheFactory({
            ...this.settings,
            defaultTtl: ttl,
        });
    }

    setEventBus(eventBus: IEventBus): CacheFactory<TAdapters, TType> {
        return new CacheFactory({
            ...this.settings,
            eventBus,
        });
    }

    setSchema<TSchemaOutputType>(
        schema: StandardSchemaV1<TSchemaOutputType>,
    ): CacheFactory<TAdapters, TSchemaOutputType> {
        return new CacheFactory({
            ...this.settings,
            schema,
        });
    }

    setType<TOutputType>(): CacheFactory<TAdapters, TOutputType> {
        return new CacheFactory(
            this.settings as CacheFactorySettings<TAdapters, TOutputType>,
        );
    }

    setJitter(jitter: number): CacheFactory<TAdapters, TType> {
        return new CacheFactory({
            ...this.settings,
            defaultJitter: jitter,
        });
    }

    /**
     * @example
     * ```ts
     * import { CacheFactory } from "@daiso-tech/core/cache";
     * import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
     * import { RedisCacheAdapter } from "@daiso-tech/core/cache/redis-cache-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import type { ISerde } from "@daiso-tech/core/serde/contracts";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import { TimeSpan } from "@daiso-tech/core/time-span" from "@daiso-tech/core/time-span";
     * import Redis from "ioredis"
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const cacheFactory = new CacheFactory({
     *   adapters: {
     *     memory: new MemoryCacheAdapter(),
     *     redis: new RedisCacheAdapter({
     *       database: new Redis("YOUR_REDIS_CONNECTION"),
     *       serde,
     *     }),
     *   },
     *   defaultAdapter: "memory",
     * });
     *
     * // Will add key to cache using the default adapter which is MemoryCacheAdapter
     * await cacheFactory
     *   .use()
     *   .add("a", 1);
     *
     * // Will add key to cache using the redis adapter
     * await cacheFactory
     *   .use("redis")
     *   .add("a", 1);
     *
     * // You can change the default settings of the returned Cache instance.
     * await cacheFactory
     *   .setDefaultTtl(TimeSpan.fromMinutes(2))
     *   .use("sqlite")
     *   .add("a", 1);
     * ```
     */
    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): ICache<TType> {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(CacheFactory.name);
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(adapterName);
        }
        return new Cache({
            ...this.settings,
            adapter,
        });
    }
}
