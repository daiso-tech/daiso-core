import {
    type DynamicRegistration,
    type IDynamicServiceRegister,
} from "@/di/contracts/container.contract.js";
import {
    InvalidMethodCall,
    METHOD_CALL_FLAG,
} from "@/di/contracts/container.errors.js";
import { type TNode } from "@/di/implementations/common.js";
import { type IExecutionContext } from "@/execution-context/contracts/execution-context.contract.js";
import { callInvokable, isInvokable } from "@/utilities/_module.js";

// TODO change remove and callback where container throws spefic error type and UnexpectedError
// since error is trigged by user.
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
            throw InvalidMethodCall.create({
                methodName: "set",
                flag: METHOD_CALL_FLAG.OUTSIDE_RUN,
                token: settings.token,
            });
        }

        const value = isInvokable(settings.value)
            ? await callInvokable(settings.value, this.executionContext)
            : settings.value;

        this.setValueFor(settings.token, value);
    }
}
