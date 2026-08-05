import {
    type DynamicRegistration,
    type IDynamicServiceRegister,
} from "@/di/contracts/container.contract.js";
import { type TNode } from "@/di/implementations/utils.js";

export class DynamicServiceRegister implements IDynamicServiceRegister {
    constructor(private setValueFor: (token: TNode, value: unknown) => void) {}

    async set<TRegisteredType = unknown>(
        settings: DynamicRegistration<TRegisteredType>,
    ): Promise<void> {
        await Promise.resolve();
        this.setValueFor(settings.token, settings.value);
    }
}
