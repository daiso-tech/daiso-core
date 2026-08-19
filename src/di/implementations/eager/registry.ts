/**
 * @module DI
 */
import { tokenToString } from "@/di/implementations/eager/utils.js";
import { UnexpectedError } from "@/utilities/errors.js";

import type { DiToken } from "@/di/contracts/container.contract.js";

/**
 * @internal
 */
export class Registry<T> {
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

    has(token: DiToken): boolean {
        const value =
            this.map.get(token) ?? this.getParent()?.get(token) ?? null;
        return value !== null;
    }

    get(token: DiToken): T | null {
        if (this.map.has(token)) {
            const value = this.map.get(token);
            return value === undefined ? null : value;
        }
        return this.getParent()?.get(token) ?? null;
    }

    getOrThrow(token: DiToken): T {
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

    set(token: DiToken, value: T): void {
        this.map.set(token, value);
    }

    clear(): void {
        this.map.clear();
        this.getParent()?.clear();
    }
}
