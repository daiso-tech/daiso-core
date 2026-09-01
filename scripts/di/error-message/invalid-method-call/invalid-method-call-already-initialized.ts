import { genericToken } from "@/di/contracts/container.contract.js";
import { Container } from "@/di/implementations/eager/container.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";

async function main(): Promise<void> {
    const container = new Container({
        executionContext: new ExecutionContext(
            new AlsExecutionContextAdapter(),
        ),
    });
    const token = genericToken("ConfigService");

    // Wrong usage: registering after the container is initialized
    await container.init();
    container.registerValue({
        token,
        value: "_",
    });
}

await main();
