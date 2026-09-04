type BaseEnvConfig = Partial<Record<string, string | number | boolean>>;

type IEnvAccessor<TEnvConfig extends BaseEnvConfig = BaseEnvConfig> = {
    get<TField extends keyof TEnvConfig, TValue extends TEnvConfig[TField]>(
        field: TField,
    ): UndefinedToNull<TValue>;

    getOr<TField extends keyof TEnvConfig, TValue extends TEnvConfig[TField]>(
        field: TField,
        defaultValue: Lazyable<NonNullable<TValue>>,
    ): NonNullable<TValue>;
};
