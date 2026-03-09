/**
 * @module Namespace
 */

import { type IKey, type INamespace } from "@/namespace/contracts/_module.js";

/**
 * @internal
 */
class NoOpKey implements IKey {
    constructor(private readonly key: string) {}

    get(): string {
        return this.key;
    }

    toString(): string {
        return this.key;
    }

    equals(value: IKey): boolean {
        return this.toString() === value.toString();
    }
}

/**
 * The `NoOpNamespace` will disable namespacing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/namespace"`
 * @group Adapters
 */
export class NoOpNamespace implements INamespace {
    toString(): string {
        return "";
    }

    create(key: string): IKey {
        return new NoOpKey(key);
    }
}
