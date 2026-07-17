/**
 * @module HttpRouter
 */

import { TO_BYTES } from "@/file-size/contracts/_module.js";
import {
    type ReqInputs,
    type FileInputs,
    type StringInputs,
    type IValidatedHttpReq,
    type HttpReqFiles,
    type IHttpFileCollection,
    type StaticFileDef,
    type IHttpFile,
    type HttpReqSchemas,
    type IHttpReqBase,
    type MultiStringInputs,
    type FileDef,
} from "@/http-router/contracts/_module.js";
import { HttpFileCollection } from "@/http-router/implementations/http-file-collection.js";
import {
    callInvokable,
    isInvokableObject,
    validate,
    validateSync,
    ValidationError,
    type UndefinedToNull,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export class ValidatedHttpReq<
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
> implements IValidatedHttpReq<
    TReqJson,
    TReqFields,
    TReqParams,
    TReqSearchParams,
    TReqHeaders,
    TReqFiles,
    TCookieData
> {
    constructor(
        private readonly req: IHttpReqBase,
        private readonly schemas: HttpReqSchemas<
            TReqJson,
            TReqFields,
            TReqParams,
            TReqSearchParams,
            TReqHeaders,
            TReqFiles,
            TCookieData
        >,
    ) {}

    async json(): Promise<TReqJson> {
        const data = await this.req.rawJson();
        if (this.schemas.json) {
            return await validate(this.schemas.json, data);
        }
        return data as TReqJson;
    }

    fields(): Promise<TReqFields>;
    fields<TField extends keyof TReqFields, TValue extends TReqFields[TField]>(
        field: TField,
    ): Promise<UndefinedToNull<TValue>>;
    async fields<
        TField extends keyof TReqFields,
        TValue extends TReqFields[TField],
    >(field?: TField): Promise<TValue | TReqFields> {
        const formData = await this.req.rawFormData();

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
        if (this.schemas.fields) {
            fields = await validate(this.schemas.fields, rawFormFields);
        }

        if (field === undefined) {
            return fields;
        }

        const selectedFormFieldValue = (fields[field] ?? null) as TValue;
        return selectedFormFieldValue;
    }

    private async validateFormFiles(): Promise<HttpReqFiles<TReqFiles>> {
        const formData = await this.req.rawFormData();

        const rawFormFiles = Object.fromEntries(
            Object.entries(formData).filter(([_key, value]) => {
                return typeof value !== "string";
            }),
        ) as Partial<Record<string, IHttpFile | Array<IHttpFile>>>;

        const filesValidation = (this.schemas.files ?? {}) as TReqFiles;
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

    params(): TReqParams;
    params<TField extends keyof TReqParams, TValue extends TReqParams[TField]>(
        field: TField,
    ): UndefinedToNull<TValue>;
    params<TField extends keyof TReqParams, TValue extends TReqParams[TField]>(
        field?: TField,
    ): UndefinedToNull<TValue> | TReqParams {
        const rawParams = this.req.rawParams();

        let params = rawParams as TReqParams;
        if (this.schemas.params) {
            params = validateSync(this.schemas.params, rawParams);
        }

        if (field === undefined) {
            return params;
        }

        return (params[field] ?? null) as UndefinedToNull<TValue>;
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
        const rawSearchParams = this.req.rawSearchParams();

        let searchParams = rawSearchParams as TReqSearchParams;
        if (this.schemas.searchParams) {
            searchParams = validateSync(
                this.schemas.searchParams,
                rawSearchParams,
            );
        }

        if (field === undefined) {
            return searchParams;
        }

        return (searchParams[field] ?? null) as UndefinedToNull<TValue>;
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
        const rawHeaders = this.req.rawHeaders();

        let headers = rawHeaders as TReqHeaders;
        if (this.schemas.headers) {
            headers = validateSync(this.schemas.headers, rawHeaders);
        }

        if (field === undefined) {
            return headers;
        }

        return (headers[field] ?? null) as UndefinedToNull<TValue>;
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
        const rawCookies = this.req.rawCookies();

        let cookies = rawCookies as TCookieData;
        if (this.schemas.cookies) {
            cookies = validateSync(this.schemas.cookies, rawCookies);
        }

        if (field === undefined) {
            return cookies;
        }

        return (cookies[field] ?? null) as UndefinedToNull<TValue>;
    }
}
