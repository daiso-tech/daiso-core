/**
 * @module RateLimiter
 */

import { type IRateLimiterFactory } from "@/rate-limiter/contracts/rate-limiter-factory.contract.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    UnregisteredAdapterError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    DefaultAdapterNotDefinedError,
} from "@/utilities/_module.js";

/**
 * The `IRateLimiterFactoryResolver` contract makes it easy to configure and switch between different {@link IRateLimiterFactory | `IRateLimiterFactory`} dynamically.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterFactoryResolver<TAdapters extends string = string> = {
    /**
     * The `use` method will throw an error if you provide it unregisted adapter.
     * If no default adapter is defined an error will be thrown by `use` method.
     * @throws {UnregisteredAdapterError} {@link UnregisteredAdapterError}
     * @throws {DefaultAdapterNotDefinedError} {@link DefaultAdapterNotDefinedError}
     */
    use(adapterName?: TAdapters): IRateLimiterFactory;
};
