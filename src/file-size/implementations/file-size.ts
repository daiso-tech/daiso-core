/**
 * @module FileSize
 */

import { type IFileSize, TO_BYTES } from "@/file-size/contracts/_module.js";
import { type ISerializable } from "@/serde/contracts/_module.js";
import { type IComparable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-size"`
 * @group Implementations
 */
export type SerializedFileSize = {
    version: "1";
    fileSizeInBytes: number;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-size"`
 * @group Implementations
 */
export class FileSize
    implements
        IFileSize,
        ISerializable<SerializedFileSize>,
        IComparable<IFileSize>
{
    private static kbInBytes = 1000;
    private static mbInBytes = 1000 * FileSize.kbInBytes;
    private static gbInBytes = 1000 * FileSize.mbInBytes;
    private static tbInBytes = 1000 * FileSize.gbInBytes;
    private static pbInBytes = 1000 * FileSize.tbInBytes;

    static deserialize(serializedValue: SerializedFileSize): FileSize {
        return new FileSize(serializedValue.fileSizeInBytes);
    }

    static fromBytes(bytes: number): FileSize {
        return new FileSize(bytes);
    }

    static fromKiloBytes(kiloBytes: number): FileSize {
        return new FileSize(kiloBytes * FileSize.kbInBytes);
    }

    static fromMegaBytes(megaBytes: number): FileSize {
        return new FileSize(megaBytes * FileSize.mbInBytes);
    }

    static fromGigaBytes(gigaBytes: number): FileSize {
        return new FileSize(gigaBytes * FileSize.gbInBytes);
    }

    static fromTeraBytes(teraBytes: number): FileSize {
        return new FileSize(teraBytes * FileSize.tbInBytes);
    }

    static fromPetaBytes(petaBytes: number): FileSize {
        return new FileSize(petaBytes * FileSize.pbInBytes);
    }

    private constructor(private readonly fileSizeInBytes: number) {}

    [TO_BYTES](): number {
        return this.fileSizeInBytes;
    }

    equals(value: IFileSize): boolean {
        return value[TO_BYTES]() === this.toBytes();
    }

    gt(value: IFileSize): boolean {
        return value[TO_BYTES]() < this.toBytes();
    }

    gte(value: IFileSize): boolean {
        return value[TO_BYTES]() <= this.toBytes();
    }

    lt(value: IFileSize): boolean {
        return value[TO_BYTES]() > this.toBytes();
    }

    lte(value: IFileSize): boolean {
        return value[TO_BYTES]() >= this.toBytes();
    }

    serialize(): SerializedFileSize {
        return {
            version: "1",
            fileSizeInBytes: this.fileSizeInBytes,
        };
    }

    toBytes(): number {
        return this[TO_BYTES]();
    }

    toKiloBytes(): number {
        return Math.floor(this.toBytes() / FileSize.kbInBytes);
    }

    toMegaBytes(): number {
        return Math.floor(this.toBytes() / FileSize.mbInBytes);
    }

    toGigaBytes(): number {
        return Math.floor(this.toBytes() / FileSize.gbInBytes);
    }

    toTeraBytes(): number {
        return Math.floor(this.toBytes() / FileSize.tbInBytes);
    }

    toPetaBytes(): number {
        return Math.floor(this.toBytes() / FileSize.pbInBytes);
    }
}
