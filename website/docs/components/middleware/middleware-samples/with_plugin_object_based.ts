import { type IPluginObject, type MiddlewareFn } from "eridu-tech/middleware";

class MetricsPlugin implements IPluginObject<UserService> {
    constructor(private readonly metricsClient: MetricsClient) {}

    invoke(service: UserService, enhance: Enhance): void {
        const metricsMiddleware: MiddlewareFn<
            [string],
            Promise<{ name: string }>
        > = async ({ args, next }) => {
            const start = performance.now();
            const result = await next(args);
            const duration = performance.now() - start;
            this.metricsClient.record("getUser", duration);
            return result;
        };

        enhance(service, "getUser", metricsMiddleware);
    }
}

const service = new UserService();
const enhancedService = withPlugin(service, new MetricsPlugin(client));
