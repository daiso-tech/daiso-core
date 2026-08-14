import { genericToken } from "@/di/contracts/container.contract.js";
import { Container } from "@/di/implementations/container.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/als-execution-context-adapter.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";

const container = new Container({
    executionContext: new ExecutionContext(new AlsExecutionContextAdapter()),
});

class A {}
async function f() {
    await container.init();
    await container.run({
        scope: () => {
            container.registerClass({ deps: [], impl: A });
        },
    });
}

f();
