/**
 * @module HttpRouter
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

import { TO_BYTES } from "@/file-size/contracts/_module.js";
import {
    type FileDef,
    type FileInputs,
    type HttpMethod,
    type HttpReqFiles,
    type HttpReqSchema,
    type HttpSchema,
    type IHttpFile,
    type IHttpFileCollection,
    type IHttpReq,
    type RawFormData,
    type ReqInputs,
    type MultiStringInputs,
    type StringInputs,
    type StaticFileDef,
} from "@/http-router/contracts/_module.js";
import { HttpFileCollection } from "@/http-router/implementations/http-file-collection.js";
import { HttpFile } from "@/http-router/implementations/http-file.js";
import {
    validate,
    validateSync,
    ValidationError,
    callInvokable,
    isInvokableObject,
    type UndefinedToNull,
} from "@/utilities/_module.js";

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
 * Optional validation schemas for use with {@link HttpReq.fromUrl}.
 *
 * Groups a {@link HttpReqSchema} for validating request data (JSON body, form
 * fields, path parameters, search parameters, headers, and file definitions)
 * together with an optional {@link https://standardschema.dev/ | Standard Schema V1}
 * schema for validating and transforming cookies.
 *
 * Each field maps directly to its own type parameter so TypeScript can infer
 * the output type from the schema (e.g. from a Zod schema) without needing
 * to reverse through indexed access types.
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
export type HttpReqValidation<
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
> = {
    req?: HttpReqSchema<
        TReqJson,
        TReqFields,
        TReqParams,
        TReqSearchParams,
        TReqHeaders,
        TReqFiles
    >;
    cookies?: StandardSchemaV1<StringInputs, TCookieData>;
};

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
export type TestReqSettings<
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
> = {
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

    /**
     * Validation schemas for request data and cookies.
     *
     * Each schema is applied lazily when the corresponding accessor
     * (e.g. {@link IHttpReq.json}, {@link IHttpReq.params},
     * {@link IHttpReq.cookies}) is called on the resulting `HttpReq`.
     */
    validation?: HttpSchema<
        TReqJson,
        TReqFields,
        TReqParams,
        TReqSearchParams,
        TReqHeaders,
        TReqFiles,
        TCookieData
    >;
};

/**
 * Configuration for creating an {@link HttpReq} from a standard Web API `Request`.
 *
 * Bundles the raw `Request` object with optional validation schemas and
 * pre-resolved path parameters so the resulting `HttpReq` can apply
 * type-safe validation on demand.
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
export type FromWebReqSettings<
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
> = {
    /**
     * The raw Web API `Request` object to wrap.
     */
    request: Request;

    /**
     * Validation schemas for request data and cookies.
     *
     * Each schema is applied lazily when the corresponding accessor
     * (e.g. {@link IHttpReq.json}, {@link IHttpReq.params},
     * {@link IHttpReq.cookies}) is called on the resulting `HttpReq`.
     */
    validation?: HttpSchema<
        TReqJson,
        TReqFields,
        TReqParams,
        TReqSearchParams,
        TReqHeaders,
        TReqFiles,
        TCookieData
    >;

    /**
     * @internal
     */
    _rawParams?: StringInputs;
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
export class HttpReq<
    TReqMethod = HttpMethod,
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
> implements IHttpReq<
    TReqMethod,
    TReqJson,
    TReqFields,
    TReqParams,
    TReqSearchParams,
    TReqHeaders,
    TReqFiles,
    TCookieData
