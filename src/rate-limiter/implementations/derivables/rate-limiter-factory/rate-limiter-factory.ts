/**
 * @module RateLimiter
 */

import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { NoOpNamespace } from "@/namespace/implementations/_module.js";
import {
    type IRateLimiter,
    type IRateLimiterAdapter,
    type IRateLimiterListenable,
    type IRateLimiterFactory,
    type RateLimiterEventMap,
    type RateLimiterFactoryCreateSettings,
} from "@/rate-limiter/contracts/_module.js";
import { RateLimiterSerdeTransformer } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter-serde-transformer.js";
import { RateLimiter } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter.js";
import { type ISerderRegister } from "@/serde/contracts/_module.js";
import { NoOpSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import {
    CORE,
    defaultWaitUntil,
    resolveOneOrMore,
    type ErrorPolicy,
    type OneOrMore,
    type WaitUntil,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter"`
 * @group Derivables
 */
export type RateLimiterFactorySettingsBase = {
    /**
     * @default
     * ```ts
     * import { NoOpNamespace } from "@daiso-tech/core/namespace";
     *
     * new NoOpNamespace()
     * ```
     */
    namespace?: INamespace;

    /**
     * @default
     * ```ts
     * import { EventBus } from "@daiso-tech/core/event-bus";
     * import { NoOpEventBusAdapter } from "@daiso-tech/core/event-bus/no-op-event-bus-adapter";
     *
     * new EventBus({
     *   adapter: new NoOpEventBusAdapter()
     * })
     * ```
     */
    eventBus?: IEventBus;

    /**
     * You can set the default `ErrorPolicy`
     *
     * @default
     * ```ts
     * (_error: unknown) => true
     * ```
     */
    defaultErrorPolicy?: ErrorPolicy;

    /**
     * If true will only apply rate limiting when function errors and not when function is called.
     * @default false
     */
    onlyError?: boolean;

    /**
     * If true, metric tracking will run asynchronously in the background and won't block the function utilizing the circuit breaker logic.
     * This will only have effect if `onlyError` settings is true.
     * @default true
     */
    enableAsyncTracking?: boolean;

    /**
     * @default
     * ```ts
     * import { Serde } from "@daiso-tech/serde";
     * import { NoOpSerdeAdapter } from "@daiso-tech/serde/no-op-serde-adapter";
     *
     * new Serde(new NoOpSerdeAdapter())
     * ```
     */
    serde?: OneOrMore<ISerderRegister>;

    /**
     * @default ""
     */
    serdeTransformerName?: string;

    /**
     * You can pass the `waitUntil` function to handle background promises.
     * This is required when working with environments like Cloudflare Workers or Vercel Functions to ensure tasks complete after the response is sent.
     * @default
     * ```ts
     * import { defaultWaitUntil } from "@daiso-tech/core/utilities"
     * ```
     */
    waitUntil?: WaitUntil;

    /**
     * @default
     * ```ts
     * import { ExecutionContext } from "@daiso-tech/core/execution-context"
     * import { NoOpExecutionContextAdapter } from "@daiso-tech/core/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    executionContext?: IExecutionContext;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter"`
 * @group Derivables
 */
export type RateLimiterFactorySettings = RateLimiterFactorySettingsBase & {
    adapter: IRateLimiterAdapter;
};

/**
 * The `RateLimiterFactory` class can be derived from any {@link IRateLimiterAdapter | `IRateLimiterAdapter`}.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter"`
 * @group Derivables
 */
export class RateLimiterFactory implements IRateLimiterFactory {
    private readonly namespace: INamespace;
    private readonly eventBus: IEventBus<RateLimiterEventMap>;
    private readonly adapter: IRateLimiterAdapter;
    private readonly onlyError: boolean;
    private readonly defaultErrorPolicy: ErrorPolicy;
    private readonly enableAsyncTracking: boolean;
    private readonly serde: OneOrMore<ISerderRegister>;
    private readonly serdeTransformerName: string;
    private readonly waitUntil: WaitUntil;
    private readonly executionContext: IExecutionContext;

    /**
     * @example
     * ```ts
     * import { KyselyRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/kysely-rate-limiter-storage-adapter";
     * import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter"
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const rateLimiterStorageAdapter = new KyselyRateLimiterStorageAdapter({
     *   kysely: new Kysely({
     *     dialect: new SqliteDialect({
     *       database: new Sqlite("local.db"),
     *     }),
     *   }),
     *   serde
     * });
     * // You need initialize the adapter once before using it.
     * await rateLimiterStorageAdapter.init();
     *
     * const rateLimiterAdapter = new DatabaseRateLimiterAdapter({
     *   adapter: rateLimiterStorageAdapter
     * });
     *
     * const rateLimiterFactory = new RateLimiterFactory({
     *   adapter: rateLimiterAdapter
     * })
     * ```
     */
    constructor(settings: RateLimiterFactorySettings) {
        const {
            enableAsyncTracking = true,
            namespace = new NoOpNamespace(),
            eventBus = new EventBus({
                adapter: new NoOpEventBusAdapter(),
            }),
            adapter,
            onlyError = false,
            defaultErrorPolicy = () => true,
            serde = new Serde(new NoOpSerdeAdapter()),
            serdeTransformerName = "",
            waitUntil = defaultWaitUntil,
            executionContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        } = settings;

        this.executionContext = executionContext;
        this.waitUntil = waitUntil;
        this.serdeTransformerName = serdeTransformerName;
        this.enableAsyncTracking = enableAsyncTracking;
        this.namespace = namespace;
        this.eventBus = eventBus;
        this.adapter = adapter;
        this.onlyError = onlyError;
        this.defaultErrorPolicy = defaultErrorPolicy;
        this.serde = serde;
        this.registerToSerde();
    }

    private registerToSerde(): void {
        const transformer = new RateLimiterSerdeTransformer({
            executionContext: this.executionContext,
            waitUntil: this.waitUntil,
            enableAsyncTracking: this.enableAsyncTracking,
            namespace: this.namespace,
            eventBus: this.eventBus,
            adapter: this.adapter,
            onlyError: this.onlyError,
            errorPolicy: this.defaultErrorPolicy,
            serdeTransformerName: this.serdeTransformerName,
        });
        for (const serde of resolveOneOrMore(this.serde)) {
            serde.registerCustom(transformer, CORE);
        }
    }

    get events(): IRateLimiterListenable {
        return this.eventBus;
    }

    create(
        key: string,
        settings: RateLimiterFactoryCreateSettings,
    ): IRateLimiter {
        const {
            errorPolicy = this.defaultErrorPolicy,
            onlyError = this.onlyError,
            limit,
        } = settings;
        return new RateLimiter({
            executionContext: this.executionContext,
            limit,
            waitUntil: this.waitUntil,
            enableAsyncTracking: this.enableAsyncTracking,
            eventDispatcher: this.eventBus,
            adapter: this.adapter,
            key: this.namespace.create(key),
            errorPolicy,
            onlyError,
            serdeTransformerName: this.serdeTransformerName,
            namespace: this.namespace,
        });
    }
}
