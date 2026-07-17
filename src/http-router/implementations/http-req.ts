/**
 * @module HttpRouter
 */

import {
    type HttpMethod,
    type HttpReqSchemas,
    type IHttpFile,
    type IHttpReq,
    type RawFormData,
    type MultiStringInputs,
    type StringInputs,
    type FileDef,
    type FileInputs,
    type IValidatedHttpReq,
    type ReqInputs,
} from "@/http-router/contracts/_module.js";
import { HttpFile } from "@/http-router/implementations/http-file.js";
import { ValidatedHttpReq } from "@/http-router/implementations/validated-http-req.js";

/**
 * Configuration for creating an {@link HttpReq} from a standard Web API `Request`.
 *
 * Bundles the raw `Request` object with optional validation schemas and
 * pre-resolved path parameters so the resulting `HttpReq` can apply
 * type-safe validation on demand.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */
export type FromWebReqSettings = {
    /**
     * The raw Web API `Request` object to wrap.
     */
    request: Request;

    /**
     * @internal
     */
    _rawParams?: StringInputs;
};

/**
 * A variant of {@link TestReqBody} representing a JSON request body.
 *
 * Use this when you want to simulate an `application/json` payload
 * in tests. The `data` field accepts any value; it will be serialized
 * via `JSON.stringify` when the test {@link HttpReq} is constructed.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */
export type TestReqJsonBody = {
    type: "application/json";
    data: unknown;
};

/**
 * A variant of {@link TestReqBody} representing a URL-encoded form body.
 *
 * Use this when you want to simulate an
 * `application/x-www-form-urlencoded` payload in tests. The `data`
 * field is a {@link StringInputs} record of form field name/value pairs.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */
export type TestReqUrlEncodedBody = {
    type: "application/x-www-form-urlencoded";
    data: StringInputs;
};

/**
 * A variant of {@link TestReqBody} representing a multipart form data body.
 *
 * Use this when you want to simulate a `multipart/form-data` payload
 * in tests. The `data` object may contain:
 * - `fields` — a {@link StringInputs} record of form field name/value pairs.
 * - `files` — a record mapping file field names to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer | ArrayBuffer}
 *   instances representing raw file content.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */
export type TestReqMultipartFormDataBody = {
    type: "multipart/form-data";
    data: {
        fields?: StringInputs;
        /**
         * A record mapping file field names to their raw content.
         * Accepts a single `ArrayBuffer` for single-file fields or
         * `ArrayBuffer[]` for multi-file fields.
         */
        files?: Partial<Record<string, ArrayBuffer | Array<ArrayBuffer>>>;
    };
};

/**
 * A variant of {@link TestReqBody} representing a custom/opaque request body.
 *
 * Use this when you want to simulate an arbitrary payload that does not
 * fit into the JSON, URL-encoded, or multipart categories. The `data`
 * field is passed through as-is when the test {@link HttpReq} is constructed.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */
export type TestReqCustom = {
    type: "custom";
    data: unknown;
};

/**
 * A discriminated union representing the body of an HTTP request for
 * testing purposes.
 *
 * Each variant maps to a content type, allowing the body data to be
 * typed according to the selected format.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */
export type TestReqBody =
    | TestReqJsonBody
    | TestReqUrlEncodedBody
    | TestReqMultipartFormDataBody
    | TestReqCustom;

/**
 * Configuration for creating an {@link HttpReq} instance for testing purposes.
 *
 * Allows you to construct a fully synthetic HTTP request by providing
 * mock values for every request data source — path parameters, search
 * parameters, headers, cookies, and body — along with optional validation
 * schemas. This is the primary way to create an {@link IHttpReq} in unit
 * tests without needing a real Web API `Request` object.
 *
 * @typeParam TReqJson - The type of the parsed JSON body.
 * @typeParam TReqFields - The type of the parsed form fields.
 * @typeParam TReqParams - The type of the parsed path parameters.
 * @typeParam TReqSearchParams - The type of the parsed query parameters.
 * @typeParam TReqHeaders - The type of the parsed headers.
 * @typeParam TReqFiles - The expected file upload definitions.
 * @typeParam TCookieData - A record mapping cookie names to their value types.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */
export type TestReqSettings = {
    method: HttpMethod;

    /**
     * @default "https://test.local"
     */
    hostname?: string;

    url: string;

    /**
     * Mock path parameters (e.g. `{ id: "42" }` for a route like `/users/:id`).
     */
    params?: StringInputs;

    /**
     * Mock query/search parameters (e.g. `{ page: "1", tags: ["a", "b"] }`).
     */
    searchParams?: MultiStringInputs;

    /**
     * Mock HTTP request headers.
     */
    headers?: StringInputs;

    /**
     * Mock cookie values.
     */
    cookies?: StringInputs;

    /**
     * Mock request body, structured by content type.
     *
     * Use the discriminated union variants to specify JSON, URL-encoded
     * form data, multipart form data (with optional file uploads), or a
     * custom payload.
     */
    body?: TestReqBody;
};

