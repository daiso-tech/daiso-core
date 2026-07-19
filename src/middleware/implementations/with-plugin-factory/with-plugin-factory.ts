/**
 * @module Middleware
 */

import {
    type Plugin,
    type WithPlugin,
} from "@/middleware/contracts/_module.js";
import { type Enhance } from "@/middleware/contracts/enhance.contract.js";
import { enhance } from "@/middleware/implementations/enhance-factory/_module.js";
import {
    callInvokable,
    copyObj,
    resolveOneOrMore,
    type OneOrMore,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export function withPluginFactory(enhance_: Enhance): WithPlugin {
    return <TInstance>(
        instance: TInstance,
        plugins: OneOrMore<Plugin<TInstance>>,
    ): TInstance => {
        const copyOfInstance = copyObj(instance);
        for (const plugin of resolveOneOrMore(plugins)) {
            callInvokable(plugin, copyOfInstance, enhance_);
        }
        return copyOfInstance;
    };
}

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Implementations
 */
export const withPlugin = withPluginFactory(enhance);
