/**
 * @module HttpRouter
 */

import {
    type IHttpFileCollection,
    type IHttpFile,
    EmptyFileCollectionError,
    FileIndexOutOfBoundsError,
} from "@/http-router/contracts/_module.js";

/**
 * @internal
 */
export class HttpFileCollection implements IHttpFileCollection {
    /**
     * @param fieldName - The name of the file field (used in error messages).
     * @param files - The validated files for this field.
     */
    constructor(
        private readonly fieldName: string,
        private readonly files: ReadonlyArray<IHttpFile>,
    ) {}

    get(index: number): IHttpFile | null {
        return this.files[index] ?? null;
    }

    getOrFail(index: number): IHttpFile {
        const file = this.files[index];
        if (file === undefined) {
            throw FileIndexOutOfBoundsError.create(this.fieldName, index);
        }
        return file;
    }

    first(): IHttpFile | null {
        return this.files[0] ?? null;
    }

    firstOrFail(): IHttpFile {
        const file = this.files[0];
        if (file === undefined) {
            throw EmptyFileCollectionError.create(this.fieldName);
        }
        return file;
    }

    get count(): number {
        return this.files.length;
    }

    get isEmpty(): boolean {
        return this.files.length === 0;
    }

    [Symbol.iterator](): Iterator<IHttpFile> {
        return this.files[Symbol.iterator]();
    }
}
