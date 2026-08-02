/**
 * @module Collection
 */

import { type Invocable, type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type Tap<TCollection> = Invocable<[collection: TCollection], void>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type AsyncTap<TCollection> = Invocable<
    [collection: TCollection],
    Promisable<void>
>;
