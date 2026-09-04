const createErrorHandlingMiddleware = (
    errorHandler?: (error: unknown) => void,
): MiddlewareFn<[string, number], Promise<string>> => {
    return async ({
        args,
        next,
    }: MiddlewareArgs<[string, number], Promise<string>>): Promise<string> => {
        try {
            return await next(args);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            console.error("Error occurred:", message);
            if (errorHandler) errorHandler(error);
            throw error;
        }
    };
};

const errorHandlingMiddleware = createErrorHandlingMiddleware((error) =>
    console.log("Error handled gracefully"),
);
