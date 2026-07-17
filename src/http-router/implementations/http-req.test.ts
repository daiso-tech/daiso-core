/**
 * @module HttpRouter
 */

import { describe, expect, test, vi } from "vitest";

import { HttpReq } from "@/http-router/implementations/http-req.js";
import { ValidatedHttpReq } from "@/http-router/implementations/validated-http-req.js";

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
            expect(httpReq.rawParams()).toEqual({ id: "42" });
        });

        test("Should return empty params when _rawParams is not provided", () => {
            const request = new Request("https://example.com/test");
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.rawParams()).toEqual({});
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
            expect(httpReq.rawParams()).toEqual({ id: "42" });
        });

        test("Should include search params as single values", () => {
            const httpReq = HttpReq.test({
                method: "GET",
                url: "/search",
                searchParams: { q: "hello" },
            });
            expect(httpReq.rawSearchParams()).toEqual({ q: "hello" });
        });

        test("Should include search params as array values", () => {
            const httpReq = HttpReq.test({
                method: "GET",
                url: "/search",
                searchParams: { tags: ["a", "b"] },
            });
            const sp = httpReq.rawSearchParams();
            expect(sp["tags"]).toEqual(["a", "b"]);
        });

        test("Should include headers", () => {
            const httpReq = HttpReq.test({
                method: "GET",
                url: "/test",
                headers: { "x-custom": "myvalue" },
            });
            expect(httpReq.rawHeaders()["x-custom"]).toBe("myvalue");
        });

        test("Should include cookies", () => {
            const httpReq = HttpReq.test({
                method: "GET",
                url: "/test",
                cookies: { session: "abc123" },
            });
            expect(httpReq.rawCookies()).toEqual({ session: "abc123" });
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
            const json = await httpReq.rawJson();
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
            const formData = await httpReq.rawFormData();
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

    describe("method: rawJson", () => {
        test("Should delegate to request.json()", async () => {
            const request = new Request("https://example.com/api", {
                method: "POST",
                body: JSON.stringify({ a: 1 }),
            });
            const jsonSpy = vi.spyOn(request, "json");
            const httpReq = HttpReq.fromWebReq({ request });

            const json = await httpReq.rawJson();

            expect(jsonSpy).toHaveBeenCalledTimes(1);
            expect(json).toEqual({ a: 1 });
        });
    });

    describe("method: rawFormData", () => {
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
            const data = await httpReq.rawFormData();
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
            const data = await httpReq.rawFormData();
            expect(Object.keys(data)).toHaveLength(0);
        });
    });

    describe("method: rawParams", () => {
        test("Should return the raw path parameters", () => {
            const request = new Request("https://example.com/users/42");
            const httpReq = HttpReq.fromWebReq({
                request,
                _rawParams: { id: "42" },
            });
            expect(httpReq.rawParams()).toEqual({ id: "42" });
        });

        test("Should return an empty object when no params were provided", () => {
            const request = new Request("https://example.com/test");
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.rawParams()).toEqual({});
        });
    });

    describe("method: rawSearchParams", () => {
        test("Should parse query parameters from the URL", () => {
            const request = new Request(
                "https://example.com/search?q=hello&page=1",
            );
            const httpReq = HttpReq.fromWebReq({ request });
            const sp = httpReq.rawSearchParams();
            expect(sp["q"]).toBe("hello");
            expect(sp["page"]).toBe("1");
        });

        test("Should return array for repeated query parameters", () => {
            const request = new Request(
                "https://example.com/search?tag=a&tag=b",
            );
            const httpReq = HttpReq.fromWebReq({ request });
            const sp = httpReq.rawSearchParams();
            expect(Array.isArray(sp["tag"])).toBe(true);
            expect(sp["tag"]).toEqual(["a", "b"]);
        });

        test("Should return an empty object when there are no query parameters", () => {
            const request = new Request("https://example.com/test");
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.rawSearchParams()).toEqual({});
        });
    });

    describe("method: rawHeaders", () => {
        test("Should return all request headers", () => {
            const request = new Request("https://example.com/test", {
                headers: { "x-custom": "myvalue" },
            });
            const httpReq = HttpReq.fromWebReq({ request });
            const headers = httpReq.rawHeaders();
            expect(headers["x-custom"]).toBe("myvalue");
        });
    });

    describe("method: rawCookies", () => {
        test("Should parse cookies from the Cookie header", () => {
            const request = new Request("https://example.com/test", {
                headers: { Cookie: "session=abc123; theme=dark" },
            });
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.rawCookies()).toEqual({
                session: "abc123",
                theme: "dark",
            });
        });

        test("Should return an empty object when there is no Cookie header", () => {
            const request = new Request("https://example.com/test");
            const httpReq = HttpReq.fromWebReq({ request });
            expect(httpReq.rawCookies()).toEqual({});
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

    describe("method: withSchema", () => {
        test("Should return a ValidatedHttpReq instance", () => {
            const request = new Request("https://example.com/test");
            const httpReq = HttpReq.fromWebReq({ request });
            const validated = httpReq.withSchema({});
            expect(validated).toBeInstanceOf(ValidatedHttpReq);
        });

        test("Should return a validated request that can access params", () => {
            const request = new Request("https://example.com/users/42");
            const httpReq = HttpReq.fromWebReq({
                request,
                _rawParams: { id: "42" },
            });
            const validated = httpReq.withSchema({});
            expect(validated.params("id")).toBe("42");
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
