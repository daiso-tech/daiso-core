/**
 * @module Middleware
 */

import { type Enhance } from "@/middleware/contracts/enhance.contract.js";
import { type Invokable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Contracts
 */
export type Plugin<TInstance> = Invokable<
    [enhance: Enhance, instance: TInstance]
>;
