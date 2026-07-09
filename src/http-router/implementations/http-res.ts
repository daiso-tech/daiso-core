/**
 * @module HttpRouter
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

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
    type StringInputs,
    type CookieSetSettings,
    type CookieScope,
    type IHttpResHelpers,
} from "@/http-router/contracts/_module.js";
import { TO_MILLISECONDS } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/time-span.js";
import { isAsyncIterable, validateSync } from "@/utilities/_module.js";

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
 * The default implementation of {@link IHttpRes}.
 *
 * Provides a builder-style API for constructing HTTP responses.
 * Each setter returns the instance for chaining.
 *
 * Static factory methods offer convenient shortcuts for common response types
 * such as JSON, HTML, plain text, and redirects.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */
export class HttpRes<
    TCookieData extends StringInputs = StringInputs,
> implements IHttpRes<TCookieData> {
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

    setContentType(type: HttpResContentType): IHttpRes<TCookieData> {
        return this.setHeader("Content-Type", type);
    }

    setContentLength(length: number | IFileSize): IHttpRes<TCookieData> {
        return this.setHeader(
            "Content-Length",
            String(typeof length === "number" ? length : length[TO_BYTES]()),
        );
    }

    setContentEncoding(
        encoding: HttpResContentEncoding,
    ): IHttpRes<TCookieData> {
        return this.setHeader("Content-Encoding", encoding);
    }

    setContentLanguage(
        language: HttpResContentLanguage,
    ): IHttpRes<TCookieData> {
        return this.setHeader("Content-Language", language);
    }

    setContentDisposition(
        disposition: HttpResContentDisposition,
    ): IHttpRes<TCookieData> {
        return this.setHeader("Content-Disposition", disposition);
    }

    setContentRange(range: HttpResContentRange): IHttpRes<TCookieData> {
        return this.setHeader("Content-Range", range);
    }

    setCacheControl(cacheControl: HttpResCacheControl): IHttpRes<TCookieData> {
        return this.setHeader("Cache-Control", cacheControl);
    }

    setETag(eTag: HttpResETag): IHttpRes<TCookieData> {
        return this.setHeader("ETag", eTag);
    }

    setLocation(location: string): IHttpRes<TCookieData> {
        return this.setHeader("Location", location);
    }

    setHeader(key: string, value: string): IHttpRes<TCookieData> {
        this.headers.set(key, value);
        return this;
    }

    appendHeader(key: string, value: string): IHttpRes<TCookieData> {
        this.headers.append(key, value);
        return this;
    }

    getHeader(key: string): string | null {
        return this.headers.get(key) ?? null;
    }

    setStatus(status: HttpStatus | number): IHttpRes<TCookieData> {
        this.status = Number(status);
        return this;
    }

    setStatusText(statusText: string): IHttpRes<TCookieData> {
        this.statusText = statusText;
        return this;
    }

    setBody(
        content: string | ArrayBuffer | Uint8Array | AsyncIterable<Uint8Array>,
    ): IHttpRes<TCookieData> {
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

    putCookie<
        TField extends keyof TCookieData,
        TValue extends TCookieData[TField],
    >(
        name: TField,
        value: TValue,
        settings: CookieSetSettings = {},
    ): IHttpRes<TCookieData> {
        if (typeof name !== "string") {
            throw new TypeError("Cookie name must be a string.");
        }
        if (value === undefined) {
            throw new TypeError("Cookie value must not be undefined.");
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

    removeCookie<TField extends keyof TCookieData>(
        name: TField,
        settings?: CookieScope,
    ): IHttpRes<TCookieData> {
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

    withoutCookies<TField extends keyof TCookieData>(
        name?: TField,
    ): IHttpRes<TCookieData> {
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

    hasCookies<TField extends keyof TCookieData>(name?: TField): boolean {
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

/**
 * @internal
 */
export const httpResHelpers: IHttpResHelpers<any> = {
    fromWebRes(res: Response): IHttpRes<any> {
        return new HttpRes<any>({
            headers: res.headers,
            status: res.status,
            statusText: res.statusText,
            body: res.body ?? null,
        });
    },
    text(content: string): IHttpRes<any> {
        return new HttpRes().setBody(content).setContentType("text/plain");
    },
    html(content: string): IHttpRes<any> {
        return new HttpRes().setBody(content).setContentType("text/html");
    },
    json<TData>(
        content: TData,
        schema?: StandardSchemaV1<unknown, TData>,
    ): IHttpRes<any> {
        if (schema !== undefined) {
            content = validateSync(schema, content);
        }
        return new HttpRes()
            .setBody(JSON.stringify(content))
            .setContentType("application/json");
    },
    notFound(): IHttpRes<any> {
        return this.html("Not found").setStatus(404);
    },
    redirect(url: string): IHttpRes<any> {
        return new HttpRes()
            .setStatus(302)
            .setLocation(url)
            .setContentType("text/plain");
    },
    permanentRedirect(url: string): IHttpRes<any> {
        return new HttpRes()
            .setStatus(301)
            .setLocation(url)
            .setContentType("text/plain");
    },
};
