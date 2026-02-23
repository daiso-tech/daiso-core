/**
 * @module Serde
 */

/**
 * The error occurs when a value is unable to be serialized.
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/contracts"`
 * @group Errors
 */
export class SerializationSerdeError extends Error {
    static create(error: unknown): SerializationSerdeError {
        return new SerializationSerdeError(
            `Serialization error "${String(error)}" occured`,
            error,
        );
    }

    /**
     * Note: Do not instantiate `SerializationSerdeError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = SerializationSerdeError.name;
    }
}

/**
 * The error occurs when a value is unable to be deserialized.
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/contracts"`
 * @group Errors
 */
export class DeserializationSerdeError extends Error {
    static create(error: unknown): DeserializationSerdeError {
        return new DeserializationSerdeError(
            `Deserialization error "${String(error)}" occured`,
            error,
        );
    }

    /**
     * Note: Do not instantiate `DeserializationSerdeError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = DeserializationSerdeError.name;
    }
}

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/contracts"`
 * @group Errors
 */
export const SERDE_ERRORS = {
    Serialization: SerializationSerdeError,
    Deserialization: DeserializationSerdeError,
} as const;

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/contracts"`
 * @group Errors
 */
export type AllSerdeErrors =
    | SerializationSerdeError
    | DeserializationSerdeError;

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/contracts"`
 * @group Errors
 */
export function isSerdeError(value: unknown): value is AllSerdeErrors {
    for (const ErrorClass of Object.values(SERDE_ERRORS)) {
        if (!(value instanceof ErrorClass)) {
            return false;
        }
    }
    return true;
}
