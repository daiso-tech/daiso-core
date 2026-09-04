import {
    withPlugin,
    type PluginFn,
    type MiddlewareFn,
} from "eridu-tech/middleware";

class UserService {
    async getUser(id: string): Promise<{ name: string }> {
        return { name: "Alice" };
    }

    async deleteUser(id: string): Promise<void> {
        // Deletion logic
    }
}

function withPerformanceLogging<
    TParameters extends Array<unknown>,
    TReturn,
>(): MiddlewareFn<TParameters, Promise<TReturn>> {
    return async ({ args, next, name }) => {
        const start = performance.now();
        const returnValue = await next(args);
        const end = performance.now();
        const timeInMs = end - start;
        console.log(`function/method ${name} took ${timeInMs}ms`);
        return returnValue;
    };
}

// Define a logging plugin
const loggingPlugin: PluginFn<UserService> = (service, enhance) => {
    enhance(service, "getUser", withPerformanceLogging());

    enhance(service, "deleteUser", withPerformanceLogging());
};

// Apply the plugin to a class instance
const service = new UserService();
const enhancedService = withPlugin(service, loggingPlugin);

await enhancedService.getUser("123");
// Logs:
// getUser called with: ["123"]
// getUser returned: { name: "Alice" }

// The original service is NOT modified — a copy is returned instead
