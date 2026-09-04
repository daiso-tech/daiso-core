import { LIFETIME } from "eridu-tech/di/contracts";

container.registerFactory({
    token: SingletonService,
    factory: ({ transient }) => new SingletonService(transient),
    deps: { transient: TransientService },
    lifetime: LIFETIME.SINGLETON,
});

container.registerFactory({
    token: TransientService,
    factory: () => new TransientService(),
    deps: {},
    lifetime: LIFETIME.TRANSIENT,
});

// Throws InvalidGraphDiError because a singleton depends on a transient service
await container.init();
