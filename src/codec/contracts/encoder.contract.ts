/**
 * @module Codec
 */

/**
 * Encoder contract defining the interface for converting decoded data to encoded format.
 *
 * Common use cases:
 * - JSON encoding: object → JSON string
 * - Base64 encoding: binary data → base64 string
 * - Compression: large data → compressed bytes
 * - Encryption: plaintext → ciphertext
 *
 * @template TDecodedValue - The type of data before encoding (original/source format)
 * @template TEncodedValue - The type of data after encoding (target/transport format)
 *
 * IMPORT_PATH: `"@daiso-tech/core/codec/contracts"`
 * @group Contracts
 */
export type IEncoder<TDecodedValue, TEncodedValue> = {
    /**
     * Encodes the given decoded value into encoded format.
     * Transforms data from original format to target encoding.
     *
     * @param decodedValue - The value in original format to encode
     * @returns The value in encoded format
     */
    encode(decodedValue: TDecodedValue): TEncodedValue;
};
