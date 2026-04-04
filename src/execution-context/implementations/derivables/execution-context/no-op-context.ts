/**
 * @module ExecutionContext
 */

import {
    type ContextToken,
    type DecrementSettings,
    type IContext,
    type ICopyableContext,
    type IncrementSettings,
    type PutDecrementSettings,
    type PutIncrementSettings,
} from "@/execution-context/contracts/_module.js";
import { NotFoundExecutionContextError } from "@/execution-context/contracts/execution-context.errors.js";
import {
    resolveLazyable,
    type Invokable,
    type Lazyable,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export class NoOpContext implements ICopyableContext {
    copy(): ICopyableContext {
        return new NoOpContext();
    }

    contains<TValue>(
        _token: ContextToken<Array<TValue>>,
        _matchValue:
            | NoInfer<TValue>
            | Invokable<[value: NoInfer<TValue>], boolean>,
    ): boolean {
        return false;
    }

    exists<TValue>(_token: ContextToken<TValue>): boolean {
        return false;
    }

    missing<TValue>(_token: ContextToken<TValue>): boolean {
        return true;
    }

    get<TValue>(_token: ContextToken<TValue>): TValue | null {
        return null;
    }

    getOr<TValue>(
        _token: ContextToken<TValue>,
        defaultValue: Lazyable<TValue>,
    ): TValue {
        return resolveLazyable(defaultValue);
    }

    getOrFail<TValue>(token: ContextToken<TValue>): TValue {
        throw NotFoundExecutionContextError.create(token.id);
    }

    add<TValue>(
        _token: ContextToken<TValue>,
        _value: NoInfer<TValue>,
    ): IContext {
        return this;
    }

    put<TValue>(
        _token: ContextToken<TValue>,
        _value: NoInfer<TValue>,
    ): IContext {
        return this;
    }

    putIncrement(
        _token: ContextToken<number>,
        _settings?: PutIncrementSettings,
    ): IContext {
        return this;
    }

    putDecrement(
        _token: ContextToken<number>,
        _settings?: PutDecrementSettings,
    ): IContext {
        return this;
    }

    putPush<TValue>(
        _token: ContextToken<Array<TValue>>,
        ..._values: Array<NoInfer<TValue>>
    ): IContext {
        return this;
    }

    update<TValue>(
        _token: ContextToken<TValue>,
        _value: NoInfer<TValue>,
    ): IContext {
        return this;
    }

    updateIncrement(
        _token: ContextToken<number>,
        _settings?: IncrementSettings,
    ): IContext {
        return this;
    }

    updateDecrement(
        _token: ContextToken<number>,
        _settings?: DecrementSettings,
    ): IContext {
        return this;
    }

    updatePush<TValue>(
        _token: ContextToken<Array<TValue>>,
        ..._values: Array<NoInfer<TValue>>
    ): IContext {
        return this;
    }

    remove<TValue>(_token: ContextToken<TValue>): IContext {
        return this;
    }

    when(
        _condition: Lazyable<boolean>,
        ..._invokables: Array<Invokable<[context: IContext], IContext>>
    ): IContext {
        return this;
    }
}
