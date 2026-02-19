/**
 * @module Codec
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/codec/contracts"`
 * @group Adapters
 */
export type IEncoder<TDecodedValue, TEncodedValue> = {
    encode(decodedValue: TDecodedValue): TEncodedValue;
};
