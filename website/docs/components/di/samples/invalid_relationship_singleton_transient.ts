import { LIFETIME } from "eridu-tech/di/contracts";
import { container } from "./initial_configuration";
import { A, B, C } from "./dependency_chain";

container.registerFactory({
    token: A,
    factory: () => new A(),
    deps: {},
    lifetime: LIFETIME.TRANSIENT,
});

container.registerFactory({
    token: B,
    factory: ({ a }) => new B(a),
    deps: { a: A },
    lifetime: LIFETIME.TRANSIENT,
});

// ❌ Service is registered as `LIFETIME.SINGLETON`
// and its `transient` dependency is `LIFETIME.TRANSIENT`
container.registerFactory({
    token: C,
    factory: ({ b }) => new C(b),
    deps: { b: B },
    lifetime: LIFETIME.SINGLETON,
});

// will throw InvalidGraphDiError
container.init() 
