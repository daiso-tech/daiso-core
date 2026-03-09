/**
 * @module Codec
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { EncodingError } from "@/codec/contracts/codec.errors.js";

/**
 * The `IEncoder` contract defines a standard way to encode data.
 *
 * IMPORT_PATH: `"@daiso-tech/core/codec/contracts"`
 * @group Contracts
 */
export type IEncoder<TDecodedValue, TEncodedValue> = {
    /**
     * @throws {EncodingError} {@link EncodingError}
     */
    encode(decodedValue: TDecodedValue): TEncodedValue;
};
