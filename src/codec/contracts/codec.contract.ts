/**
 * @module Codec
 */

import { type IDecoder } from "@/codec/contracts/decoder.contract.js";
import { type IEncoder } from "@/codec/contracts/encoder.contract.js";

/**
 * The `ICodec` contract defines a standard way to encode and decide data.
 *
 * IMPORT_PATH: `"@daiso-tech/core/codec/contracts"`
 * @group Contracts
 */
export type ICodec<TDecodedValue, TEncodedValue> = IEncoder<
    TDecodedValue,
    TEncodedValue
> &
    IDecoder<TDecodedValue, TEncodedValue>;
