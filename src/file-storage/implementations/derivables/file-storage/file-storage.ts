/**
 * @module FileStorage
 */
import {
    type EventBusInput,
    type IEventBus,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type IEventBusAdapter,
} from "@/event-bus/contracts/_module.js";
import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import {
    resolveEventBusInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type EventBus,
} from "@/event-bus/implementations/derivables/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    FILE_EVENTS,
    type FileEventMap,
    type FileStorageAdapterVariants,
    type IFile,
    type IFileListenable,
    type IFileStorage,
    type IFileUrlAdapter,
    type ISignedFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";
import {
    handleClearEvent,
    handleUnexpectedErrorEvent,
} from "@/file-storage/implementations/derivables/file-storage/event-helpers.js";
import { FileSerdeTransformer } from "@/file-storage/implementations/derivables/file-storage/file-serde-transformer.js";
import { File } from "@/file-storage/implementations/derivables/file-storage/file.js";
import { resolveFileStorageAdapter } from "@/file-storage/implementations/derivables/file-storage/resolve-file-storage-adapter.js";
import {
    type ILockFactoryBase,
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
import {
    type MiddlewareFn,
    type Plugin,
    type Use,
} from "@/middleware/contracts/_module.js";
import {
    applyPlugins,
    enhanceFactory,
    useFactory,
} from "@/middleware/implementations/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { NoOpNamespace } from "@/namespace/implementations/_module.js";
import { type ISerderRegister } from "@/serde/contracts/_module.js";
import { NoOpSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import {
    callInvokable,
    CORE,
    defaultWaitUntil,
    resolveOneOrMore,
    type InvokableFn,
    type OneOrMore,
    type WaitUntil,
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
     * @default []
     */
    plugins?: OneOrMore<Plugin<ISignedFileStorageAdapter>>;

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
     * @default
     * ```ts
     * import { NoOpNamespace } from "@daiso-tech/core/namespace";
     *
     * new NoOpNamespace()
     * ```
     */
    namespace?: INamespace;

    /**
     * You can pass partial {@link IFileUrlAdapter | `IFileUrlAdapter`} that can overide generating public url, signed upload and download url of the file storage adapter.
     */
    urlAdapter?: Partial<IFileUrlAdapter>;

    /**
     * You can provide an {@link IEventBus | `IEventBus`} or an {@link IEventBusAdapter | `IEventBusAdapter`} instance to handle the component's events.
     * If you provide an adapter, it will be automatically wrapped in an {@link EventBus | `EventBus`} instance.
     *
     * @default
     * ```ts
     * import { NoOpEventBusAdapter } from "@daiso-tech/core/event-bus/no-op-event-bus-adapter";
     *
     * new NoOpEventBusAdapter()
     * ```
     */
    eventBus?: EventBusInput;

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
     * You can pass the `waitUntil` function to handle background promises.
     * This is required when working with environments like Cloudflare Workers or Vercel Functions to ensure tasks complete after the response is sent.
     * @default
     * ```ts
     * import { defaultWaitUntil } from "@daiso-tech/core/utilities"
     * ```
     */
    waitUntil?: WaitUntil;

    /**
     * You can pass {@link IExecutionContext | `IExecutionContext`} that will be used by context-aware adapters.
     * @default
     * ```ts
     * import { ExecutionContext } from "@daiso-tech/core/execution-context"
     * import { NoOpExecutionContextAdapter } from "@daiso-tech/core/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    executionContext?: IExecutionContext;

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
    private readonly eventBus: IEventBus<FileEventMap>;
    private readonly originalAdapter: FileStorageAdapterVariants;
    private readonly adapter: ISignedFileStorageAdapter;
    private readonly namespace: INamespace;
    private readonly serde: OneOrMore<ISerderRegister>;
    private readonly serdeTransformerName: string;
    private readonly defaultContentType: string;
    private readonly defaultContentDisposition: string | null;
    private readonly defaultContentEncoding: string | null;
    private readonly defaultCacheControl: string | null;
    private readonly defaultContentLanguage: string | null;
    private readonly onlyLowercase: boolean;
    private readonly keyValidator: InvokableFn<[key: string], string | null>;
    private readonly waitUntil: WaitUntil;
    private readonly executionContext: IExecutionContext;
    private readonly use: Use;
    private readonly lockFactory: ILockFactoryBase;

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
            plugins = [],
            adapter,
            namespace = new NoOpNamespace(),
            eventBus = new NoOpEventBusAdapter(),
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
            waitUntil = defaultWaitUntil,
            executionContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
            lockFactory = new NoOpLockAdapter(),
        } = settings;

        this.lockFactory = resolveLockFactoryInput(namespace, lockFactory);
        this.use = useFactory({ executionContext });
        this.executionContext = executionContext;
        this.waitUntil = waitUntil;
        this.onlyLowercase = onlyLowercase;
        this.keyValidator = keyValidator;
        this.originalAdapter = adapter;
        this.defaultContentType = defaultContentType;
        this.defaultContentDisposition = defaultContentDisposition;
        this.defaultContentEncoding = defaultContentEncoding;
        this.defaultCacheControl = defaultCacheControl;
        this.defaultContentLanguage = defaultContentLanguage;
        this.adapter = applyPlugins(
            enhanceFactory(this.use),
            plugins,
            resolveFileStorageAdapter(adapter, urlAdapter),
        );
        this.namespace = namespace;
        this.eventBus = resolveEventBusInput(namespace, eventBus);
        this.serde = serde;
        this.serdeTransformerName = serdeTransformerName;
        this.registerToSerde();
    }

    private registerToSerde(): void {
        const transformer = new FileSerdeTransformer({
            lockFactory: this.lockFactory,
            use: this.use,
            executionContext: this.executionContext,
            waitUntil: this.waitUntil,
            onlyLowercase: this.onlyLowercase,
            keyValidator: this.keyValidator,
            originalAdapter: this.originalAdapter,
            defaultContentType: this.defaultContentType,
            defaultCacheControl: this.defaultCacheControl,
            defaultContentDisposition: this.defaultContentDisposition,
            defaultContentEncoding: this.defaultContentEncoding,
            defaultContentLanguage: this.defaultContentLanguage,
            adapter: this.adapter,
            eventBus: this.eventBus,
            namespace: this.namespace,
            serdeTransformerName: this.serdeTransformerName,
        });
        for (const serde of resolveOneOrMore(this.serde)) {
            serde.registerCustom(transformer, CORE);
        }
    }

    create(key: string): IFile {
        return new File({
            lockFactory: this.lockFactory,
            use: this.use,
            executionContext: this.executionContext,
            waitUntil: this.waitUntil,
            onlyLowercase: this.onlyLowercase,
            keyValidator: this.keyValidator,
            originalAdapter: this.originalAdapter,
            defaultContentType: this.defaultContentType,
            defaultCacheControl: this.defaultCacheControl,
            defaultContentDisposition: this.defaultContentDisposition,
            defaultContentEncoding: this.defaultContentEncoding,
            defaultContentLanguage: this.defaultContentLanguage,
            adapter: this.adapter,
            key: this.namespace.create(key),
            originalKey: key,
            eventDispatcher: this.eventBus,
            serdeTransformerName: this.serdeTransformerName,
            namespace: this.namespace,
        });
    }

    clear(): Promise<void> {
        return this.use(
            async () => {
                await this.adapter.removeByPrefix(
                    this.executionContext,
                    this.namespace.toString(),
                );
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(FILE_EVENTS.CLEARED, {}),
                );
            },
            handleUnexpectedErrorEvent(this.waitUntil, this.eventBus),
        )();
    }

    removeMany(files: Iterable<IFile>): Promise<boolean> {
        const filesArr = [...files];
        return this.use(async () => {
            const keys = filesArr.map((file) => {
                return file.key.toString();
            });
            return await this.adapter.removeMany(this.executionContext, keys);
        }, [
            ...filesArr.map<MiddlewareFn<[], Promise<boolean>>>((file) => {
                return async ({ next }) => {
                    return await this.lockFactory
                        .create(file.key.get())
                        .runOrFail(next);
                };
            }),
            handleClearEvent(this.waitUntil, this.eventBus, filesArr),
            handleUnexpectedErrorEvent(this.waitUntil, this.eventBus),
        ])();
    }

    get events(): IFileListenable {
        return this.eventBus;
    }
}
