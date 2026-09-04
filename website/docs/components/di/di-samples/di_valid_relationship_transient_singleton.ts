import { LIFETIME } from "eridu-tech/di/contracts";

container.registerFactory({
    token: Database,
    factory: () => new Database(),
    deps: {},
    lifetime: LIFETIME.SINGLETON,
});

// ✅ Service is registered as `LIFETIME.TRANSIENT`
// and its `db` dependency is `LIFETIME.SINGLETON`
container.registerFactory({
    token: UserRepository,
    factory: ({ db }) => new UserRepository(db),
    deps: { db: Database },
    lifetime: LIFETIME.TRANSIENT,
});

// container.init() will not throw InvalidGraphDiError
