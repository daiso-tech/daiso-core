/**
 * @module FileStorage
 */
import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    FILE_EVENTS,
    isFileError,
    type FileEventMap,
    type FileStorageAdapterVariants,
    type IFile,
    type IFileListenable,
    type IFileStorage,
    type IFileUrlAdapter,
    type ISignedFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";
import { FileSerdeTransformer } from "@/file-storage/implementations/derivables/file-storage/file-serde-transformer.js";
import { File } from "@/file-storage/implementations/derivables/file-storage/file.js";
import { resolveFileStorageAdapter } from "@/file-storage/implementations/derivables/file-storage/resolve-file-storage-adapter.js";
import { AsyncHooks, type AsyncMiddlewareFn } from "@/hooks/_module.js";
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
     * @default true
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
 * IMPORT_PATH: `"@daiso-tech/core/file-storage"`
 * @group Derivables
 */
export type FileStorageSettings = FileStorageSettingsBase & {
    adapter: FileStorageAdapterVariants;
};

/**
 * `FileStorage` class can be derived from any {@link ISignedFileStorageAdapter | `IFileStorageAdapter`}.
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
            namespace = new NoOpNamespace(),
            eventBus = new EventBus({
                adapter: new NoOpEventBusAdapter(),
            }),
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
        } = settings;

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
        this.adapter = resolveFileStorageAdapter(adapter, urlAdapter);
        this.namespace = namespace;
        this.eventBus = eventBus;
        this.serde = serde;
        this.serdeTransformerName = serdeTransformerName;
        this.registerToSerde();
    }

    private registerToSerde(): void {
        const transformer = new FileSerdeTransformer({
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
            eventDispatcher: this.eventBus,
            serdeTransformerName: this.serdeTransformerName,
            namespace: this.namespace,
        });
    }

    private handleUnexpectedErrorEvent = <
        TParameters extends Array<unknown>,
        TReturn,
    >(): AsyncMiddlewareFn<TParameters, TReturn> => {
        return async (args, next) => {
            try {
                return await next(...args);
            } catch (error: unknown) {
                if (isFileError(error)) {
                    throw error;
                }

                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(FILE_EVENTS.UNEXPECTED_ERROR, {
                        error,
                    }),
                );

                throw error;
            }
        };
    };

    clear(): Promise<void> {
        return new AsyncHooks(async () => {
            await this.adapter.removeByPrefix(
                this.executionContext,
                this.namespace.toString(),
            );
            callInvokable(
                this.waitUntil,
                this.eventBus.dispatch(FILE_EVENTS.CLEARED, {}),
            );
        }, [this.handleUnexpectedErrorEvent()]).invoke();
    }

    removeMany(files: Iterable<IFile>): Promise<boolean> {
        return new AsyncHooks(async () => {
            const filesArr = [...files];
            const namespacedKeys = filesArr.map((file) => {
                return file.key.toString();
            });

            const hasRemovedAtLeastOne = await this.adapter.removeMany(
                this.executionContext,
                namespacedKeys,
            );

            if (hasRemovedAtLeastOne) {
                for (const file of filesArr) {
                    callInvokable(
                        this.waitUntil,
                        this.eventBus.dispatch(FILE_EVENTS.REMOVED, { file }),
                    );
                }
            } else {
                for (const file of filesArr) {
                    callInvokable(
                        this.waitUntil,
                        this.eventBus.dispatch(FILE_EVENTS.NOT_FOUND, { file }),
                    );
                }
            }

            return hasRemovedAtLeastOne;
        }, [this.handleUnexpectedErrorEvent()]).invoke();
    }

    get events(): IFileListenable {
        return this.eventBus;
    }
}
