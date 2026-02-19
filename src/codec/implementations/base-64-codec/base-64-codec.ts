import { type ICodec } from "@/codec/contracts/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/codec/base-64-codec"`
 * @group Adapters
 */
export class Base64Codec implements ICodec<string, string> {
    encode(decodedValue: string): string {
        return btoa(decodedValue);
    }

    decode(encodedValue: string): string {
        return atob(encodedValue);
    }
}
