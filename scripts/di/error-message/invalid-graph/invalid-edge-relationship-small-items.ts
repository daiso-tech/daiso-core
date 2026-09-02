import { genericToken, LIFETIME } from "@/di/contracts/container.contract.js";
import { Container } from "@/di/implementations/eager/container.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";

import type {
    DepRecord,
    DepsTokens,
} from "@/di/contracts/container.contract.js";

import { nSmall } from "@/../scripts/di/error-message/invalid-graph/_shared.js";

async function main(): Promise<void> {
    const container = new Container({
        executionContext: new ExecutionContext(
            new AlsExecutionContextAdapter(),
        ),
    });

    // Wrong usage: a singleton depending on scoped services (invalid edges)
    const deps: DepsTokens<DepRecord> = {};
    for (let i = 0; i < nSmall; i++) {
        const scopedToken = genericToken(`Scoped${i.toString()}`);
        deps[`s${i.toString()}`] = scopedToken;
        container.registerFactory({
            token: scopedToken,
            deps: {},
            factory: () => "_",
            lifetime: LIFETIME.SCOPED,
        });
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
