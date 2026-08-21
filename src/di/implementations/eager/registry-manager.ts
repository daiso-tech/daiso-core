/**
 * @module DI
 */
import { genericToken } from "@/di/contracts/container.contract.js";
import { Registry } from "@/di/implementations/eager/registry.js";
import { tokenToString } from "@/di/implementations/eager/utils.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { DiToken } from "@/di/contracts/container.contract.js";
import type { IExecutionContext } from "@/execution-context/contracts/_module-exports.js";

/**
 * @internal
 */
export const REGISTER_ELEMENT_TYPE = {
    DIRECT: "value",
    FUNC: "func",
} as const;

/**
 * @internal
 */
const VALUE_KEY = "value";

/**
 * @internal
 */
const TYPE_KEY = "type";

/**
 * @internal
 */
type RegisterValueElement = {
    [TYPE_KEY]: typeof REGISTER_ELEMENT_TYPE.DIRECT;
    [VALUE_KEY]: unknown;
};

/**
 * @internal
 */
type RegisterFunctionElement = {
    type: typeof REGISTER_ELEMENT_TYPE.FUNC;
    [VALUE_KEY]: () => Promise<unknown>;
};

/**
 * @internal
 */
export type RegisterElement = RegisterValueElement | RegisterFunctionElement;

/**
 * @internal
 */
export type RegisterValueType =
    (typeof REGISTER_ELEMENT_TYPE)[keyof typeof REGISTER_ELEMENT_TYPE];

/**
 * @internal
 */
export type CurrentRegistry<T> = {
    get(): Registry<T> | null;
    set(registry: Registry<T>): void;
};

/**
 * @internal
 */
export class RegistryManager {
    private baseRegistry: Registry<RegisterElement> =
        new Registry<RegisterElement>();
    private currentScopedRegistry: CurrentRegistry<RegisterElement>;

    constructor(currentReg: CurrentRegistry<RegisterElement>) {
        this.currentScopedRegistry = currentReg;
    }

    private currentScopedOrBaseRegistry(): Registry<RegisterElement> {
        const scopedRegistry = this.currentScopedRegistry.get();
        const noScopedRegistry = scopedRegistry === null;
        if (noScopedRegistry) {
            return this.baseRegistry;
        }

        return scopedRegistry;
    }

    static withExecutionContext(
        executionContext: IExecutionContext,
    ): RegistryManager {
        const REGISTRY_KEY = genericToken<Registry<RegisterElement>>(
            "the registry associated with current scope",
        );

        const currentScopedRegistry: CurrentRegistry<RegisterElement> = {
            get: () => executionContext.get(REGISTRY_KEY),
            set: (registry) => executionContext.put(REGISTRY_KEY, registry),
        };
        const registryManager = new RegistryManager(currentScopedRegistry);

        return registryManager;
    }

    has(token: DiToken): boolean {
        return this.currentScopedOrBaseRegistry().has(token);
    }
    get(token: DiToken): RegisterElement | null {
        return this.currentScopedOrBaseRegistry().get(token);
    }
    getOrThrow(token: DiToken): RegisterElement {
        return this.currentScopedOrBaseRegistry().getOrThrow(token);
    }

    getAsValueOrThrow(token: DiToken): RegisterValueElement[typeof VALUE_KEY] {
        const element = this.getOrThrow(token);
        if (element[TYPE_KEY] !== REGISTER_ELEMENT_TYPE.DIRECT) {
            throw new UnexpectedError(
                `Registry element for token: "${tokenToString(token)}" is not a value. Expected a direct value element ("value") but the registered element is a function.`,
            );
        }
        return element[VALUE_KEY];
    }

    getAsFunctionOrThrow(
        token: DiToken,
    ): RegisterFunctionElement[typeof VALUE_KEY] {
        const element = this.getOrThrow(token);
        if (element[TYPE_KEY] !== REGISTER_ELEMENT_TYPE.FUNC) {
            throw new UnexpectedError(
                `Registry element for token: "${tokenToString(token)}" is not a function. Expected a function element ("func") but the registered element is not callable.`,
            );
        }
        return element[VALUE_KEY];
    }

    saveInBaseRegistry(token: DiToken, element: RegisterElement): void {
        this.baseRegistry.set(token, element);
    }

    saveInCurrentScopedOrBaseRegistry(
        token: DiToken,
        element: RegisterElement,
    ): void {
        this.currentScopedOrBaseRegistry().set(token, element);
    }

    initNewScopedRegistry(): void {
        const oldLayer: Registry<RegisterElement> =
            this.currentScopedOrBaseRegistry();
        const newLayer = new Registry(oldLayer);
        this.currentScopedRegistry.set(newLayer);
    }

    public clear(): void {
        this.currentScopedOrBaseRegistry().clear();
    }
}
