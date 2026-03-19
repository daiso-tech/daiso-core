import {
    type ContextToken,
    type DecrementSettings,
    type IContext,
    type IncrementSettings,
    type PutDecrementSettings,
    type PutIncrementSettings,
} from "@/context/contracts/context.contract.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { NoOpNamespace } from "@/namespace/implementations/_module.js";
import { type ISerializable } from "@/serde/contracts/_module.js";
import {
    callInvokable,
    isInvokable,
    resolveLazyable,
    type Invokable,
    type Lazyable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/context"`
 */
export type SerializedContext = {
    version: "1";
    data: Record<string, unknown>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/context"`
 */
type ContextTokenSettings<TValue = null> = {
    /**
     * @default null
     */
    defaultValue?: TValue | null;

    /**
     * @default false
     */
    serializable?: boolean;

    /**
     * @default
     * ```ts
     * import { NoOpNamespace } from "@daiso-tech/core/namespace"
     * ```
     */
    namespace?: INamespace;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/context"`
 */
export class Context implements IContext, ISerializable<SerializedContext> {
    static deserialize(serializedContext: SerializedContext): IContext {
        return new Context(new Map(Object.entries(serializedContext.data)));
    }

    static token<TValue>(
        id: string,
        settings: ContextTokenSettings<TValue> = {},
    ): ContextToken<TValue> {
        const {
            serializable = false,
            namespace = new NoOpNamespace(),
            defaultValue = null,
        } = settings;
        return {
            id,
            __type: null,
            defaultValue,
            serializable,
            namespace,
        };
    }

    static empty(): IContext {
        return new Context(new Map());
    }

    private readonly map: Map<string, unknown>;

    private constructor(map: Map<string, unknown>) {
        this.map = new Map(map);
    }

    serialize(): SerializedContext {
        return {
            version: "1",
            data: Object.fromEntries(this.map.entries()),
        };
    }

    add<TValue>(token: ContextToken<TValue>, value: NoInfer<TValue>): IContext {
        const context = new Context(this.map);
        if (!context.map.has(token.id)) {
            context.map.set(token.id, value);
        }
        return context;
    }

    put<TValue>(
        token: ContextToken<TValue>,
        value:
            | NoInfer<TValue>
            | Invokable<[value: NoInfer<TValue | null>], NoInfer<TValue>>,
    ): IContext {
        const context = new Context(this.map);
        if (!isInvokable(value)) {
            context.map.set(token.id, value);
            return context;
        }

        const previousValue =
            (context.map.get(token.id) as TValue | undefined) ?? null;
        const newValue = callInvokable(value, previousValue);
        context.map.set(token.id, newValue);

        return context;
    }

    putIncrement(
        token: ContextToken<number>,
        settings: PutIncrementSettings = {},
    ): IContext {
        const { nbr = 1, max = null, initialValue = 0 } = settings;
        return this.put(token, (value) => {
            if (value === null) {
                return initialValue;
            }
            if (typeof value !== "number") {
                throw new TypeError("!!__MESSAGE__!!");
            }
            const newValue = value + nbr;
            if (max === null || newValue < max) {
                return newValue;
            }
            return value;
        });
    }

    putDecrement(
        token: ContextToken<number>,
        settings: PutDecrementSettings = {},
    ): IContext {
        const { nbr = 1, min = null, initialValue = 0 } = settings;
        return this.put(token, (value) => {
            if (value === null) {
                return initialValue;
            }
            if (typeof value !== "number") {
                throw new TypeError("!!__MESSAGE__!!");
            }
            const newValue = value - nbr;
            if (min === null || newValue > min) {
                return newValue;
            }
            return value;
        });
    }

    putPush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IContext {
        return new Context(this.map).put(token, (previousValue) => {
            if (previousValue === null) {
                return values;
            }
            return [...previousValue, ...values];
        });
    }

    update<TValue>(
        token: ContextToken<TValue>,
        value:
            | NoInfer<TValue>
            | Invokable<[value: NoInfer<TValue>], NoInfer<TValue>>,
    ): IContext {
        const context = new Context(this.map);
        const previousValue = context.map.get(token.id) as TValue | undefined;
        if (previousValue === undefined) {
            return context;
        }

        if (!isInvokable(value)) {
            context.map.set(token.id, value);
            return context;
        }

        const newValue = callInvokable(value, previousValue);
        context.map.set(token.id, newValue);

        return context;
    }

    updateIncrement(
        token: ContextToken<number>,
        settings: IncrementSettings = {},
    ): IContext {
        const { nbr = 1, max = null } = settings;
        return this.update(token, (value) => {
            if (typeof value !== "number") {
                throw new TypeError("!!__MESSAGE__!!");
            }
            const newValue = value + nbr;
            if (max === null || newValue < max) {
                return newValue;
            }
            return value;
        });
    }

    updateDecrement(
        token: ContextToken<number>,
        settings: DecrementSettings = {},
    ): IContext {
        const { nbr = 1, min = null } = settings;
        return this.update(token, (value) => {
            if (typeof value !== "number") {
                throw new TypeError("!!__MESSAGE__!!");
            }
            const newValue = value - nbr;
            if (min === null || newValue > min) {
                return newValue;
            }
            return value;
        });
    }

    updatePush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IContext {
        return new Context(this.map).update(token, (previousValue) => {
            return [...previousValue, ...values];
        });
    }

    remove<TValue>(token: ContextToken<TValue>): IContext {
        const context = new Context(this.map);
        context.map.delete(token.id);
        return context;
    }

    when(
        condition: Lazyable<boolean>,
        invokables: Array<Invokable<[context: IContext], Context>>,
    ): IContext {
        let context = new Context(this.map);
        if (!resolveLazyable(condition)) {
            return context;
        }
        for (const invokable of invokables) {
            context = callInvokable(invokable, context);
        }
        return context;
    }

    contains<TValue>(
        token: ContextToken<Array<TValue>>,
        matchValue:
            | NoInfer<TValue>
            | Invokable<[value: NoInfer<TValue>], boolean>,
    ): boolean {
        const items = this.get(token);
        if (items === null) {
            return false;
        }
        if (!isInvokable(matchValue)) {
            matchValue = (value_) => value_ === matchValue;
        }

        for (const item of items) {
            if (callInvokable(matchValue, item)) {
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

    get<TValue>(token: ContextToken<TValue>): TValue | null {
        const value = this.map.get(token.id) as TValue | null;
        if (value === null) {
            return null;
        }
        return value;
    }

    getOr<TValue>(
        token: ContextToken<TValue>,
        defaultValue: Lazyable<TValue>,
    ): TValue {
        const value = this.get(token);
        if (value === null) {
            return resolveLazyable(defaultValue);
        }
        return value;
    }

    getOrFail<TValue>(token: ContextToken<TValue>): TValue {
        const value = this.get(token);
        if (value === null) {
            throw new Error("!!__MESSAGE__!!");
        }
        return value;
    }

    child(): IContext {
        return new Context(this.map);
    }

    clear(): IContext {
        return Context.empty();
    }
}
