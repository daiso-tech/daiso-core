/**
 * @module DepdencyInjection
 */

import {
    type DiToken,
    type IContainer,
    type IRegistrationLifetime,
    type IServiceContainerResolver,
    type IServiceProvider,
    type ParameterTokens,
} from "@/depdency-injection/contracts/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import {
    type Promisable,
    type OneOrMore,
    type Class,
    type Invokable,
} from "@/utilities/_module.js";

/**
 * @group Implementations
 * IMPORT_PATH: `"@daiso-tech/core/depdency-injection/contracts"`
 */
export class Container implements IContainer {
    constructor(private readonly executionContext: IExecutionContext) {}

    init(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    deInit(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    resolve<TType>(token: DiToken<TType>): Promise<TType | null> {
        throw new Error("Method not implemented.");
    }

    resolveOr<TType>(
        token: DiToken<TType>,
        defaultValue: NoInfer<TType>,
    ): Promise<TType> {
        throw new Error("Method not implemented.");
    }

    resolveOrFail<TType>(token: DiToken<TType>): Promise<TType> {
        throw new Error("Method not implemented.");
    }

    resolveTag<TType>(token: DiToken<TType>): Promise<Array<TType>> {
        throw new Error("Method not implemented.");
    }

    registerContextFactory<TType>(
        token: DiToken<TType>,
        factory: Invokable<
            [executionContext: IExecutionContext],
            Promisable<TType>
        >,
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }

    registerProvider(provider: IServiceProvider): Promise<void> {
        throw new Error("Method not implemented.");
    }

    registerFactory<TType>(
        token: DiToken<TType>,
        factory: (resolver: IServiceContainerResolver) => Promisable<TType>,
        tags?: OneOrMore<DiToken<TType>>,
    ): IRegistrationLifetime {
        throw new Error("Method not implemented.");
    }

    registerClass<TParameters extends Array<unknown>, TType>(
        class_: Class<TParameters, TType>,
        deps: ParameterTokens<TParameters>,
        tags?: OneOrMore<DiToken<TType>>,
    ): IRegistrationLifetime {
        throw new Error("Method not implemented.");
    }

    registerValue<TType>(
        token: DiToken<TType>,
        value: TType,
        tags?: OneOrMore<DiToken<TType>>,
    ): IRegistrationLifetime {
        throw new Error("Method not implemented.");
    }

    alias<TType>(
        originalToken: DiToken<TType>,
        aliasToken: DiToken<TType>,
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }

    run<TValue = void>(
        asyncFn: Invokable<[], Promise<TValue>>,
    ): Promise<TValue> {
        throw new Error("Method not implemented.");
    }
}
