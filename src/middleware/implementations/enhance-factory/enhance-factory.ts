/**
 * @module Middleware
 */

import {
    type Enhance,
    type InferMethodNames,
    type InferParameters,
    type InferReturn,
    type Middleware,
    type Use,
} from "@/middleware/contracts/_module.js";
import { type InvokableFn, type OneOrMore } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Implementations
 */
export function enhanceFactory(use: Use): Enhance {
    return <TInstance, TField extends InferMethodNames<TInstance>>(
        obj: TInstance,
        field: TField,
        middlewares: OneOrMore<
            Middleware<
                InferParameters<TInstance[TField]>,
                InferReturn<TInstance[TField]>
            >
        >,
    ): void => {
        const fn = obj[field] as InvokableFn<any, any>;
        if (typeof fn !== "function") {
            throw new TypeError("!!__MESSAGE__!!");
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        obj[field] = use(fn.bind(obj), middlewares) as any;
    };
}
