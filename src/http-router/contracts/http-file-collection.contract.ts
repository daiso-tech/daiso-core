/**
 * @module HttpRouter
 */

import { type IHttpFile } from "@/http-router/contracts/http-file.contract.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    FileIndexOutOfBoundsError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    EmptyFileCollectionError,
} from "@/http-router/contracts/http-file.errors.js";

/**
 * A collection of validated uploaded files for a single file field.
 *
 * Provides safe (`get`, `first`) and throwing (`getOrFail`, `firstOrFail`)
 * accessors, iteration via `for...of`, and inspection of the file count.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type IHttpFileCollection = Iterable<IHttpFile> & {
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
     * @throws {FileIndexOutOfBoundsError} when the index is out of bounds.
     */
    getOrFail(index: number): IHttpFile;

    /**
     * Returns the first file in the collection, or `null` if empty.
     */
    first(): IHttpFile | null;

    /**
     * Returns the first file in the collection.
     *
     * @throws {EmptyFileCollectionError} when the collection is empty.
     */
    firstOrFail(): IHttpFile;

    /**
     * The number of files in the collection.
     */
    readonly count: number;

    /**
     * Whether the collection has no files.
     */
    readonly isEmpty: boolean;
};
