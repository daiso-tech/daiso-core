import { genericToken } from "@/di/contracts/container.contract.js";
import { Container } from "@/di/implementations/eager/container.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";

function main() {
    const container = new Container({
        executionContext: new ExecutionContext(
            new AlsExecutionContextAdapter(),
        ),
    });
    const token = genericToken("UserService");

    // Wrong usage: overriding a token that was never registered
    container.overrideFactory({
        token,
        deps: {},
        factory: () => "_",
    });
}

main();
