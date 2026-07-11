/**
 * @module HttpRouter
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

import { type IFileSize } from "@/file-size/contracts/_module.js";
import {
    type HttpResCacheControl,
    type HttpResContentDisposition,
    type HttpResContentEncoding,
    type HttpResContentLanguage,
    type HttpResContentRange,
    type HttpResContentType,
    type HttpResETag,
} from "@/http-router/contracts/http-res-headers.contract.js";
import { type HttpStatus } from "@/http-router/contracts/http-status.contract.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";

/**
 * Defines the scope of a cookie — the `Path`, `Secure`, and `Domain` attributes
 * that must match when reading or removing a previously set cookie.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type CookieScope = {
    /**
     * The `Path` attribute that was used when the cookie was set.
     *
     * @default null
     */
    path?: string | null;

    /**
     * The `Secure` attribute that was used when the cookie was set.
     *
     * @default false
     */
    secure?: boolean;

    /**
     * The `Domain` attribute that was used when the cookie was set.
     *
     * @default null
     */
    domain?: string | null;
};

/**
 * Settings for configuring a `Set-Cookie` header.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type CookieSetSettings = CookieScope & {
    /**
     * The `Expires` attribute — when the cookie should be removed.
     * Accepts a `Date` or an `ITimeSpan` (relative from now).
     *
     * @default null — omitted from the cookie
     */
    expires?: Date | ITimeSpan | null;

    /**
     * The `HttpOnly` attribute — when `true`, the cookie is inaccessible to JavaScript.
     *
     * @default false — omitted from the cookie
     */
    httpOnly?: boolean;

    /**
     * The `Max-Age` attribute — lifetime in seconds.
     * Accepts a raw number or an `ITimeSpan`.
     *
     * @default null — omitted from the cookie
     */
    maxAge?: number | ITimeSpan | null;

    /**
     * The `SameSite` attribute — controls cross-site request behaviour.
     * - `"Strict"` — only sent for same-site requests.
     * - `"Lax"` — sent for same-site and top-level navigation GET requests.
     * - `"None"` — sent for all requests (requires `Secure`).
     *
     * @default "Lax"
     */
    sameSite?: "Strict" | "Lax" | "None";

    /**
     * The `Priority` attribute — hints to the browser which cookies to evict first.
     *
     * @default null — omitted from the cookie
     */
    priority?: "Low" | "Medium" | "High" | null;

    /**
     * Cookie name prefix that browsers use to enforce additional security:
     * - `"secure"` — the `__Secure-` prefix, requires `Secure` and rejects `Domain`.
     * - `"host"` — the `__Host-` prefix, requires `Secure`, `Path=/`, and rejects `Domain`.
     *
     * @default null — omitted from the cookie
     */
    prefix?: "secure" | "host" | null;

    /**
     * The `Partitioned` attribute — when `true`, the cookie is stored using
     * partitioned storage (CHIPS), scoped to the top-level site.
     *
     * @default false — omitted from the cookie
     */
    partitioned?: boolean;
};

