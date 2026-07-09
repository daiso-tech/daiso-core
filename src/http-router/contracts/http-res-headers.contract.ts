/**
 * @module HttpRouter
 */

import { type StrIntellisense } from "@/utilities/_module.js";

/**
 * Well-known `Cache-Control` directive values for HTTP responses.
 * Controls how browsers and intermediate caches store and revalidate the response.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpResCacheControl = StrIntellisense<
    | "no-cache"
    | "no-store"
    | "public"
    | "private"
    | "must-revalidate"
    | "proxy-revalidate"
    | "immutable"
    | "no-transform"
    | `max-age=${number}`
    | `s-maxage=${number}`
    | `stale-while-revalidate=${number}`
    | `stale-if-error=${number}`
>;

/**
 * `Content-Disposition` header values for HTTP responses.
 * Controls whether the content is displayed inline or downloaded as an attachment.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpResContentDisposition = StrIntellisense<
    "inline" | "attachment"
>;

/**
 * `Content-Encoding` header values for HTTP responses.
 * Indicates the compression algorithm applied to the response body.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpResContentEncoding = StrIntellisense<
    "gzip" | "br" | "deflate" | "compress" | "identity"
>;

/**
 * `Content-Language` header values for HTTP responses.
 * Specifies the natural language of the response content using BCP 47 language tags.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpResContentLanguage = StrIntellisense<
    | "en"
    | "en-US"
    | "en-GB"
    | "en-AU"
    | "en-CA"
    | "fr"
    | "fr-FR"
    | "fr-CA"
    | "de"
    | "de-DE"
    | "es"
    | "es-ES"
    | "pt"
    | "pt-BR"
    | "zh"
    | "zh-CN"
    | "zh-TW"
    | "ja"
    | "ko"
    | "ar"
    | "ru"
    | "it"
    | "it-IT"
    | "nl"
    | "nl-NL"
    | "pl"
    | "tr"
    | "sv"
    | "da"
    | "fi"
    | "nb"
    | "he"
    | "th"
    | "id"
    | "ms"
    | "vi"
    | "hi"
    | "bn"
>;

/**
 * `Content-Range` header format for HTTP partial content responses.
 * Follows the pattern `<unit> <range-start>-<range-end>/<size>`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpResContentRange = `${string} ${string}/${string}`;

/**
 * Well-known `application/*` media type subtypes.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpApplicationSubtype =
    | "json"
    | "xml"
    | "x-www-form-urlencoded"
    | "octet-stream"
    | "pdf"
    | "zip"
    | "gzip"
    | "graphql-response+json"
    | "ld+json"
    | "vnd.api+json"
    | "cbor"
    | "protobuf"
    | "grpc"
    | "grpc-web+proto"
    | "grpc-web+json"
    | "wasm"
    | "manifest+json"
    | "soap+xml";

/**
 * Well-known `text/*` media type subtypes.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpTextSubtype =
    | "plain"
    | "html"
    | "css"
    | "javascript"
    | "csv"
    | "markdown"
    | "event-stream"
    | "calendar"
    | "xml"
    | "yaml";

/**
 * Well-known `multipart/*` media type subtypes.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpMultipartSubtype =
    | "form-data"
    | "mixed"
    | "alternative"
    | "related"
    | "byte-ranges";

/**
 * Well-known `image/*` media type subtypes.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpImageSubtype =
    | "png"
    | "jpeg"
    | "gif"
    | "webp"
    | "svg+xml"
    | "avif"
    | "bmp"
    | "tiff"
    | "x-icon"
    | "heic"
    | "heif";

/**
 * Well-known `audio/*` media type subtypes.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpAudioSubtype =
    | "mpeg"
    | "ogg"
    | "wav"
    | "webm"
    | "aac"
    | "flac"
    | "mp4";

/**
 * Well-known `video/*` media type subtypes.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpVideoSubtype =
    | "mp4"
    | "webm"
    | "ogg"
    | "x-msvideo"
    | "mpeg"
    | "quicktime";

/**
 * Well-known `font/*` media type subtypes.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpFontSubtype = "ttf" | "otf" | "woff" | "woff2";

/**
 * Well-known `application/*` media type strings.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpApplicationMediaType = `application/${HttpApplicationSubtype}`;

/**
 * Well-known `text/*` media type strings.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpTextMediaType = `text/${HttpTextSubtype}`;

/**
 * Well-known `multipart/*` media type strings.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpMultipartMediaType = `multipart/${HttpMultipartSubtype}`;

/**
 * Well-known `image/*` media type strings.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpImageMediaType = `image/${HttpImageSubtype}`;

/**
 * Well-known `audio/*` media type strings.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpAudioMediaType = `audio/${HttpAudioSubtype}`;

/**
 * Well-known `video/*` media type strings.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpVideoMediaType = `video/${HttpVideoSubtype}`;

/**
 * Well-known `font/*` media type strings.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpFontMediaType = `font/${HttpFontSubtype}`;

/**
 * Union of all well-known `Content-Type` header values for HTTP responses.
 * Provides autocompletion for common media types while accepting any string.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpResContentType = StrIntellisense<
    | HttpApplicationMediaType
    | HttpTextMediaType
    | HttpMultipartMediaType
    | HttpImageMediaType
    | HttpAudioMediaType
    | HttpVideoMediaType
    | HttpFontMediaType
>;

/**
 * `ETag` header values for HTTP conditional responses.
 * Supports both strong (`"value"`) and weak (`W/"value"`) validators.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpResETag = `"${string}"` | `W/"${string}"`;
