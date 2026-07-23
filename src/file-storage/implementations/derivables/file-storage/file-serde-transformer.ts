/**
 * @module FileStorage
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type FileStorageAdapterVariants,
    type ISignedFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";
import {
    File,
    type ISerializedFile,
} from "@/file-storage/implementations/derivables/file-storage/file.js";
import { type ISerdeTransformer } from "@/serde/contracts/_module.js";
import {
    getConstructorName,
    type InvokableFn,
    type OneOrMore,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export type FileSerdeTransformerSettings = {
    defaultContentType: string;
    defaultContentDisposition: string | null;
    defaultContentEncoding: string | null;
    defaultCacheControl: string | null;
    defaultContentLanguage: string | null;
    originalAdapter: FileStorageAdapterVariants;
    adapter: ISignedFileStorageAdapter;
    serdeTransformerName: string;
    onlyLowercase: boolean;
    keyValidator: InvokableFn<[key: string], string | null>;
    context: IReadableContext;
};

/**
 * @internal
 */
export class FileSerdeTransformer implements ISerdeTransformer<
    File,
    ISerializedFile
> {
    private readonly onlyLowercase: boolean;
    private readonly keyValidator: InvokableFn<[key: string], string | null>;
    private readonly originalAdapter: FileStorageAdapterVariants;
    private readonly adapter: ISignedFileStorageAdapter;
    private readonly serdeTransformerName: string;
    private readonly defaultContentType: string;
    private readonly defaultContentDisposition: string | null;
    private readonly defaultContentEncoding: string | null;
    private readonly defaultCacheControl: string | null;
    private readonly defaultContentLanguage: string | null;
    private readonly context: IReadableContext;

    constructor(settings: FileSerdeTransformerSettings) {
        const {
            onlyLowercase,
            keyValidator,
            adapter,
            serdeTransformerName,
            defaultContentType,
            defaultCacheControl,
            defaultContentDisposition,
            defaultContentEncoding,
            defaultContentLanguage,
            originalAdapter,
            context,
        } = settings;

        this.context = context;
        this.onlyLowercase = onlyLowercase;
        this.keyValidator = keyValidator;
        this.originalAdapter = originalAdapter;
        this.adapter = adapter;
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
        ].filter((str) => str !== "");
    }

    isApplicable(value: unknown): value is File {
        const isFile =
            value instanceof File && getConstructorName(value) === File.name;
        if (!isFile) {
            return false;
        }

        const isSerdTransformerNameMathcing =
            this.serdeTransformerName === value._getSerdeTransformerName();

        const isAdapterMatching =
            getConstructorName(this.originalAdapter) ===
            getConstructorName(value._getAdapter());

        return isSerdTransformerNameMathcing && isAdapterMatching;
    }

    deserialize(serializedValue: ISerializedFile): File {
        const { key } = serializedValue;

        return new File({
            originalKey: key,
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
            serdeTransformerName: this.serdeTransformerName,
        });
    }

    serialize(deserializedValue: File): ISerializedFile {
        return File._serialize(deserializedValue);
    }
}
