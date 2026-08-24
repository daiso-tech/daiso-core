/**
 * @module FileStorage
 */

import { File } from "@/file-storage/implementations/derivables/file-storage/file.js";
import { getConstructorName } from "@/utilities/_module.js";

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    FileStorageAdapterVariants,
    ISignedFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";
import type { ISerializedFile } from "@/file-storage/implementations/derivables/file-storage/file.js";
import type { ISerdeTransformer } from "@/serde/contracts/_module.js";
import type { OneOrMore } from "@/utilities/_module.js";

/**
 * @internal
 */
export type FileSerdeTransformerSettings = {
    defaultContentDisposition: string | null;
    defaultContentEncoding: string | null;
    defaultCacheControl: string | null;
    defaultContentLanguage: string | null;
    originalAdapter: FileStorageAdapterVariants;
    adapter: ISignedFileStorageAdapter;
    serdeTransformerName: string;
    context: IReadableContext;
};

/**
 * @internal
 */
export class FileSerdeTransformer implements ISerdeTransformer<
    File,
    ISerializedFile
> {
    private readonly originalAdapter: FileStorageAdapterVariants;
    private readonly adapter: ISignedFileStorageAdapter;
    private readonly serdeTransformerName: string;
    private readonly defaultContentDisposition: string | null;
    private readonly defaultContentEncoding: string | null;
    private readonly defaultCacheControl: string | null;
    private readonly defaultContentLanguage: string | null;
    private readonly context: IReadableContext;

    constructor(settings: FileSerdeTransformerSettings) {
        const {
            adapter,
            serdeTransformerName,
            defaultCacheControl,
            defaultContentDisposition,
            defaultContentEncoding,
            defaultContentLanguage,
            originalAdapter,
            context,
        } = settings;

        this.context = context;
        this.originalAdapter = originalAdapter;
        this.adapter = adapter;
        this.serdeTransformerName = serdeTransformerName;
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
            this.serdeTransformerName ===
            value.internalGetSerdeTransformerName();

        const isAdapterMatching =
            getConstructorName(this.originalAdapter) ===
            getConstructorName(value.internalGetAdapter());

        return isSerdTransformerNameMathcing && isAdapterMatching;
    }

    deserialize(serializedValue: ISerializedFile): File {
        const { key } = serializedValue;

        return new File({
            originalKey: key,
            context: this.context,
            originalAdapter: this.originalAdapter,
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
        return File.internalSerialize(deserializedValue);
    }
}
