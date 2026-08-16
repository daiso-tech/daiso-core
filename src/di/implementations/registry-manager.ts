import {
    genericToken,
    type DiToken,
} from "@/di/contracts/container.contract.js";
import { Registry } from "@/di/implementations/registry.js";
import { tokenToString } from "@/di/implementations/utils.js";
import { type IExecutionContext } from "@/execution-context/contracts/execution-context.contract.js";
import { UnexpectedError } from "@/utilities/errors.js";

export const REGISTER_ELEMENT_TYPE = {
    DIRECT: "value",
    FUNC: "func",
} as const;

const VALUE_KEY = "value";
const TYPE_KEY = "type";

type TRegisterValueElement = {
    [TYPE_KEY]: typeof REGISTER_ELEMENT_TYPE.DIRECT;
    [VALUE_KEY]: unknown;
};

type TRegisterFunctionElement = {
    type: typeof REGISTER_ELEMENT_TYPE.FUNC;
    [VALUE_KEY]: () => Promise<unknown>;
};

export type TRegisterElement = TRegisterValueElement | TRegisterFunctionElement;

export type TRegisterValueType =
    (typeof REGISTER_ELEMENT_TYPE)[keyof typeof REGISTER_ELEMENT_TYPE];

export type TCurrentRegistry<T> = {
    get(): Registry<T> | null;
    set(registry: Registry<T>): void;
};

export class RegistryManager {
    private baseRegistry: Registry<TRegisterElement> =
        new Registry<TRegisterElement>();
    private currentScopedRegistry: TCurrentRegistry<TRegisterElement>;

    constructor(currentReg: TCurrentRegistry<TRegisterElement>) {
        this.currentScopedRegistry = currentReg;
    }

    private currentScopedOrBaseRegistry(): Registry<TRegisterElement> {
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
        const REGISTRY_KEY = genericToken<Registry<TRegisterElement>>(
            "the registry associated with current scope",
        );

        const currentScopedRegistry: TCurrentRegistry<TRegisterElement> = {
            get: () => executionContext.get(REGISTRY_KEY),
            set: (registry) => executionContext.put(REGISTRY_KEY, registry),
        };
        const registryManager = new RegistryManager(currentScopedRegistry);

        return registryManager;
    }

    has(token: DiToken): boolean {
        return this.currentScopedOrBaseRegistry().has(token);
    }
    get(token: DiToken): TRegisterElement | null {
        return this.currentScopedOrBaseRegistry().get(token);
    }
    getOrThrow(token: DiToken): TRegisterElement {
        return this.currentScopedOrBaseRegistry().getOrThrow(token);
    }

    getAsValueOrThrow(token: DiToken): TRegisterValueElement[typeof VALUE_KEY] {
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
    ): TRegisterFunctionElement[typeof VALUE_KEY] {
        const element = this.getOrThrow(token);
        if (element[TYPE_KEY] !== REGISTER_ELEMENT_TYPE.FUNC) {
            throw new UnexpectedError(
                `Registry element for token: "${tokenToString(token)}" is not a function. Expected a function element ("func") but the registered element is not callable.`,
            );
        }
        return element[VALUE_KEY];
    }

    saveInBaseRegistry(token: DiToken, element: TRegisterElement): void {
        this.baseRegistry.set(token, element);
    }

    saveInCurrentScopedOrBaseRegistry(
        token: DiToken,
        element: TRegisterElement,
    ): void {
        this.currentScopedOrBaseRegistry().set(token, element);
    }

    initNewScopedRegistry(): void {
        const oldLayer: Registry<TRegisterElement> =
            this.currentScopedOrBaseRegistry();
        const newLayer = new Registry(oldLayer);
        this.currentScopedRegistry.set(newLayer);
    }

    public clear(): void {
        this.currentScopedOrBaseRegistry().clear();
    }
}
