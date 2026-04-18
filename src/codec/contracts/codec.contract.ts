/**
 * @module Codec
 */

import { type IDecoder } from "@/codec/contracts/decoder.contract.js";
import { type IEncoder } from "@/codec/contracts/encoder.contract.js";

/**
 * Complete codec contract combining encoding and decoding capabilities.
 * Provides bidirectional transformation between two data formats.
 *
 * Useful for formats requiring both encoding and decoding:
 * - JSON encoding/decoding
 * - Compression/decompression
 * - Encryption/decryption
 * - Binary format marshalling/unmarshalling
 *
 * @template TDecodedValue - The original/human-readable data format
 * @template TEncodedValue - The transportable/storage data format
 *
 * IMPORT_PATH: `"@daiso-tech/core/codec/contracts"`
 * @group Contracts
 */
export type ICodec<TDecodedValue, TEncodedValue> = IEncoder<
    TDecodedValue,
    TEncodedValue
> &
    IDecoder<TDecodedValue, TEncodedValue>;
