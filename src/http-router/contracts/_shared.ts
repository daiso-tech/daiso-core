/**
 * @module HttpRouter
 */

import type { IFileSize } from "@/file-size/contracts/file-size.contract.js";
import type { IHttpFileCollection } from "@/http-router/contracts/http-file-collection.contract.js";
import type { IHttpFile } from "@/http-router/contracts/http-file.contract.js";
import type { Invocable, OneOrArray } from "@/utilities/_module.js";

/**
 * Raw request input values before parsing and validation.
 * Maps field names to optional unknown-typed values (e.g. from path parameters).
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type ReqInputs = Partial<Record<string, unknown>>;

/**
 * A record mapping string keys to optional string values.
 * Used for raw header, cookie, param, and query string inputs before parsing.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type StringInputs = Partial<Record<string, string>>;

/**
 * A record mapping string keys to optional unknown values.
 * Used as the output type when validating string-based inputs (cookies,
 * params, headers) through a schema that may coerce values.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type CoercibleStringInputs = Partial<Record<string, unknown>>;

/**
 * A record mapping string keys to a single string or an array of strings.
 *
 * Use this for input sources where a field may appear multiple times, such as
 * URL query parameters (e.g. `?tag=a&tag=b`) or form fields with repeated names.
 * Each field resolves to a single `string` when the key appears once, or an
 * `Array<string>` when it appears multiple times.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type MultiStringInputs = Partial<Record<string, OneOrArray<string>>>;

/**
 * A record mapping string keys to optional unknown values.
 * Used as the output type when validating multi-value inputs (query params,
 * form fields) through a schema that may coerce values.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type CoercibleMultiStringInputs = Partial<Record<string, unknown>>;

/**
 * Represents raw form fields input before parsing.
 * Each field is a string value.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type FormInputs = Partial<Record<string, string>>;

/**
 * Static definition for validating an uploaded file's metadata.
 *
 * Use this when the validation rules for a file field are known ahead of time
 * and do not depend on the actual uploaded file. You can constrain the MIME
 * type, file size, filename pattern, and whether the file is required or
 * optional.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type StaticFileDef = {
    /**
     * Expected MIME type of the uploaded file (e.g. `"image/png"`).
     * When set, validation fails if the uploaded file's content type does not match.
     */
    contentType?: string;

    /**
     * Maximum allowed file size. Validation fails if the uploaded file exceeds this limit.
     */
    fileSize?: IFileSize;

    /**
     * A regular expression that the uploaded file's name must match.
     */
    name?: RegExp;

    /**
     * When `true`, the file is optional and validation passes even if no file is uploaded.
     *
     * @default false
     */
    optional?: boolean;

    /**
     * Minimum number of files required for this field.
     * Validation fails if fewer files are uploaded.
     *
     * @default 1 (0 if {@link optional} is `true`)
     */
    min?: number;

    /**
     * Maximum number of files allowed for this field.
     * Validation fails if more files are uploaded.
     *
     * @default 1
     */
    max?: number;
};

/**
 * Dynamic file definition that inspects the uploaded file collection at runtime.
 *
 * Unlike {@link StaticFileDef}, this is an invocable function that receives the
 * uploaded {@link IHttpFileCollection} and returns an error message string when
 * validation fails, or `null` when the files pass. Use this when validation
 * rules must be computed dynamically based on the actual files.
 *
 * @example
 * ```ts
 * const avatarDef: DynamicFileDef = (collection) =>
 *     collection.size() > 1 ? "Only one avatar is allowed" : null;
 * ```
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type DynamicFileDef = Invocable<
    [file: IHttpFileCollection],
    string | null
>;

/**
 * Union of {@link StaticFileDef} and {@link DynamicFileDef}.
 *
 * Represents any file field definition — either a static set of validation
 * rules or a function that performs custom validation and returns an error
 * message (or `null`) for the uploaded files.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type FileDef = StaticFileDef | DynamicFileDef;

/**
 * A partial record mapping file field names to their expected {@link FileDef}.
 * Used to describe the expected file uploads in a request.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type FileInputs = Partial<Record<string, FileDef>>;

/**
 * Represents the raw, unparsed `FormData` content from a request body.
 *
 * Each text form field maps to either a single `string` or an `Array<string>`
 * when the field name appears multiple times. File upload fields map to an
 * {@link IHttpFile} instance.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type RawFormData = Partial<
    Record<string, OneOrArray<string> | OneOrArray<IHttpFile>>
>;
