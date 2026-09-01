import { genericToken, LIFETIME } from "@/di/contracts/container.contract.js";
import { Container } from "@/di/implementations/eager/container.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";

async function main(): Promise<void> {
    const container = new Container({
        executionContext: new ExecutionContext(
            new AlsExecutionContextAdapter(),
        ),
    });
    const scopedToken = genericToken("RequestContext");
    const transientToken = genericToken("UserService");

    // Wrong usage: resolving a transient service that depends on a scoped
    // service outside a run() scope
    container.registerFactory({
        token: scopedToken,
        deps: {},
        factory: () => "_",
        lifetime: LIFETIME.SCOPED,
    });
    container.registerFactory({
        token: transientToken,
        deps: { context: scopedToken },
        factory: () => "_",
        lifetime: LIFETIME.TRANSIENT,
    });
    await container.init();
    await container.resolveOrFail(transientToken);
}

await main();
