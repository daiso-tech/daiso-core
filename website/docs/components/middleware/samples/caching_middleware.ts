const createCachingMiddleware = <T extends unknown[]>(
    cacheStore: Map<string, unknown> = new Map(),
): MiddlewareFn<T, unknown> => {
    return ({ args, next }: MiddlewareArgs<T, unknown>) => {
        const cacheKey: string = JSON.stringify(args);

        if (cacheStore.has(cacheKey)) {
            console.log("Cache hit!");
            return cacheStore.get(cacheKey); // Skip next()
        }

        const result = next(args);
        cacheStore.set(cacheKey, result);
        return result;
    };
};

const cache = new Map<string, unknown>();
const cachingMiddleware = createCachingMiddleware(cache);
