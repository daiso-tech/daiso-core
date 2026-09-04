const createAsyncValidationMiddleware = (
    validator: (args: [string, number]) => Promise<boolean>,
): MiddlewareFn<[string, number], Promise<string>> => {
    return async ({
        args,
        next,
    }: MiddlewareArgs<[string, number], Promise<string>>): Promise<string> => {
        // Perform async validation
        const isValid = await validator(args);
        if (!isValid) throw new Error("Validation failed");
        return await next(args);
    };
};

const asyncValidationMiddleware =
    createAsyncValidationMiddleware(validateAsync);
const wrappedFn = use(originalFn, asyncValidationMiddleware);