> {
    /**
     * Creates an `HttpReq` instance from a standard Web API `Request` object.
     *
     * @typeParam TMethod_ - The HTTP method type.
     * @typeParam TJson_ - The type of the parsed JSON body.
     * @typeParam TReqFields_ - The type of the parsed form fields.
     * @typeParam TParams_ - The type of the parsed path parameters.
     * @typeParam TSearchParams_ - The type of the parsed query parameters.
     * @typeParam THeaders_ - The type of the parsed headers.
     * @typeParam TReqFiles_ - The expected file upload definitions.
     * @param req - The source `Request` object.
     * @returns A new `IHttpReq` instance wrapping the request.
     */
    static fromWebReq<
        TMethod_ = HttpMethod,
        TJson_ = unknown,
        TReqFields_ extends ReqInputs = ReqInputs,
        TParams_ extends ReqInputs = ReqInputs,
        TSearchParams_ extends ReqInputs = ReqInputs,
        THeaders_ extends StringInputs = StringInputs,
        TReqFiles_ extends FileInputs = FileInputs,
        TCookieData_ extends StringInputs = StringInputs,
    >(
        settings: FromWebReqSettings<
            TJson_,
            TReqFields_,
            TParams_,
            TSearchParams_,
            THeaders_,
            TReqFiles_,
            TCookieData_
        >,
    ): IHttpReq<
        TMethod_,
        TJson_,
        TReqFields_,
        TParams_,
        TSearchParams_,
        THeaders_,
        TReqFiles_
    > {
        const { request, validation, _rawParams } = settings;
        return new HttpReq(request, validation, _rawParams);
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
     * @typeParam TMethod_ - The HTTP method type.
     * @typeParam TJson_ - The type of the parsed JSON body.
     * @typeParam TReqFields_ - The type of the parsed form fields.
     * @typeParam TParams_ - The type of the parsed path parameters.
     * @typeParam TSearchParams_ - The type of the parsed query parameters.
     * @typeParam THeaders_ - The type of the parsed headers.
     * @typeParam TReqFiles_ - The expected file upload definitions.
     * @typeParam TCookieData_ - A record mapping cookie names to their value types.
     * @param settings - Configuration for the test request, including mock
     *   data and optional validation schemas.
     * @returns A new `IHttpReq` instance suitable for testing.
     */
    static test<
        TMethod_ = HttpMethod,
        TJson_ = unknown,
        TReqFields_ extends ReqInputs = ReqInputs,
        TParams_ extends ReqInputs = ReqInputs,
        TSearchParams_ extends ReqInputs = ReqInputs,
        THeaders_ extends StringInputs = StringInputs,
        TReqFiles_ extends FileInputs = FileInputs,
        TCookieData_ extends StringInputs = StringInputs,
    >(
        settings: TestReqSettings<
            TJson_,
            TReqFields_,
            TParams_,
            TSearchParams_,
            THeaders_,
            TReqFiles_,
            TCookieData_
        >,
    ): IHttpReq<
        TMethod_,
        TJson_,
        TReqFields_,
        TParams_,
        TSearchParams_,
        THeaders_,
        TReqFiles_
    > {
        const {
            hostname = "https://test.local",
            url,
            params = {},
            searchParams = {},
            headers = {},
            cookies = {},
            body,
            validation = {},
        } = settings;

        const finalUrl = HttpReq.buildTestUrl(hostname, url, searchParams);

        const finalHeaders = HttpReq.buildTestHeaders(headers, cookies);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const finalBody = HttpReq.buildTestBody(finalHeaders, body);

        const request = new Request(finalUrl, {
            headers: finalHeaders,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            body: finalBody,
        });

        return new HttpReq<
            TMethod_,
            TJson_,
            TReqFields_,
            TParams_,
            TSearchParams_,
            THeaders_,
            TReqFiles_
        >(request, validation, params);
    }

    private constructor(
        private readonly request: Request,
        private readonly validation: HttpReqValidation<
            TReqJson,
            TReqFields,
            TReqParams,
            TReqSearchParams,
            TReqHeaders,
            TReqFiles,
            TCookieData
        > = {},
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

    cookies(): TCookieData;
    cookies<
        TField extends keyof TCookieData,
        TValue extends TCookieData[TField],
    >(field: TField): UndefinedToNull<TValue>;
    cookies<
        TField extends keyof TCookieData,
        TValue extends TCookieData[TField],
    >(field?: TField): UndefinedToNull<TValue> | TCookieData {
        const rawCookies = this.rawCookies();

        let cookies = rawCookies as TCookieData;
        if (this.validation.cookies) {
            cookies = validateSync(this.validation.cookies, rawCookies);
        }

        if (field === undefined) {
            return cookies;
        }

        return (cookies[field] ?? null) as UndefinedToNull<TValue>;
    }

    rawCookies(): StringInputs {
        return HttpReq.deserializeCookies(this.request.headers);
    }

    get method(): TReqMethod {
        return this.request.method as TReqMethod;
    }

    get url(): string {
        return this.request.url;
    }

    async json(): Promise<TReqJson> {
        const data = await this.rawJson();
        if (this.validation.req?.json) {
            return await validate(this.validation.req.json, data);
        }
        return data as TReqJson;
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

    fields(): Promise<TReqFields>;
    fields<TField extends keyof TReqFields, TValue extends TReqFields[TField]>(
        field: TField,
    ): Promise<UndefinedToNull<TValue>>;
    async fields<
        TField extends keyof TReqFields,
        TValue extends TReqFields[TField],
    >(field?: TField): Promise<TValue | TReqFields> {
        const formData = await this.rawFormData();

        const rawFormFields: MultiStringInputs = {};
        for (const [key, value] of Object.entries(formData)) {
            if (typeof value === "string") {
                rawFormFields[key] = value;
            } else if (
                Array.isArray(value) &&
                value.length > 0 &&
                typeof value[0] === "string"
            ) {
                rawFormFields[key] = value as Array<string>;
            }
        }

        let fields = rawFormFields as TReqFields;
        if (this.validation.req?.fields) {
            fields = await validate(this.validation.req.fields, rawFormFields);
        }

        if (field === undefined) {
            return fields;
        }

        const selectedFormFieldValue = (fields[field] ?? null) as TValue;
        return selectedFormFieldValue;
    }

    private async validateFormFiles(): Promise<HttpReqFiles<TReqFiles>> {
        const formData = await this.rawFormData();

        const rawFormFiles = Object.fromEntries(
            Object.entries(formData).filter(([_key, value]) => {
                return typeof value !== "string";
            }),
        ) as Partial<Record<string, IHttpFile | Array<IHttpFile>>>;

        const filesValidation = (this.validation.req?.files ?? {}) as TReqFiles;
        const result: Record<string, IHttpFileCollection> = {};

        for (const key in filesValidation) {
            const fileValidation = filesValidation[key];
            if (fileValidation === undefined) {
                continue;
            }

            const collected = this.collectFiles(rawFormFiles[key]);
            const resolvedDefs = this.resolveFileDefs(
                fileValidation,
                collected,
            );

            for (const [index, file] of collected.entries()) {
                const def = resolvedDefs[index];
                if (def === undefined) {
                    continue;
                }
                this.validateSingleFile(key, index, file, def);
            }

            this.validateFileCount(key, collected.length, resolvedDefs[0]);
            result[key] = new HttpFileCollection(key, collected);
        }

        return result as HttpReqFiles<TReqFiles>;
    }

    private collectFiles(
        rawFile: IHttpFile | Array<IHttpFile> | undefined,
    ): Array<IHttpFile> {
        if (rawFile === undefined) return [];
        return Array.isArray(rawFile) ? rawFile : [rawFile];
    }

    private resolveFileDefs(
        fileValidation: FileDef,
        collected: Array<IHttpFile>,
    ): Array<StaticFileDef> {
        const isDynamic =
            typeof fileValidation === "function" ||
            isInvokableObject(fileValidation);
        if (!isDynamic) {
            return collected.map(() => fileValidation);
        }
        return collected.map((file) => callInvokable(fileValidation, file));
    }

    private validateSingleFile(
        key: string,
        index: number,
        file: IHttpFile,
        def: StaticFileDef,
    ): void {
        if (
            def.contentType !== undefined &&
            file.contentType !== def.contentType
        ) {
            throw new ValidationError(
                `File field "${key}" at index ${String(index)} expected content type "${def.contentType}" but got "${file.contentType}".`,
            );
        }

        const exceedsFileSize =
            def.fileSize !== undefined &&
            file.fileSize[TO_BYTES]() > def.fileSize[TO_BYTES]();
        if (exceedsFileSize) {
            throw new ValidationError(
                `File field "${key}" at index ${String(index)} exceeds the maximum file size.`,
            );
        }

        const name = def.name;
        if (name === undefined) {
            return;
        }

        if (
            typeof name === "string" &&
            file.name.localeCompare(name, undefined, {
                sensitivity: "base",
            }) !== 0
        ) {
            throw new ValidationError(
                `File field "${key}" at index ${String(index)} expected filename "${name}" but got "${file.name}".`,
            );
        }
        if (typeof name === "string") {
            return;
        }

        if (!name.test(file.name)) {
            throw new ValidationError(
                `File field "${key}" at index ${String(index)} filename "${file.name}" does not match the required pattern.`,
            );
        }
    }

    private validateFileCount(
        key: string,
        count: number,
        firstDef: StaticFileDef | undefined,
    ): void {
        const max = firstDef?.max ?? 1;
        const min = firstDef?.min ?? (firstDef?.optional === true ? 0 : 1);

        if (count < min) {
            throw new ValidationError(
                `File field "${key}" requires at least ${String(min)} file(s), but ${String(count)} were uploaded.`,
            );
        }
        if (count > max) {
            throw new ValidationError(
                `File field "${key}" accepts at most ${String(max)} file(s), but ${String(count)} were uploaded.`,
            );
        }
    }

    files(): Promise<HttpReqFiles<TReqFiles>>;
    files<TField extends keyof TReqFiles>(
        field: TField,
    ): Promise<IHttpFileCollection>;
    async files<TField extends keyof TReqFiles>(
        field?: TField,
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    ): Promise<IHttpFileCollection | HttpReqFiles<TReqFiles>> {
        const files = await this.validateFormFiles();
        if (field === undefined) {
            return files;
        }

        return files[field];
    }

    rawParams(): StringInputs {
        return this.rawParamsData;
    }
    params(): TReqParams;
    params<TField extends keyof TReqParams, TValue extends TReqParams[TField]>(
        field: TField,
    ): UndefinedToNull<TValue>;
    params<TField extends keyof TReqParams, TValue extends TReqParams[TField]>(
        field?: TField,
    ): UndefinedToNull<TValue> | TReqParams {
        const rawParams = this.rawParams();

        let params = rawParams as TReqParams;
        if (this.validation.req?.params) {
            params = validateSync(this.validation.req.params, rawParams);
        }

        if (field === undefined) {
            return params;
        }

        return (params[field] ?? null) as UndefinedToNull<TValue>;
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
    searchParams(): TReqSearchParams;
    searchParams<
        TField extends keyof TReqSearchParams,
        TValue extends TReqSearchParams[TField],
    >(field: TField): UndefinedToNull<TValue>;
    searchParams<
        TField extends keyof TReqSearchParams,
        TValue extends TReqSearchParams[TField],
    >(field?: TField): UndefinedToNull<TValue> | TReqSearchParams {
        const rawSearchParams = this.rawSearchParams();

        let searchParams = rawSearchParams as TReqSearchParams;
        if (this.validation.req?.searchParams) {
            searchParams = validateSync(
                this.validation.req.searchParams,
                rawSearchParams,
            );
        }

        if (field === undefined) {
            return searchParams;
        }

        return (searchParams[field] ?? null) as UndefinedToNull<TValue>;
    }

    rawHeaders(): StringInputs {
        return Object.fromEntries(this.request.headers.entries());
    }
    headers(): TReqHeaders;
    headers<
        TField extends keyof TReqHeaders,
        TValue extends TReqHeaders[TField],
    >(field: TField): UndefinedToNull<TValue>;
    headers<
        TField extends keyof TReqHeaders,
        TValue extends TReqHeaders[TField],
    >(field?: TField): UndefinedToNull<TValue> | TReqHeaders {
        const rawHeaders = this.rawHeaders();

        let headers = rawHeaders as TReqHeaders;
        if (this.validation.req?.headers) {
            headers = validateSync(this.validation.req.headers, rawHeaders);
        }

        if (field === undefined) {
            return headers;
        }

        return (headers[field] ?? null) as UndefinedToNull<TValue>;
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
}
