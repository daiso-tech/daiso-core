import {
    genericToken,
    type DiToken,
} from "@/di/contracts/container.contract.js";
import { Registry } from "@/di/implementations/registry.js";
import { type IExecutionContext } from "@/execution-context/contracts/execution-context.contract.js";

export const REGISTER_ELEMENT_TYPE = {
    DIRECT: "value",
    FUNC: "func",
} as const;

type TRegisterValueElement = {
    type: typeof REGISTER_ELEMENT_TYPE.DIRECT;
    value: unknown;
};

type TRegisterFunctionElement = {
    type: typeof REGISTER_ELEMENT_TYPE.FUNC;
    value: () => Promise<unknown>;
};
export type TRegisterElement = TRegisterValueElement | TRegisterFunctionElement;

export type TRegisterValueType =
    (typeof REGISTER_ELEMENT_TYPE)[keyof typeof REGISTER_ELEMENT_TYPE];

export type TCurrentRegistry<T> = {
    get(): Registry<T> | null;
    set(registry: Registry<T>): void;
};

export type TCurrentLevel = {
    get(): number | null;
    set(registry: number): void;
};

export class RegistryManager {
    private baseRegistry: Registry<TRegisterElement> =
        new Registry<TRegisterElement>();

    public currentScopedOrBaseRegistry(): Registry<TRegisterElement> {
        const scopedRegistry = this.args.currentScopedRegistry.get();
        const noScopedRegistry = scopedRegistry === null;
        if (noScopedRegistry) {
            return this.baseRegistry;
        }

        return scopedRegistry;
    }

    public static withExecutionContext(
        executionContext: IExecutionContext,
    ): RegistryManager {
        const SCOPE_DEPTH_KEY = genericToken<number>(
            "the depth level associated with current scope",
        );
        const REGISTRY_KEY = genericToken<Registry<TRegisterElement>>(
            "the registry associated with current scope",
        );

        return new RegistryManager({
            currentScopeDepth: {
                get: () => executionContext.get(SCOPE_DEPTH_KEY),
                set: (depth) => executionContext.put(SCOPE_DEPTH_KEY, depth),
            },

            currentScopedRegistry: {
                get: () => executionContext.get(REGISTRY_KEY),
                set: (registry) => executionContext.put(REGISTRY_KEY, registry),
            },
        });
    }

    public currentScopeDepthOrZero(): number {
        const scopeDepth = this.args.currentScopeDepth.get();
        const scopeDepthIsZero = scopeDepth === null;

        if (scopeDepthIsZero) {
            return 0;
        }
        return scopeDepth;
    }

    constructor(
        private args: {
            currentScopedRegistry: TCurrentRegistry<TRegisterElement>;
            currentScopeDepth: TCurrentLevel;
        },
    ) {}
    has(token: DiToken): boolean {
        return this.currentScopedOrBaseRegistry().has(token);
    }
    get(token: DiToken): TRegisterElement | null {
        return this.currentScopedOrBaseRegistry().get(token);
    }
    getOrThrow(token: DiToken): TRegisterElement {
        return this.currentScopedOrBaseRegistry().getOrThrow(token);
    }

    getAsValueOrThrow(token: DiToken): TRegisterValueElement["value"] {
        const element = this.getOrThrow(token);
        if (element.type !== REGISTER_ELEMENT_TYPE.DIRECT) {
            throw new Error();
        }
        return element.value;
    }

    getAsFunctionOrThrow(token: DiToken): TRegisterFunctionElement["value"] {
        const element = this.getOrThrow(token);
        if (element.type !== REGISTER_ELEMENT_TYPE.FUNC) {
            throw new Error();
        }
        return element.value;
    }

    saveInBaseRegistry(token: DiToken, value: TRegisterElement): void {
        this.throwErrorIfElementExistAlready(token);
        this.baseRegistry.set(token, value);
    }

    private throwErrorIfElementExistAlready(token: DiToken) {
        if (this.currentScopedOrBaseRegistry().has(token)) {
            throw new Error();
        }
    }

    saveInCurrentScopedOrBaseRegistry(
        token: DiToken,
        value: TRegisterElement,
    ): void {
        this.currentScopedOrBaseRegistry().set(token, value);
    }

    public initNewScope(): void {
        const oldLayer: Registry<TRegisterElement> =
            this.currentScopedOrBaseRegistry();
        const level = this.currentScopeDepthOrZero();

        const newLayer = new Registry(oldLayer);
        this.args.currentScopedRegistry.set(newLayer);
        this.args.currentScopeDepth.set(level + 1);
    }
}
