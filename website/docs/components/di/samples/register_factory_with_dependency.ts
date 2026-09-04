import { LIFETIME } from "eridu-tech/di/contracts";
import { container } from "./initial_configuration";
import { IDATABASE } from "./database";
import { UserProvider } from "./user_provider";

// `UserProvider` service requires `IDATABASE` dependency
container.registerFactory({
    token: UserProvider,
    deps: { db: IDATABASE },
    factory: (deps) => new UserProvider(deps.db),
    lifetime: LIFETIME.SINGLETON,
});
