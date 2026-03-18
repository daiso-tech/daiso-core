/**
 * @module Codec
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DecodingError } from "@/codec/contracts/codec.errors.js";

/**
 * The `IDecoder` contract defines a standard way to decode data.
 *
 * IMPORT_PATH: `"@daiso-tech/core/codec/contracts"`
 * @group Contracts
 */
export type IDecoder<TDecodedValue, TEncodedValue> = {
    /**
     * @throws {DecodingError} {@link DecodingError}
     */
    decode(encodedValue: TEncodedValue): TDecodedValue;
};
