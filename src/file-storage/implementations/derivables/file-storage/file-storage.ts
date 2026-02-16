/**
 * @module FileStorage
 */
import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
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
import { type AsyncMiddlewareFn } from "@/hooks/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { NoOpNamespace } from "@/namespace/implementations/_module.js";
import { type ISerderRegister } from "@/serde/contracts/_module.js";
import { NoOpSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { type ITask } from "@/task/contracts/_module.js";
import { Task } from "@/task/implementations/_module.js";
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
        } = settings;

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

                this.eventBus
                    .dispatch(FILE_EVENTS.UNEXPECTED_ERROR, {
                        error,
                    })
                    .detach();

                throw error;
            }
        };
    };

    clear(): ITask<void> {
        return new Task(async () => {
            await this.adapter.removeByPrefix(this.namespace.toString());
            this.eventBus.dispatch(FILE_EVENTS.CLEARED, {}).detach();
        }).pipe([this.handleUnexpectedErrorEvent()]);
    }

    removeMany(files: Iterable<IFile>): ITask<boolean> {
        return new Task(async () => {
            const namespacedKeys = [...files].map((file) => {
                return file.key.toString();
            });

            const hasRemovedAtLeastOne =
                await this.adapter.removeMany(namespacedKeys);

            if (hasRemovedAtLeastOne) {
                for (const file of files) {
                    this.eventBus
                        .dispatch(FILE_EVENTS.REMOVED, { file })
                        .detach();
                }
            } else {
                for (const file of files) {
                    this.eventBus
                        .dispatch(FILE_EVENTS.NOT_FOUND, { file })
                        .detach();
                }
            }

            return hasRemovedAtLeastOne;
        }).pipe([this.handleUnexpectedErrorEvent()]);
    }

    get events(): IFileListenable {
        return this.eventBus;
    }
}
