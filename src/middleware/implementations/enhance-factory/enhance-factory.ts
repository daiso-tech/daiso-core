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
import { use } from "@/middleware/implementations/use-factory/_module.js";
import { type InvokableFn, type OneOrMore } from "@/utilities/_module.js";

/**
 * @internal
 */
export function enhanceFactory(use_: Use): Enhance {
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
            throw new TypeError(
                `Cannot enhance ${String(field)} because it is not a function`,
            );
        }

        const enhancedFn = use_(fn.bind(obj), middlewares);
        Object.defineProperty(enhancedFn, "name", {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            value: (obj[field] as any).name,
            configurable: true,
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        obj[field] = enhancedFn as any;
    };
}

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Implementations
 */
export const enhance = enhanceFactory(use);
