/**
 * @module HttpRouter
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

import {
    type StringInputs,
    type RawFormData,
    type FileInputs,
    type ReqInputs,
    type MultiStringInputs,
} from "@/http-router/contracts/_shared.js";
import { type IHttpFileCollection } from "@/http-router/contracts/http-file-collection.contract.js";
import {
    type StrIntellisense,
    type UndefinedToNull,
} from "@/utilities/_module.js";

/**
 * Represents the HTTP request method.
 * Provides autocompletion for common verbs while accepting any string.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpMethod = StrIntellisense<
    | "GET"
    | "DELETE"
    | "POST"
    | "PUT"
    | "HEAD"
    | "PATCH"
    | "OPTIONS"
    | "TRACE"
    | "CONNECT"
>;

/**
 * A record mapping validated file field names to their {@link IHttpFileCollection} instances.
 * Produced after file validation, providing typed access to uploaded files.
 *
 * Each field resolves to an {@link IHttpFileCollection} — a uniform wrapper that handles
 * zero, one, or many files with the same API ({@link IHttpFileCollection.get | get},
 * {@link IHttpFileCollection.firstOrFail | firstOrFail}, iteration, etc.).
 *
 * @typeParam TReqFiles - The expected file definitions from validation.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpReqFiles<TReqFiles extends FileInputs> = {
    [K in keyof TReqFiles]: IHttpFileCollection;
};

export type IValidatedHttpReq<
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
> = {
    /**
     * Parses and returns all cookies, validated and transformed by the cookie schema.
     */
    cookies(): TCookieData;

    /**
     * Retrieves a single validated cookie value by name.
     *
     * @typeParam TField - The name of the cookie.
     * @typeParam TValue - The cookie value type.
     * @param field - The name of the cookie.
     * @returns The validated cookie value.
     */
    cookies<
        TField extends keyof TCookieData,
        TValue extends TCookieData[TField],
    >(
        field: TField,
    ): UndefinedToNull<TValue>;

    /**
     * Parses and returns the JSON body.
     */
    json(): Promise<TReqJson>;

    /**
     * Parses and returns all form fields from `Request.formData`.
     */
    fields(): Promise<TReqFields>;

    /**
     * Retrieves a single form field by name from `Request.formData`.
     * @typeParam TField - The name of the form field.
     * @typeParam TValue - The form field value type.
     * @param field - The name of the form field.
     */
    fields<TField extends keyof TReqFields, TValue extends TReqFields[TField]>(
        field: TField,
    ): Promise<TValue>;

    /**
     * Returns all validated uploaded files keyed by field name from `Request.formData`.
     * Each field resolves to an {@link IHttpFileCollection}.
     */
    files(): Promise<HttpReqFiles<TReqFiles>>;

    /**
     * Retrieves the validated uploaded file collection by field name from `Request.formData`.
     * @typeParam TField - The name of the file field.
     * @param field - The name of the file field.
     */
    files<TField extends keyof TReqFiles>(
        field: TField,
    ): Promise<IHttpFileCollection>;

    /**
     * Parses and returns all path parameters.
     */
    params(): TReqParams;

    /**
     * Retrieves a single path parameter by name.
     * @typeParam TField - The name of the path parameter.
     * @typeParam TValue - The path parameter value type.
     * @param field - The name of the path parameter.
     */
    params<TField extends keyof TReqParams, TValue extends TReqParams[TField]>(
        field: TField,
    ): UndefinedToNull<TValue>;

    /**
     * Parses and returns all query string parameters.
     */
    searchParams(): TReqSearchParams;

    /**
     * Retrieves a single query string parameter by name.
     * @typeParam TField - The name of the query parameter.
     * @typeParam TValue - The query parameter value type.
     * @param field - The name of the query parameter.
     */
    searchParams<
        TField extends keyof TReqSearchParams,
        TValue extends TReqSearchParams[TField],
    >(
        field: TField,
    ): UndefinedToNull<TValue>;

    /**
     * Parses and returns all request headers.
     */
    headers(): TReqHeaders;

    /**
     * Retrieves a single header value by name.
     * @typeParam TField - The name of the header.
     * @typeParam TValue - The header value type.
     * @param field - The name of the header.
     */
    headers<
        TField extends keyof TReqHeaders,
        TValue extends TReqHeaders[TField],
    >(
        field: TField,
    ): UndefinedToNull<TValue>;
};

