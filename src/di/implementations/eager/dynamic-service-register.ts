import {
    type DynamicRegistration,
    type IDynamicServiceRegister,
} from "@/di/contracts/container.contract.js";
import { InvalidMethodCallDiError } from "@/di/contracts/container.errors.js";
import { type TNode } from "@/di/implementations/eager/_shared.js";
import { type IExecutionContext } from "@/execution-context/contracts/execution-context.contract.js";
import { callInvokable, isInvokable } from "@/utilities/_module.js";

/**
 * @internal
 */
export class DynamicServiceRegister implements IDynamicServiceRegister {
    private setValueFor: (token: TNode, value: unknown) => void;
    private isOutsideRunScope: () => boolean;
    private executionContext: IExecutionContext;

    constructor(args: {
        setValueFor: (token: TNode, value: unknown) => void;
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

        const value = isInvokable(settings.value)
            ? await callInvokable(settings.value, this.executionContext)
            : settings.value;

        this.setValueFor(settings.token, value);
    }
}
