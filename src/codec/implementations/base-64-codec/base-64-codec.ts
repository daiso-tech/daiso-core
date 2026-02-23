import {
    type ICodec,
    EncodingError,
    DecodingError,
} from "@/codec/contracts/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/codec/base-64-codec"`
 * @group Adapters
 */
export class Base64Codec implements ICodec<string, string> {
    encode(decodedValue: string): string {
        try {
            return btoa(decodedValue);
        } catch (error: unknown) {
            throw EncodingError.create(error);
        }
    }

    decode(encodedValue: string): string {
        try {
            return atob(encodedValue);
        } catch (error: unknown) {
            throw DecodingError.create(error);
        }
    }
}
