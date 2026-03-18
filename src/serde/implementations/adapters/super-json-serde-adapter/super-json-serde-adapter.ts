/**
 * @module Serde
 */

import { SuperJSON } from "superjson";

import {
    type ISerdeTransformerAdapter,
    type IFlexibleSerdeAdapter,
    DeserializationSerdeError,
    SerializationSerdeError,
} from "@/serde/contracts/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/serde/super-json-serde-adapter"`
 * @group Adapters
 */
export class SuperJsonSerdeAdapter implements IFlexibleSerdeAdapter<string> {
    private readonly superJson: SuperJSON = new SuperJSON();

    registerCustom<TCustomSerialized, TCustomDeserialized>(
        transformer: ISerdeTransformerAdapter<
            TCustomSerialized,
            TCustomDeserialized
        >,
    ): void {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const customTransformer =
            this.superJson.customTransformerRegistry.findByName(
                transformer.name,
            ) as any;
        const hasAlreadyCustomTransformer = customTransformer !== undefined;
        if (hasAlreadyCustomTransformer) {
            return;
        }
        this.superJson.registerCustom<TCustomSerialized, any>(
            {
                isApplicable(value) {
                    return transformer.isApplicable(value);
                },
                serialize(deserializedValue) {
                    return transformer.serialize(deserializedValue);
                },
                deserialize(serializedValue) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    return transformer.deserialize(serializedValue);
                },
            },
            transformer.name,
        );
    }

    serialize<TValue>(value: TValue): string {
        try {
            return this.superJson.stringify(value);
        } catch (error: unknown) {
            throw SerializationSerdeError.create(error);
        }
    }

    deserialize<TValue>(value: string): TValue {
        try {
            return this.superJson.parse(value);
        } catch (error: unknown) {
            throw DeserializationSerdeError.create(error);
        }
    }
}
