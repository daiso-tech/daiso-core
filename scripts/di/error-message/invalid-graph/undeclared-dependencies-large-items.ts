import { genericToken, LIFETIME } from "@/di/contracts/container.contract.js";
import { Container } from "@/di/implementations/eager/container.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";

import type {
    DepRecord,
    DepsTokens,
} from "@/di/contracts/container.contract.js";

import { nLarge } from "@/../scripts/di/error-message/invalid-graph/_shared.js";

async function main(): Promise<void> {
    const container = new Container({
        executionContext: new ExecutionContext(
            new AlsExecutionContextAdapter(),
        ),
    });

    // Wrong usage: declaring dependencies that are never registered
    const deps: DepsTokens<DepRecord> = {};
    for (let i = 0; i < nLarge; i++) {
        deps[`undeclared${i.toString()}`] = genericToken(
            `undeclared${i.toString()}`,
        );
    }

    container.registerFactory({
        token: genericToken("A"),
        deps,
        factory: () => "_",
        lifetime: LIFETIME.SINGLETON,
    });

    // Graph validation runs during init() and throws InvalidGraphDiError
    await container.init();
}

await main();
