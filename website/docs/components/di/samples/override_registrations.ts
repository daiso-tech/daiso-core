import { container } from "./initial_configuration";
import { CONFIG } from "./app_config";
import { IDatabase, IDATABASE } from "./database";

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
