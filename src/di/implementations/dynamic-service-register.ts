import {
    type DynamicRegistration,
    type IDynamicServiceRegister,
} from "@/di/contracts/container.contract.js";
import { type TNode } from "@/di/implementations/utils.js";

export class DynamicServiceRegister implements IDynamicServiceRegister {
    private setValueFor: (token: TNode, value: unknown) => void;
    private isOutsideRunScope: () => boolean;
    constructor(args: {
        setValueFor: (token: TNode, value: unknown) => void;
        isOutsideRunScope: () => boolean;
    }) {
        this.setValueFor = args.setValueFor;
        this.isOutsideRunScope = args.isOutsideRunScope;
    }

    async set<TRegisteredType = unknown>(
        settings: DynamicRegistration<TRegisteredType>,
    ): Promise<void> {
        await Promise.resolve();

        if (this.isOutsideRunScope()) {
            throw new Error();
        }

        this.setValueFor(settings.token, settings.value);
    }
}
