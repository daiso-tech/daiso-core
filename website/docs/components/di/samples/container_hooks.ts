import { LIFETIME } from "eridu-tech/di/contracts";
import { container } from "./container";
import { Database } from "./database";

container.registerFactory({
    token: Database,
    factory: () => new Database(),
    deps: {},
    lifetime: LIFETIME.SINGLETON,
});

container.onContainerInit(async (resolver) => {
    // Runs when container.init() is called
    // Use the resolver to resolve services after all registrations are complete
    const db = await resolver.resolveOrFail(Database);
    await db.connect();
    console.log("Container initialized");
});

container.onContainerDeInit(async (resolver) => {
    // Runs when container.deInit() is called
    const db = await resolver.resolveOrFail(Database);
    await db.disconnect();
    console.log("Container deinitialized");
});

// Trigger the lifecycle
await container.init();
// ... application runs ...
await container.deInit();
