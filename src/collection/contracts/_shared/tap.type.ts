/**
 * @module Collection
 */

import { type Invokable, type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type Tap<TCollection> = Invokable<[collection: TCollection], void>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type AsyncTap<TCollection> = Invokable<
    [collection: TCollection],
    Promisable<void>
>;