/**
 * Represents an outgoing HTTP response with a builder-style API.
 *
 * Each setter returns the instance for chaining. Access {@link webRes}
 * to obtain the final Web API `Response` object.
 *
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type IHttpRes = {
    /**
     * Sets the `Content-Type` header to a well-known media type.
     */
    setContentType(type: HttpResContentType): IHttpRes;

    /**
     * Sets the `Content-Length` header, accepting either a raw number or an IFileSize value.
     */
    setContentLength(length: number | IFileSize): IHttpRes;

    /**
     * Sets the `Content-Encoding` header (e.g. gzip, br, deflate).
     */
    setContentEncoding(encoding: HttpResContentEncoding): IHttpRes;

    /**
     * Sets the `Content-Language` header to a BCP 47 language tag.
     */
    setContentLanguage(language: HttpResContentLanguage): IHttpRes;

    /**
     * Sets the `Content-Disposition` header (inline or attachment).
     */
    setContentDisposition(disposition: HttpResContentDisposition): IHttpRes;

    /**
     * Sets the `Content-Range` header for partial content responses.
     */
    setContentRange(range: HttpResContentRange): IHttpRes;

    /**
     * Sets the `Cache-Control` header with caching directives.
     */
    setCacheControl(cacheControl: HttpResCacheControl): IHttpRes;

    /**
     * Sets the `ETag` header for conditional response caching.
     */
    setETag(eTag: HttpResETag): IHttpRes;

    /**
     * Sets the `Location` header, typically used for redirects (3xx).
     */
    setLocation(location: string): IHttpRes;

    /**
     * Sets an arbitrary response header by key and value.
     *
     * Useful for headers that don't have a dedicated setter method,
     * such as custom headers or less common standard headers.
     *
     * @param key - The header name (e.g. `"X-Custom-Header"`).
     * @param value - The header value.
     */
    setHeader(key: string, value: string): IHttpRes;

    /**
     * Appends a value to an existing response header instead of overwriting it.
     *
     * Useful for headers that support multiple values (e.g. `Vary`, `Link`,
     * `Set-Cookie`). Unlike {@link setHeader}, this adds the value alongside
     * any existing ones rather than replacing them.
     *
     * @param key - The header name.
     * @param value - The header value to append.
     */
    appendHeader(key: string, value: string): IHttpRes;

    /**
     * Returns the current value of a response header, or an empty string if not set.
     *
     * @param key - The header name.
     * @returns The header value, or `null` if absent.
     */
    getHeader(key: string): string | null;

    /**
     * Sets the HTTP response status code or well-known HttpStatus.
     */
    setStatus(status: HttpStatus | number): IHttpRes;

    /**
     * Sets the response body as raw bytes without overriding the `Content-Type` header.
     *
     * Accepts a string, binary buffer, or an async iterable of byte chunks for streaming.
     * Useful when the caller wants full control over the `Content-Type` header.
     *
     * @param content - The response body content.
     */
    setBody(
        content: string | ArrayBuffer | Uint8Array | AsyncIterable<unknown>,
    ): IHttpRes;

    /**
     * Adds a `Set-Cookie` header if one does not exist, or updates it
     * if a header with the given name is already present.
     *
     * @param name - The name of the cookie.
     * @param value - The cookie value.
     * @param settings - Optional cookie attributes (expires, httpOnly, etc.).
     * @returns This instance for chaining.
     */
    putCookie(
        name: string,
        value: string,
        settings?: CookieSetSettings,
    ): IHttpRes;

    /**
     * Adds or updates a `Set-Cookie` header with `Max-Age=0` for the given name,
     * expiring the cookie when the response is sent.
     *
     * If a `Set-Cookie` header with the given name already exists, it is
     * replaced with an expired version. Otherwise an expired header is
     * appended to ensure the client removes any matching cookie.
     *
     * @param name - The name of the cookie to expire.
     * @param settings - Optional scope attributes (path, secure, domain) to
     *   match the cookie that was originally set.
     * @returns This instance for chaining.
     */
    removeCookie(name: string, settings?: CookieScope): IHttpRes;

    /**
     * Strips all `Set-Cookie` headers from the response builder, or only
     * the header matching the given name when one is provided.
     *
     * @param name - Optional. The name of the cookie to strip. When omitted,
     *   all `Set-Cookie` headers are removed.
     * @returns This instance for chaining.
     */
    withoutCookies(name?: string): IHttpRes;

    /**
     * Checks whether any `Set-Cookie` headers are present, or whether a
     * header with the given name exists when one is provided.
     *
     * @param name - Optional. The name of the cookie to check. When omitted,
     *   returns `true` if at least one `Set-Cookie` header exists.
     * @returns `true` if a matching or any `Set-Cookie` header is present.
     */
    hasCookies(name?: string): boolean;

    /**
     * Builds and returns the final Web API `Response` object from all
     * configured headers, status, cookies, and body.
     *
     * You typically don't need to call this in handler functions — the
     * `HttpRouter` class calls it automatically. Use it directly only in
     * isolation, such as during testing.
     *
     * @returns The constructed HTTP response.
     */
    buildWebRes(): Response;
};

/**
 * Helper methods for creating common {@link IHttpRes} instances.
 *
 * Provides convenience factories for JSON, HTML, plain text, redirect,
 * and 404 responses, as well as a method to wrap an existing Web API
 * `Response` into an {@link IHttpRes} builder.
 *
 * These methods are available as static methods on the {@link HttpRes}
 * implementation class — you typically call them as
 * `HttpRes.json(...)`, `HttpRes.redirect(...)`, etc.
 *
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type IHttpResHelpers = {
    /**
     * Creates an `HttpRes` instance from a standard Web API `Response` object.
     *
     * Used for interoperability — copies the given `Response` into a new
     * `IHttpRes` builder instance so you can further modify it before
     * sending. The original `Response` is not mutated.
     *
     * Useful for integrating with `fetch` responses or libraries that rely
     * on the WinterTC standard (e.g. Better Auth).
     *
     * @param res - The source `Response` object to copy from.
     * @returns A new `IHttpRes` instance wrapping the response.
     */
    fromWebRes(res: Response): IHttpRes;

    /**
     * Replaces the response with a plain-text body and
     * `Content-Type: text/plain`.
     *
     * @param content - The text content.
     */
    text(content: string): IHttpRes;

    /**
     * Replaces the response with an HTML body and
     * `Content-Type: text/html`.
     *
     * @param content - The HTML content.
     */
    html(content: string): IHttpRes;

    /**
     * Replaces the response with a JSON body and
     * `Content-Type: application/json`.
     *
     * @param content - The data to serialize as JSON.
     * @param schema - An optional {@link https://standardschema.dev | Standard Schema}
     *   to validate the data before serialization. When provided, the data is
     *   validated against the schema and only valid data is serialized.
     *   Omit to skip validation.
     */
    json<TData>(
        content: TData,
        schema?: StandardSchemaV1<unknown, TData>,
    ): IHttpRes;

    /**
     * Replaces the response with a 404 Not Found HTML body and
     * `Content-Type: text/html`.
     */
    notFound(): IHttpRes;

    /**
     * Replaces the response with a temporary redirect (HTTP 302)
     * to the given URL.
     *
     * @param url - The redirect destination.
     */
    redirect(url: string): IHttpRes;

    /**
     * Replaces the response with a permanent redirect (HTTP 301)
     * to the given URL.
     *
     * @param url - The redirect destination.
     */
    permanentRedirect(url: string): IHttpRes;
};
