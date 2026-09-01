import { genericToken, LIFETIME } from "@/di/contracts/container.contract.js";
import { Container } from "@/di/implementations/eager/container.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";

function main() {
    const container = new Container({
        executionContext: new ExecutionContext(
            new AlsExecutionContextAdapter(),
        ),
    });
    const token = genericToken("ConfigService");

    // Wrong usage: registering the same token twice
    container.registerFactory({
        token,
        deps: {},
        factory: () => "_",
        lifetime: LIFETIME.SINGLETON,
    });
    container.registerFactory({
        token,
        deps: {},
        factory: () => "_",
        lifetime: LIFETIME.SINGLETON,
    });
}

main();
