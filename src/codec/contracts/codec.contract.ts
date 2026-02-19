/**
 * @module Codec
 */

import { type IDecoder } from "@/codec/contracts/decoder.contract.js";
import { type IEncoder } from "@/codec/contracts/encoder.contract.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/codec/contracts"`
 * @group Adapters
 */
export type ICodec<TDecodedValue, TEncodedValue> = IEncoder<
    TDecodedValue,
    TEncodedValue
> &
    IDecoder<TDecodedValue, TEncodedValue>;
