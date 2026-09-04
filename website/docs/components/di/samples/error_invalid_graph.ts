import { InvalidGraphDiError, LIFETIME } from "eridu-tech/di/contracts";
import { container } from "./container";
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

// ❌ A singleton (C) cannot depend on a transient (B)
container.registerFactory({
    token: C,
    factory: ({ b }) => new C(b),
    deps: { b: B },
    lifetime: LIFETIME.SINGLETON,
});

// Throws InvalidGraphDiError because a singleton depends on a transient service
try {
    await container.init();
} catch (error) {
    if (error instanceof InvalidGraphDiError) {
        console.error(error);
    } else {
        throw error;
    }
}
