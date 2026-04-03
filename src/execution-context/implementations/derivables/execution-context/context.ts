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
    callInvokable,
    isInvokable,
    OPTION,
    optionNone,
    optionSome,
    resolveLazyable,
    type Invokable,
    type Lazyable,
    type Option,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export class Context implements ICopyableContext {
    constructor(private readonly map: Map<string, unknown>) {}

    copy(): ICopyableContext {
        return new Context(
            new Map(
                [...this.map].map<[string, unknown]>(([key, value]) => {
                    if (Array.isArray(value)) {
                        return [key, [...(value as Array<unknown>)]];
                    }
                    return [key, value];
                }),
            ),
        );
    }

    contains<TValue>(
        token: ContextToken<Array<TValue>>,
        matchValue:
            | NoInfer<TValue>
            | Invokable<[value: NoInfer<TValue>], boolean>,
    ): boolean {
        const arr = this.get(token);
        if (arr === null) {
            return false;
        }
        let predicate: Invokable<[value: NoInfer<TValue>], boolean>;
        if (!isInvokable(matchValue)) {
            const value = matchValue;
            predicate = (item_) => item_ === value;
        } else {
            predicate = matchValue;
        }
        for (const item of arr) {
            if (callInvokable(predicate, item)) {
                return true;
            }
        }
        return false;
    }

    exists<TValue>(token: ContextToken<TValue>): boolean {
        return this.map.has(token.id);
    }

    missing<TValue>(token: ContextToken<TValue>): boolean {
        return !this.exists(token);
    }

    private get_<TValue>(token: ContextToken<TValue>): Option<TValue> {
        if (!this.map.has(token.id)) {
            return optionNone();
        }
        return optionSome(this.map.get(token.id) as TValue);
    }

    get<TValue>(token: ContextToken<TValue>): TValue | null {
        const item = this.get_(token);
        if (item.type === OPTION.NONE) {
            return null;
        }
        return item.value;
    }

    getOr<TValue>(
        token: ContextToken<TValue>,
        defaultValue: Lazyable<TValue>,
    ): TValue {
        const item = this.get_(token);
        if (item.type === OPTION.NONE) {
            return resolveLazyable(defaultValue);
        }
        return item.value;
    }

    getOrFail<TValue>(token: ContextToken<TValue>): TValue {
        const value = this.get(token);
        if (value === null) {
            throw NotFoundExecutionContextError.create(token.id);
        }
        return value;
    }

    add<TValue>(token: ContextToken<TValue>, value: NoInfer<TValue>): IContext {
        if (!this.map.has(token.id)) {
            this.map.set(token.id, value);
        }
        return this;
    }

    put<TValue>(token: ContextToken<TValue>, value: NoInfer<TValue>): IContext {
        this.map.set(token.id, value);
        return this;
    }

    putIncrement(
        token: ContextToken<number>,
        settings: PutIncrementSettings = {},
    ): IContext {
        const { nbr = 1, max = null, initialValue = 0 } = settings;
        const value = this.get(token);
        if (value === null) {
            this.add(
                token,
                max === null ? initialValue : Math.min(initialValue, max),
            );
            return this;
        }
        const newValue = value + nbr;
        if (max !== null && newValue > max) {
            return this;
        }
        this.update(token, max === null ? newValue : Math.min(newValue, max));
        return this;
    }

    putDecrement(
        token: ContextToken<number>,
        settings: PutDecrementSettings = {},
    ): IContext {
        const { nbr = 1, min = null, initialValue = 0 } = settings;
        const value = this.get(token);
        if (value === null) {
            this.add(
                token,
                min === null ? initialValue : Math.max(initialValue, min),
            );
            return this;
        }
        const newValue = value - nbr;
        if (min !== null && newValue < min) {
            return this;
        }
        this.update(token, min === null ? newValue : Math.max(newValue, min));
        return this;
    }

    putPush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IContext {
        const prevArr = this.get(token);
        if (prevArr === null) {
            this.add(token, values);
            return this;
        }
        this.update(token, [...prevArr, ...values]);
        return this;
    }

    update<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IContext {
        if (this.map.has(token.id)) {
            this.map.set(token.id, value);
        }
        return this;
    }

    updateIncrement(
        token: ContextToken<number>,
        settings: IncrementSettings = {},
    ): IContext {
        const { nbr = 1, max = null } = settings;
        const value = this.get(token);
        if (value === null) {
            return this;
        }
        const newValue = value + nbr;
        if (max !== null && newValue > max) {
            return this;
        }
        this.update(token, max === null ? newValue : Math.min(newValue, max));
        return this;
    }

    updateDecrement(
        token: ContextToken<number>,
        settings: DecrementSettings = {},
    ): IContext {
        const { nbr = 1, min = null } = settings;
        const value = this.get(token);
        if (value === null) {
            return this;
        }
        const newValue = value - nbr;
        if (min !== null && newValue < min) {
            return this;
        }
        this.update(token, min === null ? newValue : Math.max(newValue, min));
        return this;
    }

    updatePush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IContext {
        const prevArr = this.get(token);
        if (prevArr === null) {
            return this;
        }
        this.update(token, [...prevArr, ...values]);
        return this;
    }

    remove<TValue>(token: ContextToken<TValue>): IContext {
        this.map.delete(token.id);
        return this;
    }

    when(
        condition: Lazyable<boolean>,
        ...invokables: Array<Invokable<[context: IContext], IContext>>
    ): IContext {
        if (resolveLazyable(condition)) {
            for (const invokable of invokables) {
                callInvokable(invokable, this);
            }
        }
        return this;
    }
}
