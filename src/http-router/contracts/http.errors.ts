/**
 * @module HttpRouter
 */

import { type HttpErrorStatus } from "@/http-router/contracts/http-status.js";

/**
 * Settings for creating an {@link HttpError}.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Errors
 */
export type HttpErrorSettings = {
    /** The HTTP error status code (4xx or 5xx). */
    status: HttpErrorStatus;

    /** A human-readable error message. */
    message: string;

    /** The underlying error cause, if any. */
    cause: unknown;
};

/**
 * Represents an HTTP error with a typed status code.
 *
 * Use the static {@link HttpError.create} factory method to instantiate.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Errors
 */
export class HttpError extends Error {
    /**
     * Creates a new `HttpError` from the given settings.
     *
     * @param settings - The error configuration (status, message, cause).
     */
    static create(settings: HttpErrorSettings): HttpError {
        return new HttpError(settings);
    }

    public readonly status: HttpErrorStatus;

    /**
     * Note: Do not instantiate `HttpError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(settings: HttpErrorSettings) {
        const { status, message, cause } = settings;

        super(message, { cause });

        this.status = status;
    }
}
