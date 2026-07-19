/**
 * @module Middleware
 */

import { type Enhance } from "@/middleware/contracts/enhance.contract.js";
import {
    type InvokableFn,
    type IInvokableObject,
    type OneOrMore,
} from "@/utilities/_module.js";

/**
 * A function-based plugin that receives the target instance and an {@link Enhance} utility.
 *
 * Plugins are used to apply side effects or configuration to an object instance
 * during middleware setup. The plugin receives the instance directly and can
 * enhance its methods, set properties, or perform any initialization logic.
 *
 * Use this when a simple function is sufficient for the plugin logic.
 * For more complex plugins that carry state or configuration, use
 * {@link IPluginObject} instead.
 *
 * @typeParam TInstance - The type of the target instance being configured
 *
 * @param instance - The target instance to configure
 * @param enhance - The {@link Enhance} utility for wrapping methods with middleware
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Contracts
 */
export type PluginFn<TInstance> = InvokableFn<
    [instance: TInstance, enhance: Enhance],
    void
>;

/**
 * An object-based plugin that receives the target instance and an {@link Enhance} utility.
 *
 * This is the object-oriented counterpart to {@link PluginFn}. Implement the
 * `invoke` method to define the plugin's behavior. Object-based plugins are
 * useful when the plugin needs to carry its own state, configuration, or
 * dependencies.
 *
 * @typeParam TInstance - The type of the target instance being configured
 *
 * @param instance - The target instance to configure
 * @param enhance - The {@link Enhance} utility for wrapping methods with middleware
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Contracts
 */
export type IPluginObject<TInstance> = IInvokableObject<
    [instance: TInstance, enhance: Enhance],
    void
>;

/**
 * A plugin that can be either a function ({@link PluginFn}) or an object
 * ({@link IPluginObject}).
 *
 * This union type allows plugins to be defined in whichever form best fits
 * the use case — a lightweight function for simple logic, or an object with
 * encapsulated state for complex scenarios.
 *
 * @typeParam TInstance - The type of the target instance being configured
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Contracts
 */
export type Plugin<TInstance> = PluginFn<TInstance> | IPluginObject<TInstance>;

/**
 * Applies one or more plugins to a target instance.
 *
 * Each plugin is invoked in the order provided, receiving the instance and an
 * {@link Enhance} utility to optionally wrap its methods with middleware.
 * Plugins are run against the same instance reference, allowing them to
 * collectively configure the object.
 *
 * @typeParam TInstance - The type of the target instance being configured
 *
 * @param instance - The target instance to apply plugins to
 * @param plugins - A single plugin or iterable of plugins to apply
 *
 * @returns The same instance after all plugins have been applied
 *
 * @example
 * ```ts
 * class UserService {
 *   async getUser(id: string): Promise<{ name: string }> {
 *      // retrieval logic
 *   }
 *
 *   async deleteUser(id: string): Promise<void> {
 *     // deletion logic
 *   }
 * }
 *
 * // Function-based plugin: adds logging to all methods
 * const loggingPlugin: PluginFn<UserService> = (service, enhance) => {
 *   enhance(service, "getUser", [
 *     (next) => async (...args) => {
 *       console.log(`${method} called with:`, args);
 *       const result = await next(...args);
 *       console.log(`${method} returned:`, result);
 *       return result;
 *     },
 *   ]);
 *
 *   enhance(service, "deleteUser", [
 *     (next) => async (...args) => {
 *       console.log(`${method} called with:`, args);
 *       const result = await next(...args);
 *       console.log(`${method} returned:`, result);
 *       return result;
 *     },
 *   ]);
 * };
 *
 * function main(withPlugin: WithPlugin): void {
 *   const service = new UserService();
 *   const enhancedService = withPlugin(service, loggingPlugin);
 *   await enhancedService.getUser("123");
 *   // Logs:
 *   // getUser called with: ["123"]
 *   // getUser returned: { name: "Alice" }
 * }
 * ```
 *
 * @see {@link PluginFn | `PluginFn`}
 * @see {@link IPluginObject | `IPluginObject`}
 * @see {@link Plugin | `Plugin`}
 * @see {@link Enhance | `Enhance`}
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Contracts
 */
export type WithPlugin = <TInstance>(
    instance: TInstance,
    plugins: OneOrMore<Plugin<TInstance>>,
) => TInstance;