/**
 * The default implementation of {@link IHttpReq}.
 *
 * Provides typed access to all request data sources — JSON body, form fields,
 * path parameters, query parameters, headers, and the raw body.
 *
 * Use {@link HttpReq.fromWebReq} to create an instance from a standard Web API `Request` object.
 *
 * @typeParam TReqMethod - The HTTP method type.
 * @typeParam TReqJson - The type of the parsed JSON body.
 * @typeParam TReqFields - The type of the parsed form fields.
 * @typeParam TReqParams - The type of the parsed path parameters.
 * @typeParam TReqSearchParams - The type of the parsed query parameters.
 * @typeParam TReqHeaders - The type of the parsed headers.
 * @typeParam TReqFiles - The expected file upload definitions.
 * @typeParam TCookieData - A record mapping cookie names to their value types.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */
export class HttpReq implements IHttpReq {
    /**
     * Creates an `HttpReq` instance from a standard Web API `Request` object.
     *
     * @param req - The source `Request` object.
     * @returns A new `IHttpReq` instance wrapping the request.
     */
    static fromWebReq(settings: FromWebReqSettings): IHttpReq {
        const { request, _rawParams } = settings;
        return new HttpReq(request, _rawParams);
    }

    private static deserializeCookies(headers: Headers): StringInputs {
        const cookie = headers.get("Cookie");
        if (cookie === null) {
            return {};
        }

        const deserializedCookies = Object.fromEntries(
            cookie
                .split(";")
                .filter((item) => item !== "")
                .map((item) => item.trim())
                .map<[name: string, value: string]>((item) => {
                    const [name, ...rest] = item.split("=");
                    const value = rest.join("=");
                    if (name === undefined) {
                        throw new TypeError(
                            "Failed to parse Cookie header: missing cookie name.",
                        );
                    }
                    if (rest.length === 0) {
                        throw new TypeError(
                            "Failed to parse Cookie header: missing '=' delimiter in cookie entry.",
                        );
                    }
                    return [name.trim(), value.trim()];
                }),
        );

        return deserializedCookies;
    }

    private static serializeCookies(cookies: StringInputs): string {
        return [...Object.entries(cookies)]
            .filter((part): part is [string, string] => {
                const [_key, value] = part;
                return value !== undefined;
            })
            .map(([key, value]) => {
                return `${key}=${value}`;
            })
            .join("; ")
            .trim();
    }

    private static buildTestUrl(
        hostname: string,
        url: string,
        searchParams: MultiStringInputs,
    ): string {
        const urlSearchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(searchParams)) {
            if (value === undefined) {
                continue;
            }
            if (Array.isArray(value)) {
                for (const item of value) {
                    urlSearchParams.append(key, item);
                }
            } else {
                urlSearchParams.append(key, value);
            }
        }
        url = String(new URL(url, hostname));
        if (urlSearchParams.size !== 0) {
            url = `${url}?${String(urlSearchParams)}`;
        }

