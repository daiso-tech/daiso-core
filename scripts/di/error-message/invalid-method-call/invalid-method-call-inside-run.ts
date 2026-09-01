import { Container } from "@/di/implementations/eager/container.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";

async function main(): Promise<void> {
    const container = new Container({
        executionContext: new ExecutionContext(
            new AlsExecutionContextAdapter(),
        ),
    });

    // Wrong usage: calling a forbidden method inside a run() scope
    await container.init();
    await container.run({
        scope: async () => {
            await container.deInit();
        },
    });
}

await main();
