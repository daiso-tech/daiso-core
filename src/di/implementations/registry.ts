import { type DiToken } from "@/di/contracts/container.contract.js";

export interface IRegister<T> {
    has(token: DiToken): boolean;
    get(token: DiToken): T | null;
    getOrThrow(token: DiToken): T;
    set(token: DiToken, value: T): void;
}

export class Registry<T> implements IRegister<T> {
    private map = new Map<DiToken, T>();

    constructor(private parent?: Registry<T> | (() => Registry<T>)) {}

    private getParent(): Registry<T> | undefined {
        if (this.parent === undefined) {
            return undefined;
        } else if (this.parent instanceof Registry) {
            return this.parent;
        } else {
            return this.parent();
        }
    }

    /** Whether the token exists in this layer or any parent layer. */
    public has(token: DiToken): boolean {
        return this.map.has(token) || (this.getParent()?.has(token) ?? false);
    }

    /** Returns the value for the token from the nearest layer.
     * Checks the current layer first; if not found, delegates to the parent.
     * Returns `null` if the token is not found in any layer.
     * Always converts `undefined` to `null`. */
    public get(token: DiToken): T | null {
        if (this.map.has(token)) {
            const value = this.map.get(token);
            return value === undefined ? null : value;
        }
        return this.getParent()?.get(token) ?? null;
    }

    public getOrThrow(token: DiToken): T {
        if (!this.has(token)) {
            throw new Error();
        }

        const value = this.get(token);

        if (value === null) {
            throw new Error();
        }

        return value;
    }

    /** Sets the value for the token in this layer. */
    public set(token: DiToken, value: T): void {
        this.map.set(token, value);
    }
}

type TCurrentRegistry<T> = {
    get(): Registry<T> | null;
    set(registry: Registry<T>): void;
};

type TCurrentLevel = {
    get(): number | null;
    set(registry: number): void;
};

export class RegistryManager<T> {
    private baseRegistry: Registry<T> = new Registry<T>();

    public currentScopedOrBaseRegistry(): Registry<T> {
        const scopedRegistry = this.args.currentScopedRegistry.get();
        const noScopedRegistry = scopedRegistry === null;
        if (noScopedRegistry) {
            return this.baseRegistry;
        }

        return scopedRegistry;
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
            currentScopedRegistry: TCurrentRegistry<T>;
            currentScopeDepth: TCurrentLevel;
        },
    ) {}
    has(token: DiToken): boolean {
        return this.currentScopedOrBaseRegistry().has(token);
    }
    get(token: DiToken): T | null {
        return this.currentScopedOrBaseRegistry().get(token);
    }
    getOrThrow(token: DiToken): T {
        return this.currentScopedOrBaseRegistry().getOrThrow(token);
    }

    setInBaseRegistry(token: DiToken, value: T): void {
        this.baseRegistry.set(token, value);
    }

    setInCurrentScopedRegistry(token: DiToken, value: T): void {
        this.currentScopedOrBaseRegistry().set(token, value);
    }

    public initNewScope(): void {
        const oldLayer: Registry<T> = this.currentScopedOrBaseRegistry();
        const level = this.currentScopeDepthOrZero();

        const newLayer = new Registry(oldLayer);
        this.args.currentScopedRegistry.set(newLayer);
        this.args.currentScopeDepth.set(level + 1);
    }
}
