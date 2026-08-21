/**
 * @module DI
 */

import { InvalidMethodCallDiError } from "@/di/contracts/container.errors.js";
import { callInvocable } from "@/utilities/_module.js";

import type {
    DiToken,
    DynamicRegistration,
    DynamicValueWrapper,
    IDynamicServiceRegister,
} from "@/di/contracts/container.contract.js";
import type { IExecutionContext } from "@/execution-context/contracts/_module-exports.js";

/**
 * @internal
 */
function isDynamicValueWrapper<TRegisteredType>(
    value: TRegisteredType | DynamicValueWrapper<TRegisteredType>,
): value is DynamicValueWrapper<TRegisteredType> {
    return (
        typeof value === "object" && value !== null && "dynamicValue" in value
    );
}

/**
 * @internal
 */
export class DynamicServiceRegister implements IDynamicServiceRegister {
    private setValueFor: (token: DiToken, value: unknown) => void;
    private isOutsideRunScope: () => boolean;
    private executionContext: IExecutionContext;

    constructor(args: {
        setValueFor: (token: DiToken, value: unknown) => void;
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

        const value = isDynamicValueWrapper(settings.value)
            ? await callInvocable(
                  settings.value.dynamicValue,
                  this.executionContext,
              )
            : settings.value;

        this.setValueFor(settings.token, value);
    }
}
