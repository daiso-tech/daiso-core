/**
 * @module Collection
 */

import type { Invocable, Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 */
export type Tap<TCollection> = Invocable<[collection: TCollection], void>;

/**
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 */
export type AsyncTap<TCollection> = Invocable<
    [collection: TCollection],
    Promisable<void>
>;
