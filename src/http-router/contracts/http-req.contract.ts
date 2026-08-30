/**
 * @module HttpRouter
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";

import type {
    StringInputs,
    RawFormData,
    FileInputs,
    MultiStringInputs,
    CoercibleStringInputs,
    CoercibleMultiStringInputs,
} from "@/http-router/contracts/_shared.js";
import type { IHttpFileCollection } from "@/http-router/contracts/http-file-collection.contract.js";
import type { StrIntellisense } from "@/utilities/_module.js";

/**
 * Represents the HTTP request method.
 * Provides autocompletion for common verbs while accepting any string.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
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
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type HttpReqFiles<TReqFiles extends FileInputs = FileInputs> = {
    [K in keyof TReqFiles]: IHttpFileCollection;
};

/**
 * Represents an incoming HTTP request with typed access to all data sources.
 *
 * Every data source — JSON body, form fields, uploaded files, path parameters,
 * query parameters, headers, and cookies — can be read in its raw form or
 * validated through a {@link https://standardschema.dev | Standard Schema}
 * by passing the schema as an argument to the corresponding method.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type IHttpReq = AsyncIterable<unknown> & {
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
     * Returns the request cookies.
     *
     * Without a schema, returns the raw cookies as a record mapping cookie
     * names to their string values.
     *
     * With a schema, the raw cookies are validated through the given
     * {@link https://standardschema.dev | Standard Schema} and the validated
     * result is returned.
     */
    cookies(): StringInputs;
    cookies<TCookies extends CoercibleStringInputs>(
        schema: StandardSchemaV1<StringInputs, TCookies>,
    ): TCookies;

    /**
     * Parses the request body as JSON.
     *
     * Without a schema, returns the parsed body as `unknown`. With a schema,
     * the parsed JSON is validated through the given Standard Schema and the
     * validated value is returned.
     */
    json(): Promise<unknown>;
    json<TJSon>(schema: StandardSchemaV1<unknown, TJSon>): Promise<TJSon>;

    /**
     * Returns the path parameters of the request.
     *
     * Without a schema, returns the raw path parameters as a record mapping
     * parameter names to their string values. With a schema, the raw
     * parameters are validated through the given Standard Schema and the
     * validated result is returned.
     */
    params(): StringInputs;
    params<TParams extends CoercibleStringInputs>(
        schema: StandardSchemaV1<StringInputs, TParams>,
    ): TParams;

    /**
     * Returns the query string parameters of the request.
     *
     * Without a schema, returns the raw query parameters as a record mapping
     * parameter names to a single string or an array of strings. With a
     * schema, the raw parameters are validated through the given Standard
     * Schema and the validated result is returned.
     */
    searchParams(): MultiStringInputs;
    searchParams<TSearchParams extends CoercibleMultiStringInputs>(
        schema: StandardSchemaV1<MultiStringInputs, TSearchParams>,
    ): TSearchParams;

    /**
     * Returns the request headers.
     *
     * Without a schema, returns the raw headers as a record mapping header
     * names to their string values. With a schema, the raw headers are
     * validated through the given Standard Schema and the validated result
     * is returned.
     */
    headers(): StringInputs;
    headers<THeaders extends CoercibleStringInputs>(
        schema: StandardSchemaV1<StringInputs, THeaders>,
    ): THeaders;

    /**
     * Returns the form fields of the request body.
     *
     * Without a schema, returns the raw form fields as a record mapping
     * field names to a single string or an array of strings. With a schema,
     * the raw fields are validated through the given Standard Schema and the
     * validated result is returned.
     */
    fields(): Promise<MultiStringInputs>;
    fields<TFields extends CoercibleMultiStringInputs>(
        schema: StandardSchemaV1<MultiStringInputs, TFields>,
    ): Promise<TFields>;

    /**
     * Returns the uploaded files of the request.
     *
     * Without a schema, returns the file collections as a record mapping
     * file field names to their {@link IHttpFileCollection} instances. With
     * a schema, the uploaded files are validated against the given file
     * definitions and typed {@link HttpReqFiles} instances are returned.
     */
    files(): Promise<HttpReqFiles>;
    files<TFiles extends FileInputs>(
        schema: TFiles,
    ): Promise<HttpReqFiles<TFiles>>;

    /**
     * Returns the raw unparsed `FormData` as a plain object, or an empty object if not present.
     * Each field is either a string value or an {@link IHttpFile} instance for file uploads.
     */
    formData(): Promise<RawFormData>;

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
     * The request body as a `ReadableStream`, or `null` if the body is not
     * available (e.g. GET/HEAD requests).
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
