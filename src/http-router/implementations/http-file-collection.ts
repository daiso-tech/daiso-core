/**
 * @module HttpRouter
 */

import { HttpError } from "@/http-router/contracts/_module.js";

import type {
    IHttpFileCollection,
    IHttpFile,
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
            throw HttpError.create({
                status: "400",
                message: `No file exists at index ${String(index)} for field "${this.fieldName}".`,
            });
        }
        return file;
    }

    first(): IHttpFile | null {
        return this.files[0] ?? null;
    }

    firstOrFail(): IHttpFile {
        const file = this.files[0];
        if (file === undefined) {
            throw HttpError.create({
                status: "400",
                message: `File collection for field "${this.fieldName}" is empty.`,
            });
        }
        return file;
    }

    size(): number {
        return this.files.length;
    }

    isEmpty(): boolean {
        return this.files.length === 0;
    }

    [Symbol.iterator](): Iterator<IHttpFile> {
        return this.files[Symbol.iterator]();
    }
}
