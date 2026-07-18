/**
 * @module HttpRouter
 */

/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/require-await */
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { type IHttpReqBase } from "@/http-router/contracts/_module.js";
import { ValidatedHttpReq } from "@/http-router/implementations/validated-http-req.js";
import { ValidationError } from "@/utilities/_module.js";

describe("class: ValidatedHttpReq", () => {
    function createMockReq(
        overrides: Partial<{
            rawJson: unknown;
            rawParams: Record<string, string>;
            rawSearchParams: Record<string, string | Array<string>>;
            rawHeaders: Record<string, string>;
            rawCookies: Record<string, string>;
            rawFormData: Record<string, string | Array<string>>;
        }> = {},
    ): IHttpReqBase {
        return {
            signal: new AbortController().signal,
            method: "GET",
            url: "https://test.local/test",
            webReq: new Request("https://test.local/test"),
            readableStream: null,
            rawJson: vi.fn().mockResolvedValue(overrides.rawJson ?? {}),
            rawParams: vi.fn(() => overrides.rawParams ?? {}),
            rawSearchParams: vi.fn(() => overrides.rawSearchParams ?? {}),
            rawHeaders: vi.fn(() => overrides.rawHeaders ?? {}),
            rawCookies: vi.fn(() => overrides.rawCookies ?? {}),
            rawFormData: vi.fn().mockResolvedValue(overrides.rawFormData ?? {}),
            text: vi.fn().mockResolvedValue(""),
            bytes: vi.fn().mockResolvedValue(new Uint8Array()),
            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
            blob: vi.fn().mockResolvedValue(new Blob()),
            [Symbol.asyncIterator]: vi.fn(() => {
                return {
                    next() {
                        return Promise.resolve({
                            done: true as const,
                            value: undefined,
                        });
                    },
                };
            }),
        };
    }

    describe("method: json", () => {
        test("Should return the raw JSON body when no schema is provided", async () => {
            const req = createMockReq({ rawJson: { key: "value" } });
            const validated = new ValidatedHttpReq(req, {});

            const json = await validated.json();

            expect(req.rawJson).toHaveBeenCalledTimes(1);
            expect(json).toEqual({ key: "value" });
        });

        test("Should validate and return the JSON body when a schema is provided", async () => {
            const req = createMockReq({ rawJson: { name: "John", age: 30 } });
            const schema = z.object({ name: z.string(), age: z.number() });
            const validated = new ValidatedHttpReq(req, { json: schema });

            const json = await validated.json();

            expect(json).toEqual({ name: "John", age: 30 });
        });

        test("Should throw when JSON body does not match schema", async () => {
            const req = createMockReq({ rawJson: { name: 123 } });
            const schema = z.object({ name: z.string() });
            const validated = new ValidatedHttpReq(req, { json: schema });

            await expect(validated.json()).rejects.toThrow();
        });
    });

    describe("method: params", () => {
        test("Should call rawParams on the base request", () => {
            const req = createMockReq({
                rawParams: { id: "42", slug: "hello" },
            });
            const validated = new ValidatedHttpReq(req, {});

            const result = validated.params();

            expect(req.rawParams).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ id: "42", slug: "hello" });
        });

        test("Should validate all params when a schema is provided", () => {
            const req = createMockReq({ rawParams: { id: "42" } });
            const schema = z.object({ id: z.string() });
            const validated = new ValidatedHttpReq(req, { params: schema });

            expect(validated.params()).toEqual({ id: "42" });
        });

        test("Should return a single param by field name", () => {
            const req = createMockReq({
                rawParams: { id: "42", slug: "hello" },
            });
            const validated = new ValidatedHttpReq(req, {});

            expect(validated.params("id")).toBe("42");
        });

        test("Should return null for a missing param field", () => {
            const req = createMockReq({ rawParams: { id: "42" } });
            const validated = new ValidatedHttpReq(req, {});

            expect(validated.params("nonexistent")).toBeNull();
        });

        test("Should throw ValidationError when params do not match schema", () => {
            const req = createMockReq({ rawParams: { id: "not-an-email" } });
            const schema = z.object({ id: z.string().email() });
            const validated = new ValidatedHttpReq(req, { params: schema });

            expect(() => validated.params()).toThrow(ValidationError);
        });

        test("Should return an empty object when no params are provided", () => {
            const req = createMockReq();
            const validated = new ValidatedHttpReq(req, {});

            expect(validated.params()).toEqual({});
        });
    });

    describe("method: searchParams", () => {
        test("Should call rawSearchParams on the base request", () => {
            const req = createMockReq({
                rawSearchParams: { q: "hello", page: "1" },
            });
            const validated = new ValidatedHttpReq(req, {});

            const result = validated.searchParams();

            expect(req.rawSearchParams).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ q: "hello", page: "1" });
        });

        test("Should validate search params when a schema is provided", () => {
            const req = createMockReq({
                rawSearchParams: { page: "1", limit: "10" },
            });
            const schema = z.object({
                page: z.string(),
                limit: z.string(),
            });
            const validated = new ValidatedHttpReq(req, {
                searchParams: schema,
            });

            expect(validated.searchParams()).toEqual({
                page: "1",
                limit: "10",
            });
        });

        test("Should return a single search param by field name", () => {
            const req = createMockReq({
                rawSearchParams: { q: "hello", page: "1" },
            });
            const validated = new ValidatedHttpReq(req, {});

            expect(validated.searchParams("q")).toBe("hello");
        });

        test("Should return null for a missing search param field", () => {
            const req = createMockReq({ rawSearchParams: { q: "hello" } });
            const validated = new ValidatedHttpReq(req, {});

            expect(validated.searchParams("missing")).toBeNull();
        });
    });

    describe("method: headers", () => {
        test("Should call rawHeaders on the base request", () => {
            const req = createMockReq({ rawHeaders: { "x-custom": "value" } });
            const validated = new ValidatedHttpReq(req, {});

            const headers = validated.headers();

            expect(req.rawHeaders).toHaveBeenCalledTimes(1);
            expect(headers["x-custom"]).toBe("value");
        });

        test("Should validate headers when a schema is provided", () => {
            const req = createMockReq({
                rawHeaders: { authorization: "Bearer token123" },
            });
            const schema = z.object({ authorization: z.string() });
            const validated = new ValidatedHttpReq(req, { headers: schema });

            expect(validated.headers().authorization).toBe("Bearer token123");
        });

        test("Should return null for a missing header", () => {
            const req = createMockReq({ rawHeaders: {} });
            const validated = new ValidatedHttpReq(req, {});

            expect(validated.headers("missing")).toBeNull();
        });
    });

    describe("method: cookies", () => {
        test("Should call rawCookies on the base request", () => {
            const req = createMockReq({
                rawCookies: { session: "abc", theme: "dark" },
            });
            const validated = new ValidatedHttpReq(req, {});

            const cookies = validated.cookies();

            expect(req.rawCookies).toHaveBeenCalledTimes(1);
            expect(cookies).toEqual({ session: "abc", theme: "dark" });
        });

        test("Should validate cookies when a schema is provided", () => {
            const req = createMockReq({ rawCookies: { session: "abc123" } });
            const schema = z.object({ session: z.string() });
            const validated = new ValidatedHttpReq(req, { cookies: schema });

            expect(validated.cookies().session).toBe("abc123");
        });

        test("Should return null for a missing cookie", () => {
            const req = createMockReq({ rawCookies: {} });
            const validated = new ValidatedHttpReq(req, {});

            expect(validated.cookies("missing")).toBeNull();
        });
    });

    describe("method: fields", () => {
        test("Should call rawFormData and extract string fields", async () => {
            const req = createMockReq({
                rawFormData: { name: "John", email: "john@test.com" },
            });
            const validated = new ValidatedHttpReq(req, {});

            const fields = await validated.fields();

            expect(req.rawFormData).toHaveBeenCalledTimes(1);
            expect(fields).toEqual({ name: "John", email: "john@test.com" });
        });

        test("Should return null for a missing form field", async () => {
            const req = createMockReq({ rawFormData: {} });
            const validated = new ValidatedHttpReq(req, {});

            expect(await validated.fields("missing")).toBeNull();
        });

        test("Should validate form fields when a schema is provided", async () => {
            const req = createMockReq({ rawFormData: { name: "John" } });
            const schema = z.object({ name: z.string() });
            const validated = new ValidatedHttpReq(req, { fields: schema });

            const fields = await validated.fields();
            expect(fields).toEqual({ name: "John" });
        });
    });

    describe("method: files", () => {
        test("Should return an empty record when no files schema is provided", async () => {
            const req = createMockReq({ rawFormData: {} });
            const validated = new ValidatedHttpReq(req, {});

            const files = await validated.files();

            expect(req.rawFormData).toHaveBeenCalledTimes(1);
            expect(files).toEqual({});
        });

        test("Should throw ValidationError when required files are missing", async () => {
            const req = createMockReq({ rawFormData: {} });
            const validated = new ValidatedHttpReq(req, {
                files: { avatar: {} },
            });

            await expect(validated.files()).rejects.toThrow(ValidationError);
        });
    });

    describe("edge cases", () => {
        test("Should handle all schemas being provided simultaneously", async () => {
            const req = createMockReq({
                rawJson: { key: "val" },
                rawParams: { id: "42" },
                rawSearchParams: { page: "1" },
                rawHeaders: { authorization: "Bearer token" },
                rawCookies: { session: "abc" },
            });
            const validated = new ValidatedHttpReq(req, {
                json: z.object({ key: z.string() }),
                params: z.object({ id: z.string() }),
                searchParams: z.object({ page: z.string() }),
                headers: z.object({ authorization: z.string() }),
                cookies: z.object({ session: z.string() }),
            });

            const json = await validated.json();
            expect(json).toEqual({ key: "val" });
            expect(validated.params("id")).toBe("42");
            expect(validated.searchParams("page")).toBe("1");
            expect(validated.headers("authorization")).toBe("Bearer token");
            expect(validated.cookies("session")).toBe("abc");
        });
    });
});
