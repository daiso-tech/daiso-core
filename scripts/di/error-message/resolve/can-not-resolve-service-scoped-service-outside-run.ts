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
    const token = genericToken("RequestService");

    // Wrong usage: resolving a scoped service outside a run() scope
    container.registerFactory({
        token,
        deps: {},
        factory: () => "_",
        lifetime: LIFETIME.SCOPED,
    });
    await container.init();
    await container.resolveOrFail(token);
}

await main();
