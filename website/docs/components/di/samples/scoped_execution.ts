import { LIFETIME } from "eridu-tech/di/contracts";
import { container } from "./container";

class A {
    // ...
}

// Register a scoped service
container.registerFactory({
    token: A,
    deps: {},
    factory: () => new A(),
    lifetime: LIFETIME.SCOPED,
});

await container.init();
await container.run({
    scope: async () => {
        // Scoped services are resolved once within this scope
        const a1 = await container.resolveOrFail(A);
        const a2 = await container.resolveOrFail(A);

        console.log(a1 === a2); // true

        // A nested scope creates a new scoped registry, so it gets its own
        // instance of the scoped service
        await container.run({
            scope: async () => {
                const nestedA = await container.resolveOrFail(A);
                console.log(nestedA === a1); // false
            },
        });
    },
});

// Outside the scope, scoped services are no longer available
// A new scope would create new instances
