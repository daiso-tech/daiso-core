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
    const token = genericToken("Database");

    // Wrong usage: overriding a token a second time
    container.registerFactory({
        token,
        deps: {},
        factory: () => "_",
        lifetime: LIFETIME.SINGLETON,
    });
    container.overrideFactory({
        token,
        deps: {},
        factory: () => "_",
    });
    container.overrideFactory({
        token,
        deps: {},
        factory: () => "_",
    });
}

main();
