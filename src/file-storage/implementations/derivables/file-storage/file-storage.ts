/**
 * @module FileStorage
 */

import { FileSerdeTransformer } from "@/file-storage/implementations/derivables/file-storage/file-serde-transformer.js";
import { File } from "@/file-storage/implementations/derivables/file-storage/file.js";
import { resolveFileStorageAdapter } from "@/file-storage/implementations/derivables/file-storage/resolve-file-storage-adapter.js";
import { NoOpSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { CORE, resolveOneOrMore } from "@/utilities/_module.js";

import type {
    FileStorageAdapterVariants,
    IFile,
    IFileStorage,
    IFileUrlAdapter,
    ISignedFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";
import type { ISerderRegister } from "@/serde/contracts/_module.js";
import type { OneOrMore } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/file-storage"`
 * @group Derivables
 */
export type FileStorageSettingsBase = {
    /**
     * Note this setting is only used by cloud object storage services like aws s3, azure, or google cloud storage.
     *
     * @default "inline"
     */
    defaultContentDisposition?: string | null;

    /**
     * Note this setting is only used by cloud object storage services like aws s3, azure, or google cloud storage.
     *
     * @default null
     */
    defaultContentEncoding?: string | null;

    /**
     * Note this setting is only used by cloud object storage services like aws s3, azure, or google cloud storage.
     *
     * @default ""
     */
    defaultCacheControl?: string | null;

    /**
     * Note this setting is only used by cloud object storage services like aws s3, azure, or google cloud storage.
     *
     * @default null
     */
    defaultContentLanguage?: string | null;

    /**
     * You can pass partial {@link IFileUrlAdapter | `IFileUrlAdapter`} that can overide generating public url, signed upload and download url of the file storage adapter.
     */
    urlAdapter?: Partial<IFileUrlAdapter>;

    /**
     * You can pass an {@link ISerderRegister | `ISerderRegister`} instance to the {@link FileStorage | `FileStorage`} to register the file's serialization and deserialization logic for the provided adapter.
     * @default
     * ```ts
     * import { Serde } from "eridu-tech/serde";
     * import { NoOpSerdeAdapter } from "eridu-tech/serde/no-op-serde-adapter";
     *
     * new Serde(new NoOpSerdeAdapter())
     * ```
     */
    serde?: OneOrMore<ISerderRegister>;

    /**
     * The serde transformer name used to identify file storage serializers and deserializers when there are adapters with the same name.
     * @default ""
     */
    serdeTransformerName?: string;
};

/**
 * IMPORT_PATH: `"eridu-tech/file-storage"`
 * @group Derivables
 */
export type FileStorageSettings = FileStorageSettingsBase & {
    /**
     * The underlying storage adapter that handles the actual file operations.
     */
    adapter: FileStorageAdapterVariants;
};

/**
 * `FileStorage` class can be derived from any {@link ISignedFileStorageAdapter | `ISignedFileStorageAdapter`}.
 *
 * Note the {@link IFile | `IFile`} instances created by the `FileStorage` class are serializable and deserializable,
 * allowing them to be seamlessly transferred across different servers, processes, and databases.
 * This can be done directly using {@link ISerderRegister | `ISerderRegister`} or indirectly through components that rely on {@link ISerderRegister | `ISerderRegister`} internally.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage"`
 * @group Derivables
 */
export class FileStorage implements IFileStorage {
    private readonly originalAdapter: FileStorageAdapterVariants;
    private readonly adapter: ISignedFileStorageAdapter;
    private readonly serde: OneOrMore<ISerderRegister>;
    private readonly serdeTransformerName: string;
    private readonly defaultContentDisposition: string | null;
    private readonly defaultContentEncoding: string | null;
    private readonly defaultCacheControl: string | null;
    private readonly defaultContentLanguage: string | null;

    /**
     * @example
     * ```ts
     * import { Serde } from "eridu-tech/serde";
     * import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter"
     * import { FileStorag } from "eridu-tech/file-storage";
     * import { FsFileStorageAdapter } from "eridu-tech/file-storage/fs-file-storage-adapter";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const fileStorageAdapter = new FsFileStorageAdapter();
     * const fileStorage = new FileStorage({
     *   serde,
     *   adapter: fileStorageAdapter,
     * })
     * ```
     */
    constructor(settings: FileStorageSettings) {
        const {
            adapter,
            serde = new Serde(new NoOpSerdeAdapter()),
            serdeTransformerName = "",
            defaultCacheControl = null,
            defaultContentDisposition = "inline",
            defaultContentEncoding = null,
            defaultContentLanguage = null,
            urlAdapter = {},
        } = settings;

        this.originalAdapter = adapter;
        this.defaultContentDisposition = defaultContentDisposition;
        this.defaultContentEncoding = defaultContentEncoding;
        this.defaultCacheControl = defaultCacheControl;
        this.defaultContentLanguage = defaultContentLanguage;
        this.adapter = resolveFileStorageAdapter(adapter, urlAdapter);
        this.serde = serde;
        this.serdeTransformerName = serdeTransformerName;
        this.registerToSerde();
    }

    private registerToSerde(): void {
        const transformer = new FileSerdeTransformer({
            originalAdapter: this.originalAdapter,
            defaultCacheControl: this.defaultCacheControl,
            defaultContentDisposition: this.defaultContentDisposition,
            defaultContentEncoding: this.defaultContentEncoding,
            defaultContentLanguage: this.defaultContentLanguage,
            adapter: this.adapter,
            serdeTransformerName: this.serdeTransformerName,
        });
        for (const serde of resolveOneOrMore(this.serde)) {
            serde.registerCustom(transformer, CORE);
        }
    }

    create(key: string): IFile {
        return new File({
            originalAdapter: this.originalAdapter,
            defaultCacheControl: this.defaultCacheControl,
            defaultContentDisposition: this.defaultContentDisposition,
            defaultContentEncoding: this.defaultContentEncoding,
            defaultContentLanguage: this.defaultContentLanguage,
            adapter: this.adapter,
            key,
            originalKey: key,
            serdeTransformerName: this.serdeTransformerName,
        });
    }

    async clear(): Promise<void> {
        await this.adapter.removeByPrefix("");
    }

    async removeMany(files: Array<IFile>): Promise<boolean> {
        const keys = files.map((file) => {
            return file.key;
        });
        return await this.adapter.removeMany(keys);
    }
}
