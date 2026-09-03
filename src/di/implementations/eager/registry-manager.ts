/**
 * @module DI
 */
import { genericToken } from "@/di/contracts/container.contract.js";
import { INTERNAL_LIFETIME } from "@/di/implementations/eager/_shared.js";
import { Registry } from "@/di/implementations/eager/registry.js";
import { tokenToString } from "@/di/implementations/eager/utils.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { DiToken } from "@/di/contracts/container.contract.js";
import type { InternalLifetime } from "@/di/implementations/eager/_shared.js";
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
    private executionContext: IExecutionContext;

    constructor(
        currentReg: CurrentRegistry<RegisterElement>,
        executionContext: IExecutionContext,
    ) {
        this.currentScopedRegistry = currentReg;
        this.executionContext = executionContext;
    }

    private currentScopedOrBaseRegistry(): Registry<RegisterElement> {
        const scopedRegistry = this.currentScopedRegistry.get();
        const noScopedRegistry = scopedRegistry === null;
        if (noScopedRegistry) {
            return this.baseRegistry;
        }

        return scopedRegistry;
    }

    public existInIsolatedRegistry(token: DiToken): boolean {
        return (
            this.has({
                token,
                type: INTERNAL_LIFETIME.SCOPED,
            }) ||
            this.has({
                token,
                type: INTERNAL_LIFETIME.SINGLETON,
            }) ||
            this.has({
                token,
                type: INTERNAL_LIFETIME.TRANSIENT,
            })
        );
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
        const registryManager = new RegistryManager(
            currentScopedRegistry,
            executionContext,
        );

        return registryManager;
    }

    save(args: {
        type: InternalLifetime;
        value: RegisterElement;
        token: DiToken;
    }): void {
        switch (args.type) {
            case INTERNAL_LIFETIME.SINGLETON:
                this.saveInBaseRegistry(args.token, args.value);
                break;
            case INTERNAL_LIFETIME.SCOPED:
                this.saveInCurrentScopedOrBaseRegistry(args.token, args.value);
                break;
            case INTERNAL_LIFETIME.TRANSIENT:
                this.saveInBaseRegistry(args.token, args.value);
                break;
            case INTERNAL_LIFETIME.DYNAMIC:
                this.executionContext.put(args.token, args.value[VALUE_KEY]);
                break;
            default:
                throw new UnexpectedError(
                    `Unexpected lifetime "${String(args.type)}" when saving a registry element for token "${tokenToString(args.token)}".`,
                );
        }
    }

    get(args: {
        type: InternalLifetime;
        token: DiToken;
    }): RegisterElement | null {
        switch (args.type) {
            case INTERNAL_LIFETIME.SINGLETON:
                return this.baseRegistry.get(args.token);
            case INTERNAL_LIFETIME.SCOPED:
                return this.currentScopedOrBaseRegistry().get(args.token);
            case INTERNAL_LIFETIME.TRANSIENT:
                return this.baseRegistry.get(args.token);
            case INTERNAL_LIFETIME.DYNAMIC: {
                const value = this.executionContext.get(args.token);
                if (value === null) {
                    return null;
                }
                return { type: REGISTER_ELEMENT_TYPE.DIRECT, value };
            }
            default:
                throw new UnexpectedError(
                    `Unexpected lifetime "${String(args.type)}" when saving a registry element for token "${tokenToString(args.token)}".`,
                );
        }
    }

    has(args: { token: DiToken; type: InternalLifetime }): boolean {
        switch (args.type) {
            case INTERNAL_LIFETIME.SINGLETON:
                return this.baseRegistry.has(args.token);
            case INTERNAL_LIFETIME.SCOPED:
                return this.currentScopedOrBaseRegistry().has(args.token);
            case INTERNAL_LIFETIME.TRANSIENT:
                return this.baseRegistry.has(args.token);
            case INTERNAL_LIFETIME.DYNAMIC: {
                return this.executionContext.exists(args.token);
            }
            default:
                throw new UnexpectedError(
                    `Unexpected lifetime "${String(args.type)}" when saving a registry element for token "${tokenToString(args.token)}".`,
                );
        }
    }

    getOrThrow(args: {
        token: DiToken;
        type: InternalLifetime;
    }): RegisterElement {
        switch (args.type) {
            case INTERNAL_LIFETIME.SINGLETON:
                return this.baseRegistry.getOrThrow(args.token);
            case INTERNAL_LIFETIME.SCOPED:
                return this.currentScopedOrBaseRegistry().getOrThrow(
                    args.token,
                );
            case INTERNAL_LIFETIME.TRANSIENT:
                return this.baseRegistry.getOrThrow(args.token);
            case INTERNAL_LIFETIME.DYNAMIC: {
                const value = this.executionContext.getOrFail(args.token);
                return { type: REGISTER_ELEMENT_TYPE.DIRECT, value };
            }
            default:
                throw new UnexpectedError(
                    `Unexpected lifetime "${String(args.type)}" when saving a registry element for token "${tokenToString(args.token)}".`,
                );
        }
    }

    getAsValueOrThrow(args: {
        token: DiToken;
        type: InternalLifetime;
    }): RegisterValueElement[typeof VALUE_KEY] {
        const element = this.getOrThrow(args);
        if (element[TYPE_KEY] !== REGISTER_ELEMENT_TYPE.DIRECT) {
            throw new UnexpectedError(
                `Registry element for token: "${tokenToString(args.token)}" is not a value. Expected a direct value element ("value") but the registered element is a function.`,
            );
        }
        return element[VALUE_KEY];
    }

    getAsFunctionOrThrow(args: {
        token: DiToken;
        type: InternalLifetime;
    }): RegisterFunctionElement[typeof VALUE_KEY] {
        const element = this.getOrThrow(args);
        if (element[TYPE_KEY] !== REGISTER_ELEMENT_TYPE.FUNC) {
            throw new UnexpectedError(
                `Registry element for token: "${tokenToString(args.token)}" is not a function. Expected a function element ("func") but the registered element is not callable.`,
            );
        }
        return element[VALUE_KEY];
    }

    private saveInBaseRegistry(token: DiToken, element: RegisterElement): void {
        this.baseRegistry.set(token, element);
    }

    private saveInCurrentScopedOrBaseRegistry(
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
