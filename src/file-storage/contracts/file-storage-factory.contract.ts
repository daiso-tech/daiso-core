/**
 * @module FileStorage
 */

import { type IFileStorage } from "@/file-storage/contracts/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    UnregisteredAdapterError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    DefaultAdapterNotDefinedError,
} from "@/utilities/_module.js";

/**
 * The `IFileStorageFactory` contract makes it easy to configure and switch between different {@link IFileStorage | `IFileStorage`} dynamically.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IFileStorageFactory<TAdapters extends string = string> = {
    /**
     * The `use` method will throw an error if you provide it unregisted adapter.
     * If no default adapter is defined an error will be thrown.
     * @throws {UnregisteredAdapterError} {@link UnregisteredAdapterError}
     * @throws {DefaultAdapterNotDefinedError} {@link DefaultAdapterNotDefinedError}
     */
    use(adapterName?: TAdapters): IFileStorage;
};
