/**
 * @module EnvAccessor
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

import {
    UninitializedEnvAccessorError,
    type BaseEnvConfig,
    type IEnvAccessor,
    type RawEnvConfig,
} from "@/env-accessor/contracts/_module.js";
import {
    type UndefinedToNull,
    type OneOrMore,
    type AsyncLazyable,
    resolveOneOrMore,
    isInvokable,
    type AsyncLazy,
    callInvokable,
    validate,
} from "@/utilities/_module.js";

/**
 * Settings for configuring an {@link  EnvAccessor | `EnvAccessor`} instance.
 *
 * @template TEnvConfig The environment config type.
 */
export type EnvAccessorSettings<
    TEnvConfig extends BaseEnvConfig = BaseEnvConfig,
> = {
    /**
     * The schema used to validate and type the environment config.
     */
    schema: StandardSchemaV1<Partial<Record<string, string>>, TEnvConfig>;

    /**
     * One or more sources (sync/async/lazy) providing raw environment config values.
     */
    sources: OneOrMore<AsyncLazyable<RawEnvConfig>>;
};

/**
 * `EnvAccessor` provides type-safe access to environment variables, with optional schema validation.
 *
 * It supports multiple sources (sync/async/lazy), schema validation, and convenient access patterns.
 *
 * @template TEnvConfig The environment config type.
 * @group Implementations
 */
export class EnvAccessor<
    TEnvConfig extends BaseEnvConfig,
> implements IEnvAccessor<TEnvConfig> {
    private envConfig: TEnvConfig | null = null;

    private readonly schema: StandardSchemaV1<
        Partial<Record<string, string>>,
        TEnvConfig
    >;

    private readonly sources: OneOrMore<AsyncLazyable<RawEnvConfig>>;

    /**
     * @example
     * ```ts
     * import { EnvAccessor } from "@daiso-tech/core/env-accessor";
     * import { z } from "zod";
     * import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
     *
     *
     * // Combine AWS Secrets Manager and process.env as sources
     * // Note: The order matters—later sources override previous ones for overlapping keys.
     * const secretsManager = new SecretsManagerClient({ region: "us-east-1" });
     * const sources = [
     *   process.env,
     *   async () => {
     *     const secret = await secretsManager.send(
     *       new GetSecretValueCommand({ SecretId: "my-app/env" })
     *     );
     *     return JSON.parse(secret.SecretString ?? "{}");
     *   },
     * ];
     *
     * // Define a schema for your environment variables
     * const schema = z.object({
     *   NODE_ENV: z.string(),
     *   PORT: z.string().default("3000").pipe(z.coerce.number()),
     * });
     *
     * // Initialize the accessor
     * const accessor = new EnvAccessor({ schema, sources });
     * await accessor.init();
     *
     * // Retrieve a value
     * const port = accessor.get("PORT");
     * ```
     */
    constructor(settings: EnvAccessorSettings<TEnvConfig>) {
        const { schema, sources } = settings;
        this.schema = schema;
        this.sources = sources;
    }

    /**
     * Initialize the EnvAccessor by resolving all sources and validating the merged config.
     *
     * @returns Promise that resolves when initialization is complete.
     */
    async init(): Promise<void> {
        const resolvedSource = resolveOneOrMore(this.sources).map<
            AsyncLazy<RawEnvConfig>
        >((source) => {
            if (isInvokable(source)) {
                return source;
            }
            return () => source;
        });

        let mergedRawConfig: RawEnvConfig = {};
        for (const source of resolvedSource) {
            mergedRawConfig = {
                ...mergedRawConfig,
                ...(await callInvokable(source)),
            };
        }

        this.envConfig = await validate(this.schema, mergedRawConfig);
    }

    get<TField extends keyof TEnvConfig, TValue extends TEnvConfig[TField]>(
        field: TField,
    ): UndefinedToNull<TValue> {
        if (this.envConfig === null) {
            throw UninitializedEnvAccessorError.create();
        }
        const value = this.envConfig[field] ?? null;
        return value as UndefinedToNull<TValue>;
    }

    getOr<TField extends keyof TEnvConfig, TValue extends TEnvConfig[TField]>(
        field: TField,
        defaultValue: NonNullable<TValue>,
    ): NonNullable<TValue> {
        const value = this.get(field);
        if (value === null) {
            return defaultValue;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return value as any;
    }
}
