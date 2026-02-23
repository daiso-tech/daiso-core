/**
 * @module Codec
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DecodingError } from "@/codec/contracts/codec.errors.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/codec/contracts"`
 * @group Adapters
 */
export type IDecoder<TDecodedValue, TEncodedValue> = {
    /**
     * @throws {DecodingError} {@link DecodingError}
     */
    decode(encodedValue: TEncodedValue): TDecodedValue;
};
