/**
 * @module HttpRouter
 */

import type { HttpErrorStatus } from "@/http-router/contracts/http-status.js";

/**
 * Settings for creating an {@link HttpError}.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Errors
 */
export type HttpErrorSettings = {
    /** The HTTP error status code (4xx or 5xx). */
    status: HttpErrorStatus;

    /** A human-readable error message. */
    message: string;

    /**
     * Arbitrary data to attach to the error (e.g. validation issues).
     */
    payload?: unknown;

    /** The underlying error cause, if any. */
    cause?: unknown;
};

/**
 * Represents an HTTP error with a typed status code.
 *
 * Use the static {@link HttpError.create} factory method to instantiate.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
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

    /**
     * Arbitrary data attached to the error (e.g. validation issues).
     */
    public readonly payload: unknown;

    /**
     * The HTTP error status code (4xx or 5xx).
     */
    public readonly status: HttpErrorStatus;

    /**
     * Note: Do not instantiate `HttpError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(settings: HttpErrorSettings) {
        const { status, message, payload, cause } = settings;

        super(message, { cause });

        this.payload = payload;
        this.name = HttpError.name;
        this.status = status;
    }
}
