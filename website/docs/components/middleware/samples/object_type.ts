class AuthMiddleware implements IMiddlewareObject<[string, number], string> {
    constructor(public readonly priority: number = 100) {}

    invoke({ args, next }: MiddlewareArgs<[string, number], string>): string {
        // Authentication logic
        return next(args);
    }
}

const authMiddleware = new AuthMiddleware(100);
const wrappedFn = use(originalFn, authMiddleware);
