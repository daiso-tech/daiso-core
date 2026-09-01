import { genericToken, LIFETIME } from "@/di/contracts/container.contract.js";
import { Container } from "@/di/implementations/eager/container.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { nLarge } from "./_shared.js";

async function main(): Promise<void> {
    const container = new Container({
        executionContext: new ExecutionContext(
            new AlsExecutionContextAdapter(),
        ),
    });

    // Wrong usage: singleton services each depending on themselves (cycles)
    for (let i = 0; i < nLarge; i++) {
        const token = genericToken(`Node${i.toString()}`);
        container.registerFactory({
            token,
            deps: { self: token },
            factory: () => "_",
            lifetime: LIFETIME.SINGLETON,
        });
    }

    // Graph validation runs during init() and throws InvalidGraphDiError
    await container.init();
}

await main();
