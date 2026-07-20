/**
 * @module FileStorage
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    type FileStorageAdapterVariants,
    type IFile,
    type IFileStorage,
    type IFileUrlAdapter,
    type ISignedFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";
import { FileSerdeTransformer } from "@/file-storage/implementations/derivables/file-storage/file-serde-transformer.js";
import { File } from "@/file-storage/implementations/derivables/file-storage/file.js";
import { resolveFileStorageAdapter } from "@/file-storage/implementations/derivables/file-storage/resolve-file-storage-adapter.js";
import {
    type ILockFactory,
    type LockFactoryInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type IDatabaseLockAdapter,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ILockAdapter,
} from "@/lock/contracts/_module.js";
// eslint-disable-next-line import/order
import { NoOpLockAdapter } from "@/lock/implementations/adapters/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type LockFactory,
    resolveLockFactoryInput,
} from "@/lock/implementations/derivables/_module.js";
import { type MiddlewareFn } from "@/middleware/contracts/_module.js";
import { use } from "@/middleware/implementations/_module.js";
import { type ISerderRegister } from "@/serde/contracts/_module.js";
import { NoOpSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import {
    CORE,
    resolveOneOrMore,
    type InvokableFn,
    type OneOrMore,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage"`
 * @group Derivables
 */
export function defaultKeyValidator(key: string): string | null {
    if (key.includes("../")) {
        return `The key cannot contain "../"`;
    }
    if (key.includes("\n")) {
        return `The key cannot contain "\\n"`;
    }
    if (key.includes("\t")) {
        return `The key cannot contain "\\t"`;
    }
    if (key.trim() === "") {
        return "The key cannot contain only spaces or be an empty string";
    }
    return null;
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage"`
 * @group Derivables
 */
export type FileKeyValidator = InvokableFn<[key: string], string | null>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage"`
 * @group Derivables
 */
export type FileStorageSettingsBase = {
    /**
     * The default content type to be used when it cannot be infered by file extension.
     *
     * @default "application/octet-stream"
     */
    defaultContentType?: string;

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
     * When `true`, all file keys are automatically converted to lowercase before storage and retrieval.
     * Helps avoid case-sensitivity issues across different storage backends.
     * @default false
     */
    onlyLowercase?: boolean;

    /**
     * You can pass a key validator. The method should return string error message if unvalid or null if valid.
     * @default
     * ```ts
     * import { defaultKeyValidator } from "@daiso-tech/core/file-storage";
     *
     * defaultKeyValidator
     * ```
     */
    keyValidator?: FileKeyValidator;

    /**
     * You can pass partial {@link IFileUrlAdapter | `IFileUrlAdapter`} that can overide generating public url, signed upload and download url of the file storage adapter.
     */
    urlAdapter?: Partial<IFileUrlAdapter>;

    /**
     * You can pass an {@link ISerderRegister | `ISerderRegister`} instance to the {@link FileStorage | `FileStorage`} to register the file's serialization and deserialization logic for the provided adapter.
     * @default
     * ```ts
     * import { Serde } from "@daiso-tech/core/serde";
     * import { NoOpSerdeAdapter } from "@daiso-tech/core/serde/no-op-serde-adapter";
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

    /**
     * You can pass {@link IReadableContext | `IReadableContext`} that will be used by context-aware adapters.
     * @default
     * ```ts
     * import { ExecutionContext } from "@daiso-tech/core/execution-context"
     * import { NoOpExecutionContextAdapter } from "@daiso-tech/core/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    context?: IReadableContext;

    /**
     * You can provide an {@link ILockFactoryBase | `ILockFactoryBase`}, an {@link ILockAdapter | `ILockAdapter`} or an {@link IDatabaseLockAdapter | `IDatabaseLockAdapter`} instance to handle locking when write methods are called.
     * If you provide an adapter, it will be automatically wrapped in an {@link LockFactory | `LockFactory`} instance.
     * @default
     * ```ts
     * import { NoOpLockAdapter } from "@daiso-tech/core/lock/no-op-lock-adapter";
     *
     * new NoOpLockAdapter()
     * ```
     */
    lockFactory?: LockFactoryInput;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage"`
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
 * IMPORT_PATH: `"@daiso-tech/core/file-storage"`
 * @group Derivables
 */
export class FileStorage implements IFileStorage {
    private readonly originalAdapter: FileStorageAdapterVariants;
    private readonly adapter: ISignedFileStorageAdapter;
    private readonly serde: OneOrMore<ISerderRegister>;
    private readonly serdeTransformerName: string;
    private readonly defaultContentType: string;
    private readonly defaultContentDisposition: string | null;
    private readonly defaultContentEncoding: string | null;
    private readonly defaultCacheControl: string | null;
    private readonly defaultContentLanguage: string | null;
    private readonly onlyLowercase: boolean;
    private readonly keyValidator: InvokableFn<[key: string], string | null>;
    private readonly context: IReadableContext;
    private readonly lockFactory: ILockFactory;

    /**
     * @example
     * ```ts
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter"
     * import { FileStorag } from "@daiso-tech/core/file-storage";
     * import { FsFileStorageAdapter } from "@daiso-tech/core/file-storage/fs-file-storage-adapter";
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
            onlyLowercase = false,
            keyValidator = defaultKeyValidator,
            serde = new Serde(new NoOpSerdeAdapter()),
            serdeTransformerName = "",
            defaultContentType = "application/octet-stream",
            defaultCacheControl = null,
            defaultContentDisposition = "inline",
            defaultContentEncoding = null,
            defaultContentLanguage = null,
            urlAdapter = {},
            context = new ExecutionContext(new NoOpExecutionContextAdapter()),
            lockFactory = new NoOpLockAdapter(),
        } = settings;

        this.lockFactory = resolveLockFactoryInput(lockFactory);
        this.context = context;
        this.onlyLowercase = onlyLowercase;
        this.keyValidator = keyValidator;
        this.originalAdapter = adapter;
        this.defaultContentType = defaultContentType;
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
            lockFactory: this.lockFactory,
            context: this.context,
            onlyLowercase: this.onlyLowercase,
            keyValidator: this.keyValidator,
            originalAdapter: this.originalAdapter,
            defaultContentType: this.defaultContentType,
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
            lockFactory: this.lockFactory,
            context: this.context,
            onlyLowercase: this.onlyLowercase,
            keyValidator: this.keyValidator,
            originalAdapter: this.originalAdapter,
            defaultContentType: this.defaultContentType,
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
        await this.adapter.removeByPrefix(this.context, "");
    }

    async removeMany(files: Array<IFile>): Promise<boolean> {
        const keys = files.map((file) => {
            return file.key;
        });
        return use(async () => {
            return await this.adapter.removeMany(this.context, keys);
        }, [
            ...keys.map<MiddlewareFn<[], Promise<boolean>>>((key) => {
                return async ({ next }) => {
                    return await this.lockFactory.create(key).runOrFail(next);
                };
            }),
        ])();
    }
}
