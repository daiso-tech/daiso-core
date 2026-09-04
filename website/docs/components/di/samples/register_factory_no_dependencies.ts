import { LIFETIME } from "eridu-tech/di/contracts";
import { container } from "./initial_configuration";
import { Database, IDATABASE } from "./database";

// `IDATABASE` service requires no dependency
container.registerFactory({
    token: IDATABASE,
    deps: {}, // No dependencies
    factory: (deps) => new Database(),
    lifetime: LIFETIME.SINGLETON,
});
