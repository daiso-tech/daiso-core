import { LIFETIME } from "eridu-tech/di/contracts";
import { container } from "./container";
import { CONFIG } from "./app_config";
import { Database } from "./database";
import { IDatabase } from "./idatabase";
import { IDATABASE } from "./generic_token";

container.registerFactory({
    token: IDATABASE,
    factory: () => new Database(),
    deps: {},
    lifetime: LIFETIME.SINGLETON,
});

container.registerValue({
    token: CONFIG,
    value: { apiUrl: "https://api.example.com", timeout: 5000 },
});

class MockDatabase implements IDatabase {
    query(sql: string, params: Array<unknown>): Promise<unknown> {
        /* ... */
        return Promise.resolve();
    }

    async connect(): Promise<void> {
        console.log("connected");
    }

    async disconnect(): Promise<void> {
        console.log("disconnected");
    }
}

// Override a registered factory service
container.overrideFactory({
    token: IDATABASE,
    factory: async (_deps, _executionContext) => {
        // Return a mock database for testing
        return new MockDatabase();
    },
    deps: {},
});

// Override a registered singleton value
container.overrideValue({
    token: CONFIG,
    value: { apiUrl: "http://localhost:9999", timeout: 100 },
});
