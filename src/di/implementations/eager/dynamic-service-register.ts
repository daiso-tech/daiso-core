/**
 * @module DI
 */

import { InvalidMethodCallDiError } from "@/di/contracts/container.errors.js";
import { callInvocable, isInvocable } from "@/utilities/_module.js";

import type {
    DynamicRegistration,
    IDynamicServiceRegister,
} from "@/di/contracts/container.contract.js";
import type { Node } from "@/di/implementations/eager/_shared.js";
import type { IExecutionContext } from "@/execution-context/contracts/_module-exports.js";

/**
 * @internal
 */
export class DynamicServiceRegister implements IDynamicServiceRegister {
    private setValueFor: (token: Node, value: unknown) => void;
    private isOutsideRunScope: () => boolean;
    private executionContext: IExecutionContext;

    constructor(args: {
        setValueFor: (token: Node, value: unknown) => void;
        isOutsideRunScope: () => boolean;
        executionContext: IExecutionContext;
    }) {
        this.setValueFor = args.setValueFor;
        this.isOutsideRunScope = args.isOutsideRunScope;
        this.executionContext = args.executionContext;
    }

    async set<TRegisteredType = unknown>(
        settings: DynamicRegistration<TRegisteredType>,
    ): Promise<void> {
        if (this.isOutsideRunScope()) {
            throw InvalidMethodCallDiError.create({
                methodName: this.set.name,
                flag: InvalidMethodCallDiError.FLAG.OUTSIDE_RUN,
                token: settings.token,
            });
        }

        const value = isInvocable(settings.value)
            ? await callInvocable(settings.value, this.executionContext)
            : settings.value;

        this.setValueFor(settings.token, value);
    }
}
