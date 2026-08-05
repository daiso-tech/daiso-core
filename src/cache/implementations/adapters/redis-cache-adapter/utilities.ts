/**
 * @module Cache
 */

import { UnexpectedError } from "@/utilities/errors.js";

import type { Redis } from "ioredis";

/**
 * @internal
 */
function escapeRedisChars(value: string): string {
    const replacements: Record<string, string> = {
        ",": "\\,",
        ".": "\\.",
        "<": "\\<",
        ">": "\\>",
        "{": "\\{",
        "}": "\\}",
        "[": "\\[",
        "]": "\\]",
        '"': '\\"',
        "'": "\\'",
        ":": "\\:",
        ";": "\\;",
        "!": "\\!",
        "@": "\\@",
        "#": "\\#",
        $: "\\$",
        "%": "\\%",
        "^": "\\^",
        "&": "\\&",
        "*": "\\*",
        "(": "\\(",
        ")": "\\)",
        "-": "\\-",
        "+": "\\+",
        "=": "\\=",
        "~": "\\~",
    };
    return value.replace(
        /,|\.|<|>|\{|\}|\[|\]|"|'|:|;|!|@|#|\$|%|\^|&|\*|\(|\)|-|\+|=|~/g,
        (chunk) => {
            const item = replacements[chunk];
            if (item === undefined) {
                throw new UnexpectedError("Encounterd none existing field");
            }
            return item;
        },
    );
}

/**
 * @internal
 */
export class ClearIterable implements AsyncIterable<void> {
    constructor(
        private readonly client: Redis,
        private readonly pattern: string,
    ) {
        this.pattern = `${escapeRedisChars(pattern)}*`;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<void> {
        let coursor = 0;
        do {
            const [_coursor, elements] = await this.client.scan(
                coursor,
                "MATCH",
                this.pattern,
            );
            if (elements.length === 0) {
                return;
            }
            await this.client.del(elements);
            coursor++;
            yield undefined;
        } while (coursor !== 0);
    }
}