/**
 * Defines optional validation schemas for each source of request data.
 * Each field uses Standard Schema V1 to validate and transform the input.
 * Cookies are not validated here but handled separately via {@link ICookieStore}.
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
 * @typeParam TReqFiles - The expected file definitions.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpReqSchemas<
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
> = {
    /**
     * Optional schema for validating the JSON body.
     */
    json?: StandardSchemaV1<TReqJson>;

    /**
     * Optional schema for validating form fields or url encoded fields.
     * Receives {@link MultiStringInputs} (string or string[]) since form fields
     * may appear multiple times.
     */
    fields?: StandardSchemaV1<MultiStringInputs, TReqFields>;

    /**
     * Optional expected file definitions for validation.
     */
    files?: TReqFiles;

    /**
     * Optional schema for validating path parameters.
     */
    params?: StandardSchemaV1<StringInputs, TReqParams>;

    /**
     * Optional schema for validating query string parameters.
     */
    searchParams?: StandardSchemaV1<MultiStringInputs, TReqSearchParams>;

    /**
     * Optional schema for validating request headers.
     */
    headers?: StandardSchemaV1<StringInputs, TReqHeaders>;

    cookies?: StandardSchemaV1<StringInputs, TCookieData>;
};

export type IHttpReqValidation = {
    withSchema<
        TReqJson = unknown,
        TReqFields extends ReqInputs = ReqInputs,
        TReqParams extends ReqInputs = ReqInputs,
        TReqSearchParams extends ReqInputs = ReqInputs,
        TReqHeaders extends ReqInputs = ReqInputs,
        TReqFiles extends FileInputs = FileInputs,
        TCookieData extends StringInputs = StringInputs,
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
    >;
};

export type IHttpReqBase = AsyncIterable<unknown> & {
    /**
     * An {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal}
     * that is aborted when the underlying request is cancelled or times out.
     *
     * Handlers can listen to this signal to stop long-running work early when
     * the client disconnects or the request reaches its deadline.
     */
    readonly signal: AbortSignal;

    /**
     * Returns the HTTP method of the request (e.g. GET, POST).
     */
    readonly method: HttpMethod;

    /**
     * Returns the full request URL as a string.
     */
    readonly url: string;

    /**
     * Returns the raw, parsed cookies as a string-to-string map.
     */
    rawCookies(): StringInputs;

    /**
     * Returns the raw unparsed JSON body.
     */
    rawJson(): Promise<unknown>;

    /**
     * Returns the raw unparsed `FormData` as a plain object, or an empty object if not present.
     * Each field is either a string value or an {@link IHttpFile} instance for file uploads.
     */
    rawFormData(): Promise<RawFormData>;

    /**
     * Returns the raw unparsed path parameters, or empty object if not present.
     */
    rawParams(): StringInputs;

    /**
     * Returns the raw unparsed query parameters, or empty object if not present.
     */
    rawSearchParams(): MultiStringInputs;

    /**
     * Returns the raw unparsed headers, or empty object if not present.
     */
    rawHeaders(): StringInputs;

    /**
     * Reads the request body as plain text.
     */
    text(): Promise<string>;

    /**
     * Reads the request body as a Uint8Array.
     */
    bytes(): Promise<Uint8Array>;

    /**
     * Reads the request body as an ArrayBuffer.
     */
    arrayBuffer(): Promise<ArrayBuffer>;

    /**
     * The request body as a `ReadableStream`, or `null` if the body has
     * already is not available (e.g. GET/HEAD requests).
     *
     * Allows streaming the body in chunks via the
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Streams API}.
     */
    readonly readableStream: ReadableStream<unknown> | null;

    /**
     * Reads the request body as a Blob.
     */
    blob(): Promise<Blob>;

    /**
     * The underlying standard Web API `Request` object.
     *
     * Useful for interoperability with third-party libraries that expect
     * a native `Request`, such as [better-auth](https://better-auth.com/).
     */
    readonly webReq: Request;
};

/**
 * Represents an incoming HTTP request with typed access to all data sources.
 *
 * Provides methods to access parsed and raw values for the body, form fields,
 * path parameters, query parameters, and headers.
 * Cookies are handled separately via {@link ICookieStore}.
 *
 * Each generic type parameter corresponds to a single source of request data,
 * allowing granular type inference without needing a wrapper type.
 *
 * @typeParam TReqJson - The type of the parsed JSON body.
 * @typeParam TReqFields - The type of the parsed form fields.
 * @typeParam TReqParams - The type of the parsed path parameters.
 * @typeParam TReqSearchParams - The type of the parsed query parameters.
 * @typeParam TReqHeaders - The type of the parsed headers.
 * @typeParam TReqFiles - The expected file upload definitions.
 * @typeParam TCookieData - A record mapping cookie names to their value types.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type IHttpReq = IHttpReqValidation & IHttpReqBase;
