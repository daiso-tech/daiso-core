/**
 * @module FileStorage
 */

import { type IEventBus } from "@/event-bus/contracts/_module.js";
import {
    type IFileStorage,
    type ISignedFileStorageAdapter,
    type IFileStorageFactory,
    type IFileUrlAdapter,
} from "@/file-storage/contracts/_module.js";
import {
    FileStorage,
    type FileKeyValidator,
    type FileStorageSettingsBase,
} from "@/file-storage/implementations/derivables/file-storage/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage"`
 * @group Derivables
 */
export type FileStorageAdapters<TAdapters extends string = string> = Partial<
    Record<TAdapters, ISignedFileStorageAdapter>
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage"`
 * @group Derivables
 */
export type FileStorageFactorySettings<TAdapters extends string = string> =
    FileStorageSettingsBase & {
        adapters: FileStorageAdapters<TAdapters>;

        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage"`
 * @group Derivables
 */
export class FileStorageFactory<TAdapters extends string = string>
    implements IFileStorageFactory<TAdapters>
{
    constructor(
        private readonly settings: FileStorageFactorySettings<TAdapters>,
    ) {}

    setNamespace(namespace: INamespace): FileStorageFactory<TAdapters> {
        return new FileStorageFactory({
            ...this.settings,
            namespace,
        });
    }

    setEventBus(eventBus: IEventBus): FileStorageFactory<TAdapters> {
        return new FileStorageFactory({
            ...this.settings,
            eventBus,
        });
    }

    setDefaultContentType(contentType: string): FileStorageFactory<TAdapters> {
        return new FileStorageFactory({
            ...this.settings,
            defaultContentType: contentType,
        });
    }

    setDefaultContentDisposition(
        contentDisposition: string | null,
    ): FileStorageFactory<TAdapters> {
        return new FileStorageFactory({
            ...this.settings,
            defaultContentDisposition: contentDisposition,
        });
    }

    setDefaultContentEncoding(
        contentEncoding: string | null,
    ): FileStorageFactory<TAdapters> {
        return new FileStorageFactory({
            ...this.settings,
            defaultContentEncoding: contentEncoding,
        });
    }

    setDefaultCacheControl(
        cacheControl: string | null,
    ): FileStorageFactory<TAdapters> {
        return new FileStorageFactory({
            ...this.settings,
            defaultCacheControl: cacheControl,
        });
    }

    setDefaultContentLanguage(
        contentLanguage: string | null,
    ): FileStorageFactory<TAdapters> {
        return new FileStorageFactory({
            ...this.settings,
            defaultContentLanguage: contentLanguage,
        });
    }

    setUrlAdapter(
        urlAdapter: Partial<IFileUrlAdapter>,
    ): FileStorageFactory<TAdapters> {
        return new FileStorageFactory({
            ...this.settings,
            urlAdapter,
        });
    }

    setOnlyLowercase(onlyLowercase: boolean): FileStorageFactory<TAdapters> {
        return new FileStorageFactory({
            ...this.settings,
            onlyLowercase,
        });
    }

    setKeyValidator(
        keyValidator: FileKeyValidator,
    ): FileStorageFactory<TAdapters> {
        return new FileStorageFactory({
            ...this.settings,
            keyValidator,
        });
    }

    use(adapterName?: TAdapters): IFileStorage {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(FileStorageFactory.name);
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(adapterName);
        }
        return new FileStorage({
            ...this.settings,
            adapter,
            serdeTransformerName: adapterName,
        });
    }
}
