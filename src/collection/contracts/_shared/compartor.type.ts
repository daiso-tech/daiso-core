/**
 * @module Collection
 */

import { type Invokable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type Comparator<TItem> = Invokable<[itemA: TItem, itemB: TItem], number>;
