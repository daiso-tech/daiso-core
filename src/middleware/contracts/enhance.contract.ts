/**
 * @module Middleware
 */

import { type Middleware } from "@/middleware/contracts/use.contract.js";
import { type InvokableFn, type OneOrMore } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Contracts
 */
export type InferMethodNames<TInstance> = {
    [TKey in keyof TInstance]: TInstance[TKey] extends InvokableFn<any, any>
        ? TKey
        : never;
}[keyof TInstance];

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Contracts
 */
export type InferParameters<TValue> =
    TValue extends InvokableFn<infer R, any> ? R : never;

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Contracts
 */
export type InferReturn<TValue> =
    TValue extends InvokableFn<Array<any>, infer R> ? R : never;

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Contracts
 */
export type Enhance = <TInstance, TField extends InferMethodNames<TInstance>>(
    obj: TInstance,
    field: TField,
    middlewares: OneOrMore<
        Middleware<
            InferParameters<TInstance[TField]>,
            InferReturn<TInstance[TField]>
        >
    >,
) => void;
