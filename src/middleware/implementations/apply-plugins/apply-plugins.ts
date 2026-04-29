/**
 * @module Middleware
 */

import { type Enhance, type Plugin } from "@/middleware/contracts/_module.js";
import {
    callInvokable,
    resolveOneOrMore,
    shallowCopyInstance,
    type OneOrMore,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export function applyPlugins<TInstance>(
    enhance: Enhance,
    plugins: OneOrMore<Plugin<TInstance>>,
    instance: TInstance,
): TInstance {
    const copiedIntance = shallowCopyInstance(instance);
    for (const plugin of resolveOneOrMore(plugins)) {
        callInvokable(plugin, enhance, copiedIntance);
    }
    return copiedIntance;
}
