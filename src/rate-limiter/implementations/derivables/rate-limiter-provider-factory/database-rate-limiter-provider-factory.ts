/**
 * @module RateLimiter
 */

import { type BackoffPolicy } from "@/backoff-policies/_module.js";
import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import {
    type IRateLimiterProviderFactory,
    type IRateLimiterProvider,
    type IRateLimiterStorageAdapter,
    type IRateLimiterPolicy,
} from "@/rate-limiter/contracts/_module.js";
import { DatabaseRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/database-rate-limiter-adapter/_module.js";
import {
    RateLimiterProvider,
    type RateLimiterProviderSettingsBase,
} from "@/rate-limiter/implementations/derivables/rate-limiter-provider/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    UnregisteredAdapterError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    DefaultAdapterNotDefinedError,
    type ErrorPolicy,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter"`
 * @group Derivables
 */
export type DatabaseRateLimiterAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, IRateLimiterStorageAdapter>
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter"`
 * @group Derivables
 */
export type DatabaseRateLimiterProviderFactorySettings<
    TAdapters extends string,
> = RateLimiterProviderSettingsBase & {
    adapters: DatabaseRateLimiterAdapters<TAdapters>;

    defaultAdapter?: NoInfer<TAdapters>;

    /**
     * @default
     * ```ts
     * import { exponentialBackoff } from "@daiso-tech/core/backoff-policies";
     *
     * exponentialBackoff();
     * ```
     */
    backoffPolicy?: BackoffPolicy;

    /**
     * @default
     * ```ts
     * import { ConsecutiveBreaker } from "@daiso-tech/core/rate-limiter/policies";
     *
     * new ConsecutiveBreaker({ failureThreshold: 5 });
     * ```
     */
    rateLimiterPolicy?: IRateLimiterPolicy;
};

/**
 * The `DatabaseRateLimiterProviderFactory` class is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter"`
 * @group Derivables
 */
export class DatabaseRateLimiterProviderFactory<TAdapters extends string>
    implements IRateLimiterProviderFactory<TAdapters>
{
    /**
     * @example
     * ```ts
     * import { RateLimiterProviderFactory } from "@daiso-tech/core/rate-limiter";
     * import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storate-adapter";
     * import { KyselyRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/kysely-rate-limiter-storate-adapter";
     * import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const rateLimiterProviderFactory = new RateLimiterProviderFactory({
     *   serde,
     *   adapters: {
     *     memory: new MemoryRateLimiterStorageAdapter(),
     *     sqlite: new KyselyRateLimiterStorageAdapter({
     *       kysely: new Kysely({
     *         dialect: new SqliteDialect({
     *           database: new Sqlite("local.db"),
     *         }),
     *       }),
     *       serde,
     *     }),
     *   },
     *   defaultAdapter: "memory",
     * });
     * ```
     */
    constructor(
        private readonly settings: DatabaseRateLimiterProviderFactorySettings<TAdapters>,
    ) {}

    setNamespace(
        namespace: INamespace,
    ): DatabaseRateLimiterProviderFactory<TAdapters> {
        return new DatabaseRateLimiterProviderFactory({
            ...this.settings,
            namespace,
        });
    }

    setEventBus(
        eventBus: IEventBus,
    ): DatabaseRateLimiterProviderFactory<TAdapters> {
        return new DatabaseRateLimiterProviderFactory({
            ...this.settings,
            eventBus,
        });
    }

    setOnlyError(
        onlyError?: boolean,
    ): DatabaseRateLimiterProviderFactory<TAdapters> {
        return new DatabaseRateLimiterProviderFactory({
            ...this.settings,
            onlyError,
        });
    }

    setDefaultErrorPolicy(
        errorPolicy: ErrorPolicy,
    ): DatabaseRateLimiterProviderFactory<TAdapters> {
        return new DatabaseRateLimiterProviderFactory({
            ...this.settings,
            defaultErrorPolicy: errorPolicy,
        });
    }

    setBackoffPolicy(
        backoffPolicy?: BackoffPolicy,
    ): DatabaseRateLimiterProviderFactory<TAdapters> {
        return new DatabaseRateLimiterProviderFactory({
            ...this.settings,
            backoffPolicy,
        });
    }

    setRateLimiterPolicy(
        rateLimiterPolicy?: IRateLimiterPolicy,
    ): DatabaseRateLimiterProviderFactory<TAdapters> {
        return new DatabaseRateLimiterProviderFactory({
            ...this.settings,
            rateLimiterPolicy,
        });
    }

    /**
     * @example
     * ```ts
     * import { RateLimiterProviderFactory } from "@daiso-tech/core/rate-limiter";
     * import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storate-adapter";
     * import { KyselyRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/kysely-rate-limiter-storate-adapter";
     * import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const rateLimiterProviderFactory = new RateLimiterProviderFactory({
     *   serde,
     *   adapters: {
     *     memory: new MemoryRateLimiterStorageAdapter(),
     *     sqlite: new KyselyRateLimiterStorageAdapter({
     *       kysely: new Kysely({
     *         dialect: new SqliteDialect({
     *           database: new Sqlite("local.db"),
     *         }),
     *       }),
     *       serde,
     *     }),
     *   },
     *   defaultAdapter: "memory",
     * });
     *
     * // Will apply rate limiter logic the default adapter which is MemoryRateLimiterStorageAdapter
     * await rateLimiterProviderFactory
     *   .use()
     *   .create("a")
     *   .runOrFail(async () => {
     *     // ... code to apply rate limiter logic
     *   });
     *
     * // Will apply rate limiter logic the default adapter which is KyselyRateLimiterStorageAdapter
     * await rateLimiterProviderFactory
     *   .use("sqlite")
     *   .create("a")
     *   .runOrFail(async () => {
     *     // ... code to apply rate limiter logic
     *   });
     * ```
     */
    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): IRateLimiterProvider {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                DatabaseRateLimiterProviderFactory.name,
            );
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(adapterName);
        }
        return new RateLimiterProvider({
            ...this.settings,
            adapter: new DatabaseRateLimiterAdapter({
                adapter,
            }),
        });
    }
}
