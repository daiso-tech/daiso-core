export * from "@/di/contracts/container.errors.js";

/**
 * Thrown when a container method is called before `container.init()`.
 *
 * @group Errors
 */
export class BeforeReadyCallError extends Error {
    /**
     * Creates a new {@link BeforeReadyCallError} instance.
     *
     * @param methodName - The name of the method that was called illegally.
     * @returns A new error instance.
     */
    static create(methodName: string): BeforeReadyCallError {
        return new BeforeReadyCallError(
            `Illegal method call: "${methodName}" was called before container.init() was invoked. Call container.init() first.`,
        );
    }

    /**
     * Note: Do not instantiate `BeforeReadyCallError` directly via the constructor. Use the static `create()` factory method instead.
     *
     * @param message - A descriptive error message.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
    }
}

/**
 * Thrown when a container method is called after `container.init()`.
 *
 * @group Errors
 */
export class InReadyCallError extends Error {
    /**
     * Creates a new {@link InReadyCallError} instance.
     *
     * @param methodName - The name of the method that was called illegally.
     * @returns A new error instance.
     */
    static create(methodName: string): InReadyCallError {
        return new InReadyCallError(
            `Illegal method call: "${methodName}" was called after container.init() was invoked. Registration and override methods must be called before container.init().`,
        );
    }

    /**
     * Note: Do not instantiate `InReadyCallError` directly via the constructor. Use the static `create()` factory method instead.
     *
     * @param message - A descriptive error message.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
    }
}

/**
 * Thrown when a container method is called after `container.deInit()`.
 *
 * @group Errors
 */
export class AfterReadyCallError extends Error {
    /**
     * Creates a new {@link AfterReadyCallError} instance.
     *
     * @param methodName - The name of the method that was called illegally.
     * @returns A new error instance.
     */
    static create(methodName: string): AfterReadyCallError {
        return new AfterReadyCallError(
            `Illegal method call: "${methodName}" was called after container.deInit() was invoked. The container is no longer ready; call container.init() again before using it.`,
        );
    }

    /**
     * Note: Do not instantiate `AfterReadyCallError` directly via the constructor. Use the static `create()` factory method instead.
     *
     * @param message - A descriptive error message.
     * @param cause - The underlying cause of the error, if any.
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
    }
}
