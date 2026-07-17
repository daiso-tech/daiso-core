/**
 * @module HttpRouter
 */

/**
 * The error thrown when {@link IHttpFileCollection.firstOrFail} is called
 * on an empty file collection.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Errors
 */
export class EmptyFileCollectionError extends Error {
    /**
     * Creates a new `EmptyFileCollectionError` for the given field name.
     *
     * @param fieldName - The name of the file field that is empty.
     */
    static create(fieldName: string): EmptyFileCollectionError {
        return new EmptyFileCollectionError(
            `File collection for field "${fieldName}" is empty.`,
        );
    }

    /**
     * Note: Do not instantiate `EmptyFileCollectionError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string) {
        super(message);
        this.name = EmptyFileCollectionError.name;
    }
}

/**
 * The error thrown when {@link IHttpFileCollection.getOrFail} is called
 * with an index that is out of bounds.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Errors
 */
export class FileIndexOutOfBoundsError extends Error {
    /**
     * Creates a new `FileIndexOutOfBoundsError` for the given field name and index.
     *
     * @param fieldName - The name of the file field.
     * @param index - The requested index that is out of bounds.
     */
    static create(fieldName: string, index: number): FileIndexOutOfBoundsError {
        return new FileIndexOutOfBoundsError(
            `No file exists at index ${String(index)} for field "${fieldName}".`,
        );
    }

    /**
     * Note: Do not instantiate `FileIndexOutOfBoundsError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string) {
        super(message);
        this.name = FileIndexOutOfBoundsError.name;
    }
}
