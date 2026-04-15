/**
 * @module Serde
 */
import {
    type IFlexibleSerdeAdapter,
    type ISerdeTransformerAdapter,
} from "@/serde/contracts/_module.js";

/**
 * The `RequiredSerdeAdapter` will always throw errors is used for forcing the user to pass in a valid adapter.
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/no-op-serde-adapter"`
 * @group Adapters
 */
export class RequiredSerdeAdapter<TSerializedValue>
    implements IFlexibleSerdeAdapter<TSerializedValue>
{
    private static getErrorMessage(methodName: string): string {
        return (
            `[RequiredSerdeAdapter]: The method '${methodName}' was called, but no valid IFlexibleSerdeAdapter was provided. ` +
            `You must inject a concrete implementation (e.g., SuperJsonSerdeAdapter) into your configuration.`
        );
    }

    serialize<TValue>(_value: TValue): TSerializedValue {
        throw new Error(
            RequiredSerdeAdapter.getErrorMessage(this.serialize.name),
        );
    }

    deserialize<TValue>(_serializedValue: TSerializedValue): TValue {
        throw new Error(
            RequiredSerdeAdapter.getErrorMessage(this.deserialize.name),
        );
    }

    registerCustom<TCustomSerialized, TCustomDeserialized>(
        _transformer: ISerdeTransformerAdapter<
            TCustomSerialized,
            TCustomDeserialized
        >,
    ): void {
        throw new Error(
            RequiredSerdeAdapter.getErrorMessage(this.registerCustom.name),
        );
    }
}
