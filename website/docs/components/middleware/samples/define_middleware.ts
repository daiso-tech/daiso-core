import { defineMiddleware, type MiddlewareFn } from "eridu-tech/middleware";

const loggingMiddleware = defineMiddleware(
    <T extends unknown[], R>({ args, next }: MiddlewareArgs<T, R>): R => {
        console.log("Before:", args);
        const result = next(args);
        console.log("After:", result);
        return result;
    },
);
