import { type INamespace } from "@/namespace/contracts/_module.js";
import { type Invokable, type Lazyable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/context"`
 */
export type ContextToken<TValue> = {
    id: string;

    /**
     * Phantom type that is only used for type inference
     */
    __type: TValue | null;

    defaultValue: TValue | null;

    serializable: boolean;

    namespace: INamespace;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/context"`
 */
export type IncrementSettings = {
    /**
     * @default 1
     */
    nbr?: number;

    /**
     * @default null
     */
    max?: number | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/context"`
 */
export type PutIncrementSettings = IncrementSettings & {
    /**
     * @default 0
     */
    initialValue?: number;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/context"`
 */
export type DecrementSettings = {
    /**
     * @default 1
     */
    nbr?: number;

    /**
     * @default null
     */
    min?: number | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/context"`
 */
export type PutDecrementSettings = DecrementSettings & {
    /**
     * @default 0
     */
    initialValue?: number;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/context/contracts"`
 */
export type IReadableContext = {
    contains<TValue>(
        token: ContextToken<Array<TValue>>,
        matchValue:
            | NoInfer<TValue>
            | Invokable<[value: NoInfer<TValue>], boolean>,
    ): boolean;

    exists<TValue>(token: ContextToken<TValue>): boolean;

    missing<TValue>(token: ContextToken<TValue>): boolean;

    get<TValue>(token: ContextToken<TValue>): TValue | null;

    getOr<TValue>(
        token: ContextToken<TValue>,
        defaultValue: Lazyable<TValue>,
    ): TValue;

    getOrFail<TValue>(token: ContextToken<TValue>): TValue;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/context/contracts"`
 */
export type IContext = IReadableContext & {
    add<TValue>(token: ContextToken<TValue>, value: NoInfer<TValue>): IContext;

    put<TValue>(
        token: ContextToken<TValue>,
        value:
            | NoInfer<TValue>
            | Invokable<[value: NoInfer<TValue | null>], NoInfer<TValue>>,
    ): IContext;

    putIncrement(
        token: ContextToken<number>,
        settings?: PutIncrementSettings,
    ): IContext;

    putDecrement(
        token: ContextToken<number>,
        settings?: PutDecrementSettings,
    ): IContext;

    putPush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IContext;

    update<TValue>(
        token: ContextToken<TValue>,
        value:
            | NoInfer<TValue>
            | Invokable<[value: NoInfer<TValue>], NoInfer<TValue>>,
    ): IContext;

    updateIncrement(
        token: ContextToken<number>,
        settings?: IncrementSettings,
    ): IContext;

    updateDecrement(
        token: ContextToken<number>,
        settings?: DecrementSettings,
    ): IContext;

    updatePush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IContext;

    remove<TValue>(token: ContextToken<TValue>): IContext;

    when(
        condition: Lazyable<boolean>,
        invokables: Array<Invokable<[context: IContext], IContext>>,
    ): IContext;

    child(): IContext;
};
