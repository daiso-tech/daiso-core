/**
 * @module Namespace
 */

import { type IKey, type INamespace } from "@/namespace/contracts/_module.js";
import { type ISerializable } from "@/serde/contracts/flexible-serde.contract.js";
import {
    resolveOneOrMoreStr,
    resolveOneOrMore,
    UnexpectedError,
    type OneOrMore,
} from "@/utilities/_module.js";

/**
 * @internal
 */
type KeySettings = {
    prefixArr: Array<string>;
    key: string;
    delimiter: string;
};

/**
 * @internal
 */
class Key implements IKey {
    private readonly prefixArr: Array<string>;
    private readonly key: string;
    private readonly delimiter: string;

    /**
     *
     * @internal
     */
    constructor(settings: KeySettings) {
        const { prefixArr, key, delimiter } = settings;
        this.prefixArr = prefixArr;
        this.key = key;
        this.delimiter = delimiter;
    }

    get(): string {
        return this.key;
    }

    toString(): string {
        return resolveOneOrMoreStr(
            [...this.prefixArr, this.key],
            this.delimiter,
        );
    }

    equals(value: IKey): boolean {
        return this.toString() === value.toString();
    }
}

/**
 * Configuration for the `Namespace` class.
 *
 * IMPORT_PATH: `"@daiso-tech/core/namespace"`
 */
export type NamespaceSettings = {
    /**
     * The separator character inserted between each namespace segment.
     * @default ":"
     */
    delimiter?: string;

    /**
     * The string appended to the root namespace segment to distinguish it.
     * @default "_rt"
     */
    rootIdentifier?: string;
};

export type SerializedNamespace = {
    version: "1";
    root: string | Array<string>;
    delimiter: string;
    rootIdentifier: string;
};

/**
 * The `Namespace` class adds prefixes/suffixes to keys to avoid conflicts and group related items.
 *
 * IMPORT_PATH: `"@daiso-tech/core/namespace"`
 * @group Adapters
 *
 * @example
 * ```ts
 * import { Namespace } from "@daiso-tech/core/namspace";
 *
 * const namespace = new Namespace("@my-namespace");
 *
 * // Logs "@my-namespace:_rt"
 * console.log(namespace.toString());
 *
 * const key = namespace.create("my-key");
 *
 * // Logs "my-key"
 * console.log(key.get())
 *
 * // Logs "@my-namespace:_rt:my-key"
 * console.log(key.toString())
 *
 * // You can extend the root
 * const newNamespace = namespace.appendRoot("sub");
 *
 * // Logs "@my-namespace:sub:_rt"
 * console.log(newNamespace.toString());
 *
 * ```
 */
export class Namespace
    implements INamespace, ISerializable<SerializedNamespace>
{
    static deserialize(serialized: SerializedNamespace): Namespace {
        return new Namespace(serialized.root, {
            delimiter: serialized.delimiter,
            rootIdentifier: serialized.rootIdentifier,
        });
    }

    private readonly delimiter: string;
    private readonly rootIdentifier: string;

    constructor(
        private readonly root: OneOrMore<string>,
        settings: NamespaceSettings = {},
    ) {
        const { delimiter = ":", rootIdentifier = "_rt" } = settings;
        this.delimiter = delimiter;
        this.rootIdentifier = rootIdentifier;
    }

    serialize(): SerializedNamespace {
        return {
            root: typeof this.root === "string" ? this.root : [...this.root],
            delimiter: this.delimiter,
            rootIdentifier: this.rootIdentifier,
            version: "1",
        };
    }

    setdelimiter(delimiter: string): INamespace {
        return new Namespace(this.root, {
            rootIdentifier: this.rootIdentifier,
            delimiter,
        });
    }

    setRootIdentifier(identifier: string): INamespace {
        return new Namespace(this.root, {
            rootIdentifier: identifier,
            delimiter: this.delimiter,
        });
    }

    appendRoot(str: OneOrMore<string>): INamespace {
        return new Namespace(
            [...resolveOneOrMore(this.root), ...resolveOneOrMore(str)],
            {
                rootIdentifier: this.rootIdentifier,
                delimiter: this.delimiter,
            },
        );
    }

    prependRoot(str: OneOrMore<string>): INamespace {
        return new Namespace(
            [...resolveOneOrMore(str), ...resolveOneOrMore(this.root)],
            {
                rootIdentifier: this.rootIdentifier,
                delimiter: this.delimiter,
            },
        );
    }

    private validate(key: string): void {
        if (key.includes(this.rootIdentifier)) {
            throw new UnexpectedError(
                `Key "${key}" cannot not include "${this.rootIdentifier}"`,
            );
        }
    }

    private getKeyPrefixArray(): Array<string> {
        return [
            resolveOneOrMoreStr(this.root, this.delimiter),
            this.rootIdentifier,
        ];
    }

    toString(): string {
        return resolveOneOrMoreStr(this.getKeyPrefixArray(), this.delimiter);
    }

    create(key: string): IKey {
        this.validate(key);
        return new Key({
            key,
            delimiter: this.delimiter,
            prefixArr: this.getKeyPrefixArray(),
        });
    }
}
