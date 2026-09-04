import { LIFETIME } from "eridu-tech/di/contracts";
import { container } from "./container";
import { Database } from "./database";
import { IDATABASE } from "./generic_token";

// `IDATABASE` service requires no dependency
container.registerFactory({
    token: IDATABASE,
    deps: {}, // No dependencies
    factory: (deps) => new Database(),
    lifetime: LIFETIME.SINGLETON,
});
