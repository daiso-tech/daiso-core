/**
 * @module HttpRouter
 */

import { TO_BYTES, type IFileSize } from "@/file-size/contracts/_module.js";
import {
    type HttpResContentType,
    type HttpResContentEncoding,
    type HttpResContentLanguage,
    type HttpResContentDisposition,
    type HttpResContentRange,
    type HttpResCacheControl,
    type HttpResETag,
    type IHttpRes,
    type HttpStatus,
    type CookieSetSettings,
    type CookieScope,
} from "@/http-router/contracts/_module.js";
import { TO_MILLISECONDS } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/time-span.js";
import { isAsyncIterable } from "@/utilities/_module.js";

/**
 * @internal
 */
type CookieEntry = Required<CookieSetSettings> & {
    value: string;
    name: string;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */
export type IHttpResSettings = {
    headers?: Headers;
    status?: number;
    statusText?: string;
    body?: ReadableStream | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */
export class HttpRes implements IHttpRes {
    private headers: Headers;
    private status: number | null;
    private statusText: string | null;
    private body:
        | string
        | ArrayBuffer
        | Uint8Array
        | AsyncIterable<unknown>
        | null;

    constructor(settings: IHttpResSettings = {}) {
        const {
            headers = new Headers(),
            status = null,
            statusText = null,
            body = null,
        } = settings;

        this.headers = headers;
        this.status = status;
        this.statusText = statusText;
        this.body = body;
    }

    setContentType(type: HttpResContentType): IHttpRes {
        return this.setHeader("Content-Type", type);
    }

    setContentLength(length: number | IFileSize): IHttpRes {
        return this.setHeader(
            "Content-Length",
            String(typeof length === "number" ? length : length[TO_BYTES]()),
        );
    }

    setContentEncoding(encoding: HttpResContentEncoding): IHttpRes {
        return this.setHeader("Content-Encoding", encoding);
    }

    setContentLanguage(language: HttpResContentLanguage): IHttpRes {
        return this.setHeader("Content-Language", language);
    }

    setContentDisposition(disposition: HttpResContentDisposition): IHttpRes {
        return this.setHeader("Content-Disposition", disposition);
    }

    setContentRange(range: HttpResContentRange): IHttpRes {
        return this.setHeader("Content-Range", range);
    }

    setCacheControl(cacheControl: HttpResCacheControl): IHttpRes {
        return this.setHeader("Cache-Control", cacheControl);
    }

    setETag(eTag: HttpResETag): IHttpRes {
        return this.setHeader("ETag", eTag);
    }

    setLocation(location: string): IHttpRes {
        return this.setHeader("Location", location);
    }

    setHeader(key: string, value: string): IHttpRes {
        this.headers.set(key, value);
        return this;
    }

    appendHeader(key: string, value: string): IHttpRes {
        this.headers.append(key, value);
        return this;
    }

    getHeader(key: string): string | null {
        return this.headers.get(key) ?? null;
    }

    setStatus(status: HttpStatus | number): IHttpRes {
        this.status = Number(status);
        return this;
    }

    setStatusText(statusText: string): IHttpRes {
        this.statusText = statusText;
        return this;
    }

    setBody(
        content: string | ArrayBuffer | Uint8Array | AsyncIterable<Uint8Array>,
    ): IHttpRes {
        this.body = content;
        return this;
    }

    // eslint-disable-next-line sonarjs/cyclomatic-complexity
    private static serializeCookie(cookie: CookieEntry): string {
        const parts: Array<string> = [];

        let name = cookie.name;
        if (cookie.prefix === "secure") {
            name = `__Secure-${cookie.name}`;
        } else if (cookie.prefix === "host") {
            name = `__Host-${cookie.name}`;
        }

        parts.push(`${name}=${cookie.value}`);

        if (cookie.expires !== null) {
            const date =
                cookie.expires instanceof Date
                    ? cookie.expires
                    : new Date(Date.now() + cookie.expires[TO_MILLISECONDS]());
            parts.push(`Expires=${date.toUTCString()}`);
        }

        if (cookie.maxAge !== null) {
            const seconds =
                typeof cookie.maxAge === "number"
                    ? cookie.maxAge
                    : Math.floor(cookie.maxAge[TO_MILLISECONDS]() / 1000);
            parts.push(`Max-Age=${String(seconds)}`);
        }

        if (cookie.domain !== null) {
            parts.push(`Domain=${cookie.domain}`);
        }

        if (cookie.path !== null) {
            parts.push(`Path=${cookie.path}`);
        }

        if (cookie.secure) {
            parts.push("Secure");
        }

        if (cookie.httpOnly) {
            parts.push("HttpOnly");
        }

        parts.push(`SameSite=${cookie.sameSite}`);

        if (cookie.priority !== null) {
            parts.push(`Priority=${cookie.priority}`);
        }

        if (cookie.partitioned) {
            parts.push("Partitioned");
        }

        return parts.join("; ").trim();
    }

    // eslint-disable-next-line sonarjs/cyclomatic-complexity
    private static serializeCookiePut(
        name: string,
        value: string,
        settings: CookieSetSettings = {},
    ): string {
        return HttpRes.serializeCookie({
            name,
            value,
            expires: settings.expires ?? null,
            httpOnly: settings.httpOnly ?? false,
            maxAge: settings.maxAge ?? null,
            sameSite: settings.sameSite ?? "Lax",
            priority: settings.priority ?? null,
            prefix: settings.prefix ?? null,
            partitioned: settings.partitioned ?? false,
            path: settings.path ?? null,
            secure: settings.secure ?? false,
            domain: settings.domain ?? null,
        });
    }

    private static isSetCookieHeader(headerName: string): boolean {
        return headerName.toLowerCase() === "set-cookie";
    }

    private static isCookieMatching(
        headerValue: string,
        cookieName: string,
    ): boolean {
        const equalityCharIndex = headerValue.indexOf("=");
        if (equalityCharIndex === -1) {
            throw new TypeError(
                "Invalid Set-Cookie header: missing '=' delimiter.",
            );
        }
        const extractedCookieName = headerValue
            .slice(0, equalityCharIndex)
            .trim();
        return extractedCookieName === cookieName;
    }

    putCookie(
        name: string,
        value: string,
        settings: CookieSetSettings = {},
    ): IHttpRes {
        if (typeof name !== "string") {
            throw new TypeError("Cookie name must be a string.");
        }

        if (!this.hasCookies(name)) {
            this.headers.append(
                "Set-Cookie",
                HttpRes.serializeCookiePut(name, value, settings),
            );
            return this;
        }

        this.headers = new Headers(
            [...this.headers].map(([headerName, headerValue]) => {
                if (!HttpRes.isSetCookieHeader(headerName)) {
                    return [headerName, headerValue];
                }

                if (!HttpRes.isCookieMatching(headerValue, name)) {
                    return [headerName, headerValue];
                }

                return [
                    headerName,
                    HttpRes.serializeCookiePut(name, value, settings),
                ];
            }),
        );

        return this;
    }

    private static serializeCookieRemoval(
        name: string,
        settings: CookieScope = {},
    ): string {
        return HttpRes.serializeCookie({
            path: settings.path ?? null,
            secure: settings.secure ?? false,
            domain: settings.domain ?? null,
            expires: TimeSpan.fromDays(365 * 5).toStartDate(),
            httpOnly: false,
            maxAge: 0,
            prefix: null,
            partitioned: false,
            sameSite: "Lax",
            priority: null,
            value: "",
            name,
        });
    }

    removeCookie(name: string, settings?: CookieScope): IHttpRes {
        if (typeof name !== "string") {
            throw new TypeError("Cookie name must be a string.");
        }

        if (!this.hasCookies(name)) {
            this.headers.append(
                "Set-Cookie",
                HttpRes.serializeCookieRemoval(name, settings),
            );
            return this;
        }

        this.headers = new Headers(
            [...this.headers].map(([headerName, headerValue]) => {
                if (!HttpRes.isSetCookieHeader(headerName)) {
                    return [headerName, headerValue];
                }

                if (!HttpRes.isCookieMatching(headerValue, name)) {
                    return [headerName, headerValue];
                }

                return [
                    headerName,
                    HttpRes.serializeCookieRemoval(name, settings),
                ];
            }),
        );
        return this;
    }

    withoutCookies(name?: string): IHttpRes {
        if (name === undefined) {
            this.headers = new Headers(
                [...this.headers].filter(
                    ([headerName]) => !HttpRes.isSetCookieHeader(headerName),
                ),
            );
            return this;
        }

        if (typeof name !== "string") {
            throw new TypeError("Cookie name must be a string.");
        }

        this.headers = new Headers(
            [...this.headers].filter(([headerName, headerValue]) => {
                if (!HttpRes.isSetCookieHeader(headerName)) {
                    return true;
                }

                return !HttpRes.isCookieMatching(headerValue, name);
            }),
        );

        return this;
    }

    hasCookies(name?: string): boolean {
        const cookies = [...this.headers].filter(([headerName]) =>
            HttpRes.isSetCookieHeader(headerName),
        );

        if (name === undefined) {
            return cookies.length !== 0;
        }

        if (typeof name !== "string") {
            throw new TypeError("Cookie name must be a string.");
        }

        return cookies.some(([_headerName, headerValue]) =>
            HttpRes.isCookieMatching(headerValue, name),
        );
    }

    buildWebRes(): Response {
        let body:
            | string
            | ArrayBuffer
            | Uint8Array
            | ReadableStream<unknown>
            | undefined;

        if (isAsyncIterable(this.body)) {
            body = ReadableStream.from(this.body);
        } else {
            body = this.body ?? undefined;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return new Response(body as any, {
            status: this.status ?? undefined,
            statusText: this.statusText ?? undefined,
            headers: this.headers,
        });
    }
}
