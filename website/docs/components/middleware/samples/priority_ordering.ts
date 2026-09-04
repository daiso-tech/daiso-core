const createPriorityMiddleware = (
    name: string,
    priority: number,
): IMiddlewareObject<[string], string> => ({
    priority,
    invoke: ({ args, next }: MiddlewareArgs<[string], string>): string => {
        console.log(`${priority}. ${name}`);
        return next(args);
    },
});

const authMiddleware = createPriorityMiddleware("Auth", 10);
const validationMiddleware = createPriorityMiddleware("Validation", 20);
const loggingMiddleware = createPriorityMiddleware("Logging", 30);

const wrappedFn = use(
    (value: string): string => value.toUpperCase(),
    [loggingMiddleware, validationMiddleware, authMiddleware],
);

// Executes in order: Auth -> Validation -> Logging -> Original function
