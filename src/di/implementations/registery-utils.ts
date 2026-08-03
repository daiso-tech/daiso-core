import { genericToken } from "@/di/contracts/container.contract.js";
import {
    RegistryManager,
    type Registry,
} from "@/di/implementations/registry.js";
import { type IExecutionContext } from "@/execution-context/contracts/execution-context.contract.js";

export function setUpRegistryMangerWithExecutionContext<T>(
    executionContext: IExecutionContext,
): RegistryManager<T> {
    const SCOPE_DEPTH_KEY = genericToken<number>(
        "the depth level associated with current scope",
    );
    const REGISTRY_KEY = genericToken<Registry<T>>(
        "the registry  associated with current scope",
    );

    const manger = new RegistryManager<T>({
        currentScopeDepth: {
            get: () => executionContext.get(SCOPE_DEPTH_KEY),
            set: (depth) => executionContext.put(SCOPE_DEPTH_KEY, depth),
        },

        currentScopedRegistry: {
            get: () => executionContext.get(REGISTRY_KEY),
            set: (registry) => executionContext.put(REGISTRY_KEY, registry),
        },
    });

    return manger;
}
