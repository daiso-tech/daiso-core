/**
 * @module Codec
 */

/**
 * Decoder contract defining the interface for converting encoded data to decoded format.
 *
 * Common use cases:
 * - JSON decoding: JSON string → object
 * - Base64 decoding: base64 string → binary data
 * - Decompression: compressed bytes → original data
 * - Decryption: ciphertext → plaintext
 *
 * @template TDecodedValue - The type produced by decoding (e.g., domain object, plaintext)
 * @template TEncodedValue - The type consumed by decoding (e.g., JSON string, ciphertext, transport format)
 *
 * IMPORT_PATH: `"@daiso-tech/core/codec/contracts"`
 * @group Contracts
 */
export type IDecoder<TDecodedValue, TEncodedValue> = {
    /**
     * Decodes the given encoded value into decoded format.
     * Transforms data from encoded format back to original format.
     *
     * @param encodedValue - The value in encoded format to decode
     * @returns The value in decoded format
     */
    decode(encodedValue: TEncodedValue): TDecodedValue;
};
