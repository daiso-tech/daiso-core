/**
 * @module Serde
 */
import {
    type IFlexibleSerdeAdapter,
    type ISerdeTransformerAdapter,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type IFlexibleSerde,
} from "@/serde/contracts/_module.js";

/**
 * The `NoOpSerdeAdapter` will do nothing and is used for easily mocking {@link IFlexibleSerde | `IFlexibleSerde`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/serde/no-op-serde-adapter"`
 * @group Adapters
 */
export class NoOpSerdeAdapter<TSerializedValue>
    implements IFlexibleSerdeAdapter<TSerializedValue>
{
    serialize<TValue>(value: TValue): TSerializedValue {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return value as any;
    }

    deserialize<TValue>(serializedValue: TSerializedValue): TValue {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return serializedValue as any;
    }

    registerCustom<TCustomSerialized, TCustomDeserialized>(
        _transformer: ISerdeTransformerAdapter<
            TCustomSerialized,
            TCustomDeserialized
        >,
    ): void {}
}
