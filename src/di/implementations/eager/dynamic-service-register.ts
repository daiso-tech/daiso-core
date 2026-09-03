/**
 * @module DI
 */

import type {
    DiToken,
    DynamicRegistration,
    IDynamicServiceRegister,
} from "@/di/contracts/container.contract.js";

/**
 * @internal
 */
export class DynamicServiceRegister implements IDynamicServiceRegister {
    constructor(private args: IDynamicServiceRegister) {}

    set<TRegisteredType = unknown>(
        settings: DynamicRegistration<TRegisteredType>,
    ): void {
        const value = settings.value;
        this.args.set({ token: settings.token, value });
    }
    get<TRegisteredType>(
        token: DiToken<TRegisteredType>,
    ): Promise<TRegisteredType | null> {
        return this.args.get(token);
    }
    getOrFail<TRegisteredType>(
        token: DiToken<TRegisteredType>,
    ): Promise<TRegisteredType> {
        return this.args.getOrFail(token);
    }
    async has<TRegisteredType>(
        token: DiToken<TRegisteredType>,
    ): Promise<boolean> {
        return this.args.has(token);
    }
}
