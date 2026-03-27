/**
 * @module SharedLock
 */

import { type ISharedLockFactory } from "@/shared-lock/contracts/shared-lock-factory.contract.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    UnregisteredAdapterError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    DefaultAdapterNotDefinedError,
} from "@/utilities/_module.js";

/**
 * The `ISharedLockFactoryResolver` contract makes it easy to configure and switch between different {@link ISharedLockFactory | `ISharedLockFactory`} dynamically.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockFactoryResolver<TAdapters extends string = string> = {
    /**
     * The `use` method will throw an error if you provide it unregisted adapter.
     * If no default adapter is defined an error will be thrown by `use` method.
     * @throws {UnregisteredAdapterError} {@link UnregisteredAdapterError}
     * @throws {DefaultAdapterNotDefinedError} {@link DefaultAdapterNotDefinedError}
     */
    use(adapterName?: TAdapters): ISharedLockFactory;
};
