/**
 * @module HttpRouter
 */

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    HttpError,
} from "@/http-router/contracts/http.errors.js";

import type { IHttpFile } from "@/http-router/contracts/http-file.contract.js";

/**
 * A collection of validated uploaded files for a single file field.
 *
 * Provides safe (`get`, `first`) and throwing (`getOrFail`, `firstOrFail`)
 * accessors, iteration via `for...of`, and inspection of the file count.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type IHttpFileCollection = Iterable<IHttpFile> & {
    /**
     * Returns the number of files in the collection.
     */
    size(): number;

    /**
     * Returns the file at the given 0-based index, or `null` if out of bounds.
     *
     * @param index - The 0-based index of the file to retrieve.
     */
    get(index: number): IHttpFile | null;

    /**
     * Returns the file at the given 0-based index.
     *
     * @param index - The 0-based index of the file to retrieve.
     * @throws {HttpError} with status code 400 when the index is out of bounds.
     */
    getOrFail(index: number): IHttpFile;

    /**
     * Returns the first file in the collection, or `null` if empty.
     */
    first(): IHttpFile | null;

    /**
     * Returns the first file in the collection.
     *
     * @throws {HttpError} with status code 400 when the collection is empty.
     */
    firstOrFail(): IHttpFile;

    /**
     * Whether the collection has no files.
     */
    isEmpty(): boolean;
};
