/**
 * @module Codec
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/codec/contracts"`
 * @group Adapters
 */
export type IDecoder<TDecodedValue, TEncodedValue> = {
    decode(encodedValue: TEncodedValue): TDecodedValue;
};
