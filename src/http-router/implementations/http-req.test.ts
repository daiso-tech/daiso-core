/**
 * @module HttpRouter
 */

import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { FileSize } from "@/file-size/implementations/_module.js";
import { HttpError } from "@/http-router/contracts/_module.js";
import { HttpReq } from "@/http-router/implementations/http-req.js";

describe("class: HttpReq", () => {
    describe("static method: fromWebReq", () => {
        test("Should create an HttpReq from a Web Request", () => {
            const request = new Request("https://example.com/api/test", {
                method: "POST",
            });
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.method).toBe("POST");
            expect(httpReq.url).toBe("https://example.com/api/test");
        });
        test("Should include raw params when provided", () => {
            const request = new Request("https://example.com/users/42");
            const httpReq = HttpReq.fromWebReq({
                request,
                _rawParams: { id: "42" },
            });
            expect(httpReq.params()).toEqual({ id: "42" });
        });
        test("Should return empty params when _rawParams is not provided", () => {
            const request = new Request("https://example.com/test");
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.params()).toEqual({});
        });
    });
    describe("static method: test", () => {
        test("Should create an HttpReq with the provided URL", () => {
            const httpReq = HttpReq.test({
                method: "GET",
                url: "/api/users",
            });
            expect(httpReq.url).toContain("/api/users");
        });
        test("Should use the default hostname when not provided", () => {
            const httpReq = HttpReq.test({
                method: "GET",
                url: "/api/users",
            });
            expect(httpReq.url).toContain("https://test.local/api/users");
        });
        test("Should use the provided hostname", () => {
            const httpReq = HttpReq.test({
                method: "GET",
                hostname: "https://custom.test",
                url: "/api/data",
            });
            expect(httpReq.url).toContain("https://custom.test/api/data");
        });
        test("Should include path params", () => {
            const httpReq = HttpReq.test({
                method: "GET",
                url: "/users/:id",
                params: { id: "42" },
            });
            expect(httpReq.params()).toEqual({ id: "42" });
        });
        test("Should include search params as single values", () => {
            const httpReq = HttpReq.test({
                method: "GET",
                url: "/search",
                searchParams: { q: "hello" },
            });
            expect(httpReq.searchParams()).toEqual({ q: "hello" });
        });
        test("Should include search params as array values", () => {
            const httpReq = HttpReq.test({
                method: "GET",
                url: "/search",
                searchParams: { tags: ["a", "b"] },
            });
            const sp = httpReq.searchParams();
            expect(sp["tags"]).toEqual(["a", "b"]);
        });
        test("Should include headers", () => {
            const httpReq = HttpReq.test({
                method: "GET",
                url: "/test",
                headers: { "x-custom": "myvalue" },
            });
            expect(httpReq.headers()["x-custom"]).toBe("myvalue");
        });
        test("Should include cookies", () => {
            const httpReq = HttpReq.test({
                method: "GET",
                url: "/test",
                cookies: { session: "abc123" },
            });
            expect(httpReq.cookies()).toEqual({ session: "abc123" });
        });
        test("Should handle JSON body", async () => {
            const httpReq = HttpReq.test({
                method: "POST",
                url: "/api/data",
                body: {
                    type: "application/json",
                    data: { key: "value" },
                },
            });
            const json = await httpReq.json();
            expect(json).toEqual({ key: "value" });
        });
        test("Should handle URL-encoded body", async () => {
            const httpReq = HttpReq.test({
                method: "POST",
                url: "/form",
                body: {
                    type: "application/x-www-form-urlencoded",
                    data: { field1: "val1", field2: "val2" },
                },
            });
            const formData = await httpReq.formData();
            expect(formData["field1"]).toBe("val1");
            expect(formData["field2"]).toBe("val2");
        });
        test("Should handle multipart form data body with fields", () => {
            const httpReq = HttpReq.test({
                method: "POST",
                url: "/upload",
                body: {
                    type: "multipart/form-data",
                    data: {
                        fields: { description: "my file" },
                    },
                },
            });
            expect(httpReq.webReq).toBeInstanceOf(Request);
        });
        test("Should handle multipart form data body with files", () => {
            const buffer = new TextEncoder().encode("file content").buffer;
            const httpReq = HttpReq.test({
                method: "POST",
                url: "/upload",
                body: {
                    type: "multipart/form-data",
                    data: {
                        files: { avatar: buffer },
                    },
                },
            });
            expect(httpReq.webReq).toBeInstanceOf(Request);
        });
        test("Should handle multipart form data body with multiple files", () => {
            const buf1 = new TextEncoder().encode("file1").buffer;
            const buf2 = new TextEncoder().encode("file2").buffer;
            const httpReq = HttpReq.test({
                method: "POST",
                url: "/upload",
                body: {
                    type: "multipart/form-data",
                    data: {
                        files: { docs: [buf1, buf2] },
                    },
                },
            });
            expect(httpReq.webReq).toBeInstanceOf(Request);
        });
        test("Should handle custom body", () => {
            const httpReq = HttpReq.test({
                method: "POST",
                url: "/custom",
                body: {
                    type: "custom",
                    data: "raw data",
                },
            });
            expect(httpReq.webReq).toBeInstanceOf(Request);
        });
        test("Should use POST method when a body is provided", () => {
            const httpReq = HttpReq.test({
                method: "POST",
                url: "/test",
                body: {
                    type: "application/json",
                    data: {},
                },
            });
            expect(httpReq.method).toBe("POST");
        });
    });
    describe("property: method", () => {
        test("Should return the HTTP method", () => {
            const request = new Request("https://example.com/test", {
                method: "DELETE",
            });
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.method).toBe("DELETE");
        });
    });
    describe("property: url", () => {
        test("Should return the full request URL", () => {
            const request = new Request("https://example.com/path?query=1");
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.url).toBe("https://example.com/path?query=1");
        });
    });
    describe("property: signal", () => {
        test("Should return the request's AbortSignal", () => {
            const controller = new AbortController();
            const request = new Request("https://example.com/test", {
                signal: controller.signal,
            });
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.signal).toBeInstanceOf(AbortSignal);
            expect(httpReq.signal.aborted).toBe(false);
        });
    });
    describe("property: webReq", () => {
        test("Should return the underlying Request object", () => {
            const request = new Request("https://example.com/test");
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.webReq).toBe(request);
        });
    });
    describe("property: readableStream", () => {
        test("Should return null for GET requests with no body", () => {
            const request = new Request("https://example.com/test");
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.readableStream).toBeNull();
        });
        test("Should return a ReadableStream for requests with a body", () => {
            const request = new Request("https://example.com/test", {
                method: "POST",
                body: "data",
            });
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.readableStream).toBeInstanceOf(ReadableStream);
        });
    });
    describe("method: json", () => {
        test("Should delegate to request.json()", async () => {
            const request = new Request("https://example.com/api", {
                method: "POST",
                body: JSON.stringify({ a: 1 }),
            });
            const jsonSpy = vi.spyOn(request, "json");
            const httpReq = HttpReq.fromWebReq({ request });

            const json = await httpReq.json();

            expect(jsonSpy).toHaveBeenCalledTimes(1);
            expect(json).toEqual({ a: 1 });
        });
        test("Should validate the JSON body against a schema", async () => {
            const request = new Request("https://example.com/api", {
                method: "POST",
                body: JSON.stringify({ key: "value" }),
            });
            const httpReq = HttpReq.fromWebReq({ request });
            const json = await httpReq.json(z.object({ key: z.string() }));
            expect(json).toEqual({ key: "value" });
        });
        test("Should throw when validation fails", async () => {
            const request = new Request("https://example.com/api", {
                method: "POST",
                body: JSON.stringify({ key: "value" }),
            });
            const httpReq = HttpReq.fromWebReq({ request });
            const result = httpReq.json(z.object({ key: z.string().min(10) }));
            await expect(result).rejects.toThrow(HttpError);
            await expect(result).rejects.toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });
    });
    describe("method: formData", () => {
        test("Should return string fields from URL-encoded form data", async () => {
            const formData = new URLSearchParams({ name: "John" });
            const request = new Request("https://example.com/form", {
                method: "POST",
                body: String(formData),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
            const httpReq = HttpReq.fromWebReq({ request });
            const data = await httpReq.formData();
            expect(data["name"]).toBe("John");
        });
        test("Should return an empty object when there is no form data", async () => {
            const request = new Request("https://example.com/form", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
            const httpReq = HttpReq.fromWebReq({ request });
            const data = await httpReq.formData();
            expect(Object.keys(data)).toHaveLength(0);
        });
    });
    describe("method: fields", () => {
        test("Should validate form fields against a schema", async () => {
            const formData = new URLSearchParams({ name: "John" });
            const request = new Request("https://example.com/form", {
                method: "POST",
                body: String(formData),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
            const httpReq = HttpReq.fromWebReq({ request });
            const fields = await httpReq.fields(z.object({ name: z.string() }));
            expect(fields).toEqual({ name: "John" });
        });
        test("Should throw when validation fails", async () => {
            const formData = new URLSearchParams({ name: "John" });
            const request = new Request("https://example.com/form", {
                method: "POST",
                body: String(formData),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
            const httpReq = HttpReq.fromWebReq({ request });
            await expect(
                httpReq.fields(z.object({ name: z.string().min(10) })),
            ).rejects.toThrow(HttpError);
            await expect(
                httpReq.fields(z.object({ name: z.string().min(10) })),
            ).rejects.toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });
    });
    describe("method: files", () => {
        function createFile(
            name = "avatar.png",
            type = "image/png",
            content = "file content",
        ): File {
            return new File([new TextEncoder().encode(content)], name, {
                type,
            });
        }

        function createRequest(
            files: Record<string, File | Array<File>> = {},
        ): Request {
            const formData = new FormData();
            for (const [field, file] of Object.entries(files)) {
                if (Array.isArray(file)) {
                    for (const item of file) {
                        formData.append(field, item);
                    }
                } else {
                    formData.set(field, file);
                }
            }
            return new Request("https://example.com/upload", {
                method: "POST",
                body: formData,
            });
        }
        test("Should pass when the file content type matches", async () => {
            const httpReq = HttpReq.fromWebReq({
                request: createRequest({ avatar: createFile() }),
            });
            const files = await httpReq.files({
                avatar: { contentType: "image/png" },
            });
            expect(files["avatar"].size()).toBe(1);
        });
        test("Should throw when the file content type does not match", async () => {
            const httpReq = HttpReq.fromWebReq({
                request: createRequest({ avatar: createFile() }),
            });
            await expect(
                httpReq.files({
                    avatar: { contentType: "application/pdf" },
                }),
            ).rejects.toThrow(HttpError);
            await expect(
                httpReq.files({
                    avatar: { contentType: "application/pdf" },
                }),
            ).rejects.toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });
        test("Should pass when the file size is within the limit", async () => {
            const httpReq = HttpReq.fromWebReq({
                request: createRequest({ avatar: createFile() }),
            });
            const files = await httpReq.files({
                avatar: { fileSize: FileSize.fromBytes(100) },
            });
            expect(files["avatar"].size()).toBe(1);
        });
        test("Should throw when the file size exceeds the limit", async () => {
            const httpReq = HttpReq.fromWebReq({
                request: createRequest({ avatar: createFile() }),
            });
            await expect(
                httpReq.files({
                    avatar: { fileSize: FileSize.fromBytes(1) },
                }),
            ).rejects.toThrow(HttpError);
            await expect(
                httpReq.files({
                    avatar: { fileSize: FileSize.fromBytes(1) },
                }),
            ).rejects.toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });
        test("Should pass when the file name matches the pattern", async () => {
            const httpReq = HttpReq.fromWebReq({
                request: createRequest({ avatar: createFile("photo.png") }),
            });
            const files = await httpReq.files({ avatar: { name: /\.png$/ } });
            expect(files["avatar"].size()).toBe(1);
        });
        test("Should throw when the file name does not match the pattern", async () => {
            const httpReq = HttpReq.fromWebReq({
                request: createRequest({ avatar: createFile("photo.png") }),
            });
            await expect(
                httpReq.files({ avatar: { name: /\.jpg$/ } }),
            ).rejects.toThrow(HttpError);
            await expect(
                httpReq.files({ avatar: { name: /\.jpg$/ } }),
            ).rejects.toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });
        test("Should pass when the minimum number of files is met", async () => {
            const httpReq = HttpReq.fromWebReq({
                request: createRequest({
                    avatar: [createFile("a.png"), createFile("b.png")],
                }),
            });
            const files = await httpReq.files({ avatar: { min: 2 } });
            expect(files["avatar"].size()).toBe(2);
        });
        test("Should throw when fewer files than the minimum are uploaded", async () => {
            const httpReq = HttpReq.fromWebReq({
                request: createRequest({ avatar: createFile() }),
            });
            await expect(httpReq.files({ avatar: { min: 2 } })).rejects.toThrow(
                HttpError,
            );
            await expect(httpReq.files({ avatar: { min: 2 } })).rejects.toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });
        test("Should pass when the maximum number of files is not exceeded", async () => {
            const httpReq = HttpReq.fromWebReq({
                request: createRequest({ avatar: createFile() }),
            });
            const files = await httpReq.files({ avatar: { max: 1 } });
            expect(files["avatar"].size()).toBe(1);
        });
        test("Should throw when more files than the maximum are uploaded", async () => {
            const httpReq = HttpReq.fromWebReq({
                request: createRequest({
                    avatar: [createFile("a.png"), createFile("b.png")],
                }),
            });
            await expect(httpReq.files({ avatar: { max: 1 } })).rejects.toThrow(
                HttpError,
            );
            await expect(httpReq.files({ avatar: { max: 1 } })).rejects.toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });
        test("Should allow an optional file field to be absent", async () => {
            const formData = new FormData();
            formData.set("description", "no files");
            const request = new Request("https://example.com/upload", {
                method: "POST",
                body: formData,
            });
            const httpReq = HttpReq.fromWebReq({ request });
            const files = await httpReq.files({ avatar: { optional: true } });
            expect(files["avatar"]).toBeUndefined();
        });
        test("Should pass when a required file is present", async () => {
            const httpReq = HttpReq.fromWebReq({
                request: createRequest({ avatar: createFile() }),
            });
            const files = await httpReq.files({ avatar: { optional: false } });
            expect(files["avatar"].size()).toBe(1);
        });
        test("Should pass when a dynamic definition returns null", async () => {
            const httpReq = HttpReq.fromWebReq({
                request: createRequest({ avatar: createFile() }),
            });
            const files = await httpReq.files({
                avatar: () => null,
            });
            expect(files["avatar"].size()).toBe(1);
        });
        test("Should throw when a dynamic definition returns a message", async () => {
            const httpReq = HttpReq.fromWebReq({
                request: createRequest({ avatar: createFile() }),
            });
            await expect(
                httpReq.files({ avatar: () => "Invalid file" }),
            ).rejects.toThrow(HttpError);
            await expect(
                httpReq.files({ avatar: () => "Invalid file" }),
            ).rejects.toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });
        test("Should validate multiple fields with static and dynamic definitions", async () => {
            const httpReq = HttpReq.fromWebReq({
                request: createRequest({
                    avatar: createFile("avatar.png"),
                    docs: createFile("doc.pdf", "application/pdf"),
                }),
            });
            const files = await httpReq.files({
                avatar: { name: /\.png$/ },
                docs: (collection) =>
                    collection.size() === 1 ? null : "Expected one file",
            });
            expect(files["avatar"].size()).toBe(1);
            expect(files["docs"].size()).toBe(1);
        });
        test("Should pass through a field with an undefined definition", async () => {
            const httpReq = HttpReq.fromWebReq({
                request: createRequest({ avatar: createFile() }),
            });
            const files = await httpReq.files({ avatar: undefined });
            expect(files["avatar"].size()).toBe(1);
        });
    });
    describe("method: params", () => {
        test("Should return the raw path parameters", () => {
            const request = new Request("https://example.com/users/42");
            const httpReq = HttpReq.fromWebReq({
                request,
                _rawParams: { id: "42" },
            });
            expect(httpReq.params()).toEqual({ id: "42" });
        });
        test("Should return an empty object when no params were provided", () => {
            const request = new Request("https://example.com/test");
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.params()).toEqual({});
        });
        test("Should validate params against a schema", () => {
            const request = new Request("https://example.com/users/42");
            const httpReq = HttpReq.fromWebReq({
                request,
                _rawParams: { id: "42" },
            });
            const params = httpReq.params(z.object({ id: z.string() }));
            expect(params).toEqual({ id: "42" });
        });
        test("Should throw when validation fails", () => {
            const request = new Request("https://example.com/users/42");
            const httpReq = HttpReq.fromWebReq({
                request,
                _rawParams: { id: "42" },
            });
            expect(() =>
                httpReq.params(z.object({ id: z.string().min(5) })),
            ).toThrow(HttpError);
            expect(() =>
                httpReq.params(z.object({ id: z.string().min(5) })),
            ).toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });
    });
    describe("method: searchParams", () => {
        test("Should parse query parameters from the URL", () => {
            const request = new Request(
                "https://example.com/search?q=hello&page=1",
            );
            const httpReq = HttpReq.fromWebReq({ request });
            const sp = httpReq.searchParams();
            expect(sp["q"]).toBe("hello");
            expect(sp["page"]).toBe("1");
        });
        test("Should return array for repeated query parameters", () => {
            const request = new Request(
                "https://example.com/search?tag=a&tag=b",
            );
            const httpReq = HttpReq.fromWebReq({ request });
            const sp = httpReq.searchParams();
            expect(Array.isArray(sp["tag"])).toBe(true);
            expect(sp["tag"]).toEqual(["a", "b"]);
        });
        test("Should return an empty object when there are no query parameters", () => {
            const request = new Request("https://example.com/test");
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.searchParams()).toEqual({});
        });
        test("Should validate query parameters against a schema", () => {
            const request = new Request("https://example.com/search?q=hello");
            const httpReq = HttpReq.fromWebReq({ request });
            const params = httpReq.searchParams(z.object({ q: z.string() }));
            expect(params).toEqual({ q: "hello" });
        });
        test("Should throw when validation fails", () => {
            const request = new Request("https://example.com/search?q=hello");
            const httpReq = HttpReq.fromWebReq({ request });
            expect(() =>
                httpReq.searchParams(z.object({ q: z.string().min(10) })),
            ).toThrow(HttpError);
            expect(() =>
                httpReq.searchParams(z.object({ q: z.string().min(10) })),
            ).toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });
    });
    describe("method: headers", () => {
        test("Should return all request headers", () => {
            const request = new Request("https://example.com/test", {
                headers: { "x-custom": "myvalue" },
            });
            const httpReq = HttpReq.fromWebReq({ request });
            const headers = httpReq.headers();
            expect(headers["x-custom"]).toBe("myvalue");
        });
        test("Should validate headers against a schema", () => {
            const request = new Request("https://example.com/test", {
                headers: { "x-custom": "myvalue" },
            });
            const httpReq = HttpReq.fromWebReq({ request });
            const headers = httpReq.headers(
                z.object({ "x-custom": z.string() }),
            );
            expect(headers).toEqual({ "x-custom": "myvalue" });
        });
        test("Should throw when validation fails", () => {
            const request = new Request("https://example.com/test", {
                headers: { "x-custom": "myvalue" },
            });
            const httpReq = HttpReq.fromWebReq({ request });
            expect(() =>
                httpReq.headers(z.object({ "x-custom": z.string().min(10) })),
            ).toThrow(HttpError);
            expect(() =>
                httpReq.headers(z.object({ "x-custom": z.string().min(10) })),
            ).toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });
    });
    describe("method: cookies", () => {
        test("Should parse cookies from the Cookie header", () => {
            const request = new Request("https://example.com/test", {
                headers: { Cookie: "session=abc123; theme=dark" },
            });
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.cookies()).toEqual({
                session: "abc123",
                theme: "dark",
            });
        });
        test("Should return an empty object when there is no Cookie header", () => {
            const request = new Request("https://example.com/test");
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.cookies()).toEqual({});
        });
        test("Should validate cookies against a schema", () => {
            const request = new Request("https://example.com/test", {
                headers: { Cookie: "session=abc123" },
            });
            const httpReq = HttpReq.fromWebReq({ request });
            const cookies = httpReq.cookies(z.object({ session: z.string() }));
            expect(cookies).toEqual({ session: "abc123" });
        });
        test("Should throw when validation fails", () => {
            const request = new Request("https://example.com/test", {
                headers: { Cookie: "session=abc123" },
            });
            const httpReq = HttpReq.fromWebReq({ request });
            expect(() =>
                httpReq.cookies(z.object({ session: z.string().min(10) })),
            ).toThrow(HttpError);
            expect(() =>
                httpReq.cookies(z.object({ session: z.string().min(10) })),
            ).toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });
    });
    describe("method: text", () => {
        test("Should delegate to request.text()", async () => {
            const request = new Request("https://example.com/test", {
                method: "POST",
                body: "hello world",
            });
            const textSpy = vi.spyOn(request, "text");
            const httpReq = HttpReq.fromWebReq({ request });

            const result = await httpReq.text();

            expect(textSpy).toHaveBeenCalledTimes(1);
            expect(result).toBe("hello world");
        });
    });
    describe("method: bytes", () => {
        test("Should delegate to request.bytes()", async () => {
            const request = new Request("https://example.com/test", {
                method: "POST",
                body: "data",
            });
            const bytesSpy = vi.spyOn(request, "bytes");
            const httpReq = HttpReq.fromWebReq({ request });

            const bytes = await httpReq.bytes();

            expect(bytesSpy).toHaveBeenCalledTimes(1);
            expect(bytes).toBeInstanceOf(Uint8Array);
        });
    });
    describe("method: arrayBuffer", () => {
        test("Should delegate to request.arrayBuffer()", async () => {
            const request = new Request("https://example.com/test", {
                method: "POST",
                body: "data",
            });
            const abSpy = vi.spyOn(request, "arrayBuffer");
            const httpReq = HttpReq.fromWebReq({ request });

            const buffer = await httpReq.arrayBuffer();

            expect(abSpy).toHaveBeenCalledTimes(1);
            expect(buffer).toBeInstanceOf(ArrayBuffer);
        });
    });
    describe("method: blob", () => {
        test("Should delegate to request.blob()", async () => {
            const request = new Request("https://example.com/test", {
                method: "POST",
                body: "blob data",
            });
            const blobSpy = vi.spyOn(request, "blob");
            const httpReq = HttpReq.fromWebReq({ request });

            const blob = await httpReq.blob();

            expect(blobSpy).toHaveBeenCalledTimes(1);
            expect(blob).toBeInstanceOf(Blob);
        });
    });
    describe("Symbol.asyncIterator", () => {
        test("Should be iterable as an async iterable when body exists", async () => {
            const request = new Request("https://example.com/test", {
                method: "POST",
                body: "stream content",
            });
            const httpReq = HttpReq.fromWebReq({ request });

            let collected = "";
            for await (const chunk of httpReq) {
                collected += new TextDecoder().decode(chunk as Uint8Array);
            }
            expect(collected).toBe("stream content");
        });
    });
});
