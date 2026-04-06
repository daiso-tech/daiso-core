/**
 * @module FileStorage
 */

import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import {
    type FileEventMap,
    type FileStorageAdapterVariants,
    type ISignedFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";
import {
    File,
    type ISerializedFile,
} from "@/file-storage/implementations/derivables/file-storage/file.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { type ISerdeTransformer } from "@/serde/contracts/_module.js";
import {
    getConstructorName,
    type InvokableFn,
    type OneOrMore,
    type WaitUntil,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export type FileSerdeTransformerSettings = {
    waitUntil: WaitUntil;
    defaultContentType: string;
    defaultContentDisposition: string | null;
    defaultContentEncoding: string | null;
    defaultCacheControl: string | null;
    defaultContentLanguage: string | null;
    originalAdapter: FileStorageAdapterVariants;
    adapter: ISignedFileStorageAdapter;
    namespace: INamespace;
    eventBus: IEventBus<FileEventMap>;
    serdeTransformerName: string;
    onlyLowercase: boolean;
    keyValidator: InvokableFn<[key: string], string | null>;
    executionContext: IExecutionContext;
};

/**
 * @internal
 */
export class FileSerdeTransformer
    implements ISerdeTransformer<File, ISerializedFile>
{
    private readonly waitUntil: WaitUntil;
    private readonly onlyLowercase: boolean;
    private readonly keyValidator: InvokableFn<[key: string], string | null>;
    private readonly originalAdapter: FileStorageAdapterVariants;
    private readonly adapter: ISignedFileStorageAdapter;
    private readonly namespace: INamespace;
    private readonly eventBus: IEventBus<FileEventMap>;
    private readonly serdeTransformerName: string;
    private readonly defaultContentType: string;
    private readonly defaultContentDisposition: string | null;
    private readonly defaultContentEncoding: string | null;
    private readonly defaultCacheControl: string | null;
    private readonly defaultContentLanguage: string | null;
    private readonly executionContext: IExecutionContext;

    constructor(settings: FileSerdeTransformerSettings) {
        const {
            onlyLowercase,
            keyValidator,
            adapter,
            namespace,
            eventBus,
            serdeTransformerName,
            defaultContentType,
            defaultCacheControl,
            defaultContentDisposition,
            defaultContentEncoding,
            defaultContentLanguage,
            originalAdapter,
            waitUntil,
            executionContext,
        } = settings;

        this.executionContext = executionContext;
        this.waitUntil = waitUntil;
        this.onlyLowercase = onlyLowercase;
        this.keyValidator = keyValidator;
        this.originalAdapter = originalAdapter;
        this.adapter = adapter;
        this.namespace = namespace;
        this.eventBus = eventBus;
        this.serdeTransformerName = serdeTransformerName;
        this.defaultContentType = defaultContentType;
        this.defaultCacheControl = defaultCacheControl;
        this.defaultContentDisposition = defaultContentDisposition;
        this.defaultContentEncoding = defaultContentEncoding;
        this.defaultContentLanguage = defaultContentLanguage;
    }

    get name(): OneOrMore<string> {
        return [
            "file",
            this.serdeTransformerName,
            getConstructorName(this.originalAdapter),
            this.namespace.toString(),
        ].filter((str) => str !== "");
    }

    isApplicable(value: unknown): value is File {
        const isFile =
            value instanceof File && getConstructorName(value) === File.name;
        if (!isFile) {
            return false;
        }

        const isSerdTransformerNameMathcing =
            this.serdeTransformerName ===
            value._internal_getSerdeTransformerName();

        const isNamespaceMatching =
            this.namespace.toString() ===
            value._internal_getNamespace().toString();

        const isAdapterMatching =
            getConstructorName(this.originalAdapter) ===
            getConstructorName(value._internal_getAdapter());

        return (
            isSerdTransformerNameMathcing &&
            isNamespaceMatching &&
            isAdapterMatching
        );
    }

    deserialize(serializedValue: ISerializedFile): File {
        const { key } = serializedValue;
        const keyObj = this.namespace.create(key);

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
            eventDispatcher: this.eventBus,
            adapter: this.adapter,
            key: keyObj,
            serdeTransformerName: this.serdeTransformerName,
            namespace: this.namespace,
        });
    }

    serialize(deserializedValue: File): ISerializedFile {
        return File._internal_serialize(deserializedValue);
    }
}
