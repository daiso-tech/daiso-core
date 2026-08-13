/**
 * @module FileStorage
 */

import type { Invocable } from "@/utilities/_module.js";

/**
 * A function or callable object that validates a file key.
 *
 * It receives a file key and returns an error message describing why the key
 * is invalid, or `null` when the key is valid.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/plugins"`
 * @group Plugins
 */
export type FileKeyValidator = Invocable<[key: string], string | null>;

/**
 * The default {@link FileKeyValidator} used by {@link withFileStorageKeyValidator}.
 *
 * Rejects keys that contain `"../"`, a newline (`\n`), or a tab (`\t`), as well
 * as keys that are empty or consist only of whitespace.
 *
 * @param key - The file key to validate.
 * @returns An error message describing why the key is invalid, or `null` when the key is valid.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/plugins"`
 * @group Plugins
 */
export function defaultKeyValidator(key: string): string | null {
    const hasFileTraversel = key
        .split(/[\\/]/u)
        .some((segment) => segment === "..");
    if (hasFileTraversel) {
        return `The key cannot contain "../"`;
    }
    if (key.includes("\n")) {
        return `The key cannot contain "\\n"`;
    }
    if (key.includes("\t")) {
        return `The key cannot contain "\\t"`;
    }
    if (key.trim() === "") {
        return "The key cannot contain only spaces or be an empty string";
    }
    return null;
}
