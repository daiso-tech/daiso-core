/**
 * @module Cache
 */

import { type ICache } from "@/cache/contracts/cache.contract.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    UnregisteredAdapterError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    DefaultAdapterNotDefinedError,
} from "@/utilities/_module.js";

/**
 * The `ICacheResolver` contract makes it easy to configure and switch between different {@link ICache | `ICache`} dynamically.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type ICacheResolver<
    TAdapters extends string = string,
    TType = unknown,
> = {
    /**
     * The `use` method will throw an error if you provide it unregisted adapter.
     * If no default adapter is defined an error will be thrown.
     * @throws {UnregisteredAdapterError} {@link UnregisteredAdapterError}
     * @throws {DefaultAdapterNotDefinedError} {@link DefaultAdapterNotDefinedError}
     */
    use(adapterName?: TAdapters): ICache<TType>;
};
