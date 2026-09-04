import { LIFETIME } from "eridu-tech/di/contracts";

container.registerFactory({
    token: TransientService,
    factory: () => new TransientService(),
    deps: {},
    lifetime: LIFETIME.TRANSIENT,
});

// ❌ Service is registered as `LIFETIME.SINGLETON`
// and its `transient` dependency is `LIFETIME.TRANSIENT`
container.registerFactory({
    token: SingletonService,
    factory: ({ transient }) => new SingletonService(transient),
    deps: { transient: TransientService },
    lifetime: LIFETIME.SINGLETON,
});

// container.init() will throw InvalidGraphDiError
