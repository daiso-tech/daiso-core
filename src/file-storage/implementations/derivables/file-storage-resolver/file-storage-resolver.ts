/**
 * @module FileStorage
 */

import { type IEventBus } from "@/event-bus/contracts/_module.js";
import {
    type IFileStorage,
    type ISignedFileStorageAdapter,
    type IFileStorageResolver,
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
export type FileStorageResolverSettings<TAdapters extends string = string> =
    FileStorageSettingsBase & {
        adapters: FileStorageAdapters<TAdapters>;

        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage"`
 * @group Derivables
 */
export class FileStorageResolver<TAdapters extends string = string>
    implements IFileStorageResolver<TAdapters>
{
    /**
     * @example
     * ```ts
     * import { FileStorageResolver } from "@daiso-tech/core/file-storage";
     * import { FsFileStorageAdapter } from "@daiso-tech/core/file-storage/fs-file-storage-adapter";
     * import { MemoryFileStorageAdapter } from "@daiso-tech/core/file-storage/memory-file-storage-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const fileStorageResolver = new FileStorageResolver({
     *   serde,
     *   adapters: {
     *     memory: new MemoryFileStorageAdapter(),
     *     fs: new FsFileStorageAdapter(),
     *   },
     *   defaultAdapter: "memory"
     * })
     * ```
     */
    constructor(
        private readonly settings: FileStorageResolverSettings<TAdapters>,
    ) {}

    setNamespace(namespace: INamespace): FileStorageResolver<TAdapters> {
        return new FileStorageResolver({
            ...this.settings,
            namespace,
        });
    }

    setEventBus(eventBus: IEventBus): FileStorageResolver<TAdapters> {
        return new FileStorageResolver({
            ...this.settings,
            eventBus,
        });
    }

    setDefaultContentType(contentType: string): FileStorageResolver<TAdapters> {
        return new FileStorageResolver({
            ...this.settings,
            defaultContentType: contentType,
        });
    }

    setDefaultContentDisposition(
        contentDisposition: string | null,
    ): FileStorageResolver<TAdapters> {
        return new FileStorageResolver({
            ...this.settings,
            defaultContentDisposition: contentDisposition,
        });
    }

    setDefaultContentEncoding(
        contentEncoding: string | null,
    ): FileStorageResolver<TAdapters> {
        return new FileStorageResolver({
            ...this.settings,
            defaultContentEncoding: contentEncoding,
        });
    }

    setDefaultCacheControl(
        cacheControl: string | null,
    ): FileStorageResolver<TAdapters> {
        return new FileStorageResolver({
            ...this.settings,
            defaultCacheControl: cacheControl,
        });
    }

    setDefaultContentLanguage(
        contentLanguage: string | null,
    ): FileStorageResolver<TAdapters> {
        return new FileStorageResolver({
            ...this.settings,
            defaultContentLanguage: contentLanguage,
        });
    }

    setUrlAdapter(
        urlAdapter: Partial<IFileUrlAdapter>,
    ): FileStorageResolver<TAdapters> {
        return new FileStorageResolver({
            ...this.settings,
            urlAdapter,
        });
    }

    setOnlyLowercase(onlyLowercase: boolean): FileStorageResolver<TAdapters> {
        return new FileStorageResolver({
            ...this.settings,
            onlyLowercase,
        });
    }

    setKeyValidator(
        keyValidator: FileKeyValidator,
    ): FileStorageResolver<TAdapters> {
        return new FileStorageResolver({
            ...this.settings,
            keyValidator,
        });
    }

    use(adapterName?: TAdapters): IFileStorage {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(FileStorageResolver.name);
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
