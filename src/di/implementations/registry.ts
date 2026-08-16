import { type DiToken } from "@/di/contracts/container.contract.js";
import { tokenToString } from "@/di/implementations/utils.js";
import { UnexpectedError } from "@/utilities/errors.js";

export interface IRegister<T> {
    has(token: DiToken): boolean;
    get(token: DiToken): T | null;
    getOrThrow(token: DiToken): T;
    set(token: DiToken, value: T): void;
}

/**
 * A layered key-value store for DI tokens.
 *
 * @remarks
 * A value of `null` or `undefined` is treated as non-existent: it is
 * indistinguishable from an absent token and is reported as "not found" by
 * `get` / `getOrThrow`. For this reason `T` should not be `null` or
 * `undefined`.
 *
 * @typeParam T - The type of stored values. Must not be `null` or `undefined`.
 */
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
        const value =
            this.map.get(token) ?? this.getParent()?.get(token) ?? null;
        return value !== null;
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
            throw new UnexpectedError(
                `Token not found in registry: "${tokenToString(
                    token,
                )}". No value is registered for this token.`,
            );
        }

        const value = this.get(token);

        if (value === null) {
            throw new UnexpectedError(
                `Token not found in registry: "${tokenToString(
                    token,
                )}". No value is registered for this token.`,
            );
        }

        return value;
    }

    /** Sets the value for the token in this layer. */
    public set(token: DiToken, value: T): void {
        this.map.set(token, value);
    }

    public clear(): void {
        this.map.clear();
        this.getParent()?.clear();
    }
}