        return url;
    }

    private static buildTestHeaders(
        headers: StringInputs,
        cookies: StringInputs,
    ): Headers {
        const finalHeaders = new Headers(
            [...Object.entries(headers)].filter(
                (pair): pair is [string, string] => {
                    const [_key, value] = pair;
                    return value !== undefined;
                },
            ),
        );

        const cookiesFromHeaders = HttpReq.deserializeCookies(finalHeaders);

        const finalCookies = {
            ...cookiesFromHeaders,
            ...cookies,
        };
        finalHeaders.set("Cookie", HttpReq.serializeCookies(finalCookies));

        return finalHeaders;
    }

    private static buildJsonTestBody(
        finalHeaders: Headers,
        body: TestReqJsonBody,
    ): string {
        finalHeaders.set("Content-Type", "application/json");
        return JSON.stringify(body.data);
    }

    private static buildUrlEncodedTestBody(
        finalHeaders: Headers,
        body: TestReqUrlEncodedBody,
    ): string {
        const searchParams = new URLSearchParams(
            [...Object.entries(body.data)].filter(
                (entry): entry is [string, string] => {
                    const [_key, value] = entry;
                    return value !== undefined;
                },
            ),
        );
        finalHeaders.set("Content-Type", "application/x-www-form-urlencoded");
        return String(searchParams);
    }

    private static buildMultipartFormDataTestBody(
        finalHeaders: Headers,
        body: TestReqMultipartFormDataBody,
    ): FormData {
        const formData = new FormData();
        for (const key in body.data) {
            if (body.data.fields?.[key] === undefined) {
                continue;
            }
            formData.set(key, body.data.fields[key]);
        }
        for (const key in body.data) {
            const fileData = body.data.files?.[key];
            if (fileData === undefined) {
                continue;
            }
            if (Array.isArray(fileData)) {
                for (const arrayBuffer of fileData) {
                    formData.append(key, new File([arrayBuffer], key));
                }
            } else {
                formData.set(key, new File([fileData], key));
            }
        }
        finalHeaders.set("Content-Type", "multipart/form-data");

        return formData;
    }

    private static buildTestBody(
        finalHeaders: Headers,
        body: TestReqBody | undefined,
    ): any {
        let finalBody: any;
        if (body?.type === "application/json") {
            return HttpReq.buildJsonTestBody(finalHeaders, body);
        }
        if (body?.type === "application/x-www-form-urlencoded") {
            return HttpReq.buildUrlEncodedTestBody(finalHeaders, body);
        }
        if (body?.type === "multipart/form-data") {
            return HttpReq.buildMultipartFormDataTestBody(finalHeaders, body);
        }
        if (body?.type === "custom") {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            finalBody = body.data as any;
        }

        return finalBody;
    }

    /**
     * Creates an `HttpReq` instance with synthetic data for testing.
     *
     * Unlike {@link HttpReq.fromWebReq}, this method does not require a
     * real Web API `Request` object. Instead, you provide mock values for
     * path parameters, search parameters, headers, cookies, and body
     * through {@link TestReqSettings}. The resulting `HttpReq` behaves
     * identically to one created from a real request, including validation
     * support.
     *
     * @param settings - Configuration for the test request, including mock
     *   data and optional validation schemas.
     * @returns A new `IHttpReq` instance suitable for testing.
     */
    static test(settings: TestReqSettings): IHttpReq {
        const {
            method,
            hostname = "https://test.local",
            url,
            params = {},
            searchParams = {},
            headers = {},
            cookies = {},
            body,
        } = settings;

        const finalUrl = HttpReq.buildTestUrl(hostname, url, searchParams);

        const finalHeaders = HttpReq.buildTestHeaders(headers, cookies);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const finalBody = HttpReq.buildTestBody(finalHeaders, body);

        const request = new Request(finalUrl, {
            headers: finalHeaders,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            body: finalBody,
            method,
        });

        return new HttpReq(request, params);
    }

    private constructor(
        private readonly request: Request,
        private readonly rawParamsData: StringInputs = {},
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<unknown> {
        if (this.request.body) {
            yield* this.request.body;
        }
    }

    text(): Promise<string> {
        return this.request.text();
    }

    get readableStream(): ReadableStream<unknown> | null {
        return this.request.body;
    }

    get signal(): AbortSignal {
        return this.request.signal;
    }

    rawCookies(): StringInputs {
        return HttpReq.deserializeCookies(this.request.headers);
    }

    get method(): HttpMethod {
        return this.request.method;
    }

    get url(): string {
        return this.request.url;
    }

    rawJson(): Promise<unknown> {
        return this.request.json();
    }

    async rawFormData(): Promise<RawFormData> {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        const formData = await this.request.formData();
        const result: Record<
            string,
            string | Array<string> | IHttpFile | Array<IHttpFile>
        > = {};
        const seen = new Set<string>();
        for (const [key, value] of formData.entries()) {
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            const values = formData.getAll(key);
            if (typeof value !== "string") {
                if (values.length === 1) {
                    result[key] = new HttpFile(value) satisfies IHttpFile;
                } else {
                    result[key] = (values as Array<File>).map(
                        (f) => new HttpFile(f),
                    ) satisfies Array<IHttpFile>;
                }
                continue;
            }
            if (values.length === 1) {
                result[key] = value;
            } else {
                result[key] = values as Array<string>;
            }
        }
        return result;
    }

    rawParams(): StringInputs {
        return this.rawParamsData;
    }

    rawSearchParams(): MultiStringInputs {
        const result: Record<string, string | Array<string>> = {};
        const searchParams = new URL(this.url).searchParams;
        for (const key of new Set(searchParams.keys())) {
            const values = searchParams.getAll(key);
            const firstValue = values[0];
            if (values.length === 1 && firstValue !== undefined) {
                result[key] = firstValue;
            } else {
                result[key] = values;
            }
        }
        return result;
    }

    rawHeaders(): StringInputs {
        return Object.fromEntries(this.request.headers.entries());
    }

    arrayBuffer(): Promise<ArrayBuffer> {
        return this.request.arrayBuffer();
    }

    bytes(): Promise<Uint8Array> {
        return this.request.bytes();
    }

    blob(): Promise<Blob> {
        return this.request.blob();
    }

    get webReq(): Request {
        return this.request;
    }

    withSchema<
        TReqJson = unknown,
        TReqFields extends ReqInputs = Partial<Record<string, unknown>>,
        TReqParams extends ReqInputs = Partial<Record<string, unknown>>,
        TReqSearchParams extends ReqInputs = Partial<Record<string, unknown>>,
        TReqHeaders extends ReqInputs = Partial<Record<string, unknown>>,
        TReqFiles extends FileInputs = Partial<Record<string, FileDef>>,
        TCookieData extends StringInputs = Partial<Record<string, string>>,
    >(
        schemas: HttpReqSchemas<
            TReqJson,
            TReqFields,
            TReqParams,
            TReqSearchParams,
            TReqHeaders,
            TReqFiles,
            TCookieData
        >,
    ): IValidatedHttpReq<
        TReqJson,
        TReqFields,
        TReqParams,
        TReqSearchParams,
        TReqHeaders,
        TReqFiles,
        TCookieData
    > {
        return new ValidatedHttpReq(this, schemas);
    }
}
