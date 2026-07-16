/**
 * @module HttpRouter
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, expect, test, vi } from "vitest";

import { FileSize } from "@/file-size/implementations/_module.js";
import { HttpRes } from "@/http-router/implementations/http-res.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("class: HttpRes", () => {
    describe("constructor", () => {
        test("Should create an HttpRes with empty defaults when no settings are provided", () => {
            const res = new HttpRes();
            const webRes = res.buildWebRes();
            expect(webRes.status).toBe(200);
            expect(webRes.statusText).toBe("");
        });

        test("Should accept initial headers", () => {
            const headers = new Headers({ "X-Custom": "value" });
            const res = new HttpRes({ headers });
            expect(res.getHeader("X-Custom")).toBe("value");
        });

        test("Should accept initial status", () => {
            const res = new HttpRes({ status: 201 });
            const webRes = res.buildWebRes();
            expect(webRes.status).toBe(201);
        });

        test("Should accept initial status text", () => {
            const res = new HttpRes({ statusText: "Created" });
            const webRes = res.buildWebRes();
            expect(webRes.statusText).toBe("Created");
        });

        test("Should accept initial body as a ReadableStream", () => {
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode("hello"));
                    controller.close();
                },
            });
            const res = new HttpRes({ body: stream });
            const built = res.buildWebRes();
            expect(built).toBeInstanceOf(Response);
        });
    });

    describe("method: setHeader", () => {
        test("Should set an arbitrary header and return the instance for chaining", () => {
            const res = new HttpRes();
            const result = res.setHeader("X-Custom", "myvalue");
            expect(result).toBe(res);
            expect(res.getHeader("X-Custom")).toBe("myvalue");
        });

        test("Should overwrite an existing header with the same key", () => {
            const res = new HttpRes();
            const setSpy = vi.spyOn(res as never, "setHeader");
            res.setHeader("X-Custom", "first");
            res.setHeader("X-Custom", "second");

            expect(setSpy).toHaveBeenCalledTimes(2);
            expect(res.getHeader("X-Custom")).toBe("second");
        });
    });

    describe("method: appendHeader", () => {
        test("Should append a value to an existing header", () => {
            const res = new HttpRes();
            res.setHeader("Vary", "Accept-Encoding");
            res.appendHeader("Vary", "Origin");
            const webRes = res.buildWebRes();
            expect(webRes.headers.get("Vary")).toContain("Accept-Encoding");
            expect(webRes.headers.get("Vary")).toContain("Origin");
        });

        test("Should return the instance for chaining", () => {
            const res = new HttpRes();
            const result = res.appendHeader("X-Foo", "bar");
            expect(result).toBe(res);
        });
    });

    describe("method: getHeader", () => {
        test("Should return the header value when it exists", () => {
            const res = new HttpRes();
            res.setHeader("X-Custom", "myvalue");
            expect(res.getHeader("X-Custom")).toBe("myvalue");
        });

        test("Should return null when the header does not exist", () => {
            const res = new HttpRes();
            expect(res.getHeader("X-Nonexistent")).toBeNull();
        });
    });

    describe("method: setStatus", () => {
        test("Should set the HTTP status code as a number", () => {
            const res = new HttpRes();
            res.setStatus(404);
            expect(res.buildWebRes().status).toBe(404);
        });

        test("Should set the HTTP status code as a string", () => {
            const res = new HttpRes();
            res.setStatus("404");
            expect(res.buildWebRes().status).toBe(404);
        });

        test("Should return the instance for chaining", () => {
            const res = new HttpRes();
            const result = res.setStatus(200);
            expect(result).toBe(res);
        });
    });

    describe("method: setStatusText", () => {
        test("Should set the status text", () => {
            const res = new HttpRes();
            res.setStatusText("Not Found");
            expect(res.buildWebRes().statusText).toBe("Not Found");
        });

        test("Should return the instance for chaining", () => {
            const res = new HttpRes();
            const result = res.setStatusText("OK");
            expect(result).toBe(res);
        });
    });

    describe("method: setBody", () => {
        test("Should set a string body", async () => {
            const res = new HttpRes();
            res.setBody("hello world");
            const webRes = res.buildWebRes();
            expect(await webRes.text()).toBe("hello world");
        });

        test("Should set an ArrayBuffer body", async () => {
            const res = new HttpRes();
            const buffer = new TextEncoder().encode("binary").buffer;
            res.setBody(buffer);
            const webRes = res.buildWebRes();
            expect(await webRes.text()).toBe("binary");
        });

        test("Should set a Uint8Array body", async () => {
            const res = new HttpRes();
            const bytes = new TextEncoder().encode("uint8");
            res.setBody(bytes);
            const webRes = res.buildWebRes();
            expect(await webRes.text()).toBe("uint8");
        });

        test("Should return the instance for chaining", () => {
            const res = new HttpRes();
            const result = res.setBody("test");
            expect(result).toBe(res);
        });
    });

    describe("method: setContentType", () => {
        test("Should set the Content-Type header", () => {
            const res = new HttpRes();
            res.setContentType("application/json");
            expect(res.getHeader("Content-Type")).toBe("application/json");
        });

        test("Should return the instance for chaining", () => {
            const res = new HttpRes();
            const result = res.setContentType("text/html");
            expect(result).toBe(res);
        });
    });

    describe("method: setContentLength", () => {
        test("Should set the Content-Length header from a number", () => {
            const res = new HttpRes();
            res.setContentLength(42);
            expect(res.getHeader("Content-Length")).toBe("42");
        });

        test("Should set the Content-Length header from a FileSize", () => {
            const res = new HttpRes();
            res.setContentLength(FileSize.fromKiloBytes(1));
            expect(res.getHeader("Content-Length")).toBe("1000");
        });

        test("Should return the instance for chaining", () => {
            const res = new HttpRes();
            const result = res.setContentLength(100);
            expect(result).toBe(res);
        });
    });

    describe("method: setContentEncoding", () => {
        test("Should set the Content-Encoding header", () => {
            const res = new HttpRes();
            res.setContentEncoding("gzip");
            expect(res.getHeader("Content-Encoding")).toBe("gzip");
        });
    });

    describe("method: setContentLanguage", () => {
        test("Should set the Content-Language header", () => {
            const res = new HttpRes();
            res.setContentLanguage("en-US");
            expect(res.getHeader("Content-Language")).toBe("en-US");
        });
    });

    describe("method: setContentDisposition", () => {
        test("Should set the Content-Disposition header", () => {
            const res = new HttpRes();
            res.setContentDisposition("attachment");
            expect(res.getHeader("Content-Disposition")).toBe("attachment");
        });
    });

    describe("method: setContentRange", () => {
        test("Should set the Content-Range header", () => {
            const res = new HttpRes();
            res.setContentRange("bytes 0-499/1000");
            expect(res.getHeader("Content-Range")).toBe("bytes 0-499/1000");
        });
    });

    describe("method: setCacheControl", () => {
        test("Should set the Cache-Control header", () => {
            const res = new HttpRes();
            res.setCacheControl("no-cache");
            expect(res.getHeader("Cache-Control")).toBe("no-cache");
        });
    });

    describe("method: setETag", () => {
        test("Should set the ETag header", () => {
            const res = new HttpRes();
            res.setETag('"abc123"');
            expect(res.getHeader("ETag")).toBe('"abc123"');
        });
    });

    describe("method: setLocation", () => {
        test("Should set the Location header", () => {
            const res = new HttpRes();
            res.setLocation("/new-url");
            expect(res.getHeader("Location")).toBe("/new-url");
        });

        test("Should return the instance for chaining", () => {
            const res = new HttpRes();
            const result = res.setLocation("/home");
            expect(result).toBe(res);
        });
    });

    describe("method: putCookie", () => {
        test("Should add a Set-Cookie header with the cookie name and value", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123");

            const webRes = res.buildWebRes();
            expect(webRes.headers.get("Set-Cookie")).toContain(
                "session=abc123",
            );
        });

        test("Should include SameSite=Lax by default", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123");
            const webRes = res.buildWebRes();
            expect(webRes.headers.get("Set-Cookie")).toContain("SameSite=Lax");
        });

        test("Should accept cookie settings like httpOnly", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123", { httpOnly: true });
            const webRes = res.buildWebRes();
            expect(webRes.headers.get("Set-Cookie")).toContain("HttpOnly");
        });

        test("Should accept cookie settings like secure", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123", { secure: true });
            const webRes = res.buildWebRes();
            expect(webRes.headers.get("Set-Cookie")).toContain("Secure");
        });

        test("Should accept Max-Age as a number", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123", { maxAge: 3600 });
            const webRes = res.buildWebRes();
            expect(webRes.headers.get("Set-Cookie")).toContain("Max-Age=3600");
        });

        test("Should accept Max-Age as a TimeSpan", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123", {
                maxAge: TimeSpan.fromHours(1),
            });
            const webRes = res.buildWebRes();
            expect(webRes.headers.get("Set-Cookie")).toContain("Max-Age=3600");
        });

        test("Should accept expires as a Date", () => {
            const res = new HttpRes();
            const futureDate = new Date(Date.now() + 3600000);
            res.putCookie("session", "abc123", { expires: futureDate });
            const webRes = res.buildWebRes();
            expect(webRes.headers.get("Set-Cookie")).toContain("Expires=");
        });

        test("Should accept expires as a TimeSpan", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123", {
                expires: TimeSpan.fromHours(1),
            });
            const webRes = res.buildWebRes();
            expect(webRes.headers.get("Set-Cookie")).toContain("Expires=");
        });

        test("Should apply the __Secure- prefix when prefix is 'secure'", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123", { prefix: "secure" });
            const webRes = res.buildWebRes();
            expect(webRes.headers.get("Set-Cookie")).toContain(
                "__Secure-session=abc123",
            );
        });

        test("Should apply the __Host- prefix when prefix is 'host'", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123", { prefix: "host" });
            const webRes = res.buildWebRes();
            expect(webRes.headers.get("Set-Cookie")).toContain(
                "__Host-session=abc123",
            );
        });

        test("Should include Path when specified", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123", { path: "/api" });
            const webRes = res.buildWebRes();
            expect(webRes.headers.get("Set-Cookie")).toContain("Path=/api");
        });

        test("Should include Domain when specified", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123", {
                domain: "example.com",
            });
            const webRes = res.buildWebRes();
            expect(webRes.headers.get("Set-Cookie")).toContain(
                "Domain=example.com",
            );
        });

        test("Should include Priority when specified", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123", { priority: "High" });
            const webRes = res.buildWebRes();
            expect(webRes.headers.get("Set-Cookie")).toContain("Priority=High");
        });

        test("Should include Partitioned when specified", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123", { partitioned: true });
            const webRes = res.buildWebRes();
            expect(webRes.headers.get("Set-Cookie")).toContain("Partitioned");
        });

        test("Should update an existing cookie with the same name", () => {
            const res = new HttpRes();
            res.putCookie("session", "old");
            res.putCookie("session", "new");
            const webRes = res.buildWebRes();
            const setCookie = webRes.headers.get("Set-Cookie");
            expect(setCookie).not.toContain("old");
            expect(setCookie).toContain("new");
        });

        test("Should throw TypeError when cookie name is not a string", () => {
            const res = new HttpRes();
            expect(() =>
                res.putCookie(null as unknown as string, "value"),
            ).toThrow(TypeError);
        });

        test("Should return the instance for chaining", () => {
            const res = new HttpRes();
            const result = res.putCookie("a", "b");
            expect(result).toBe(res);
        });
    });

    describe("method: removeCookie", () => {
        test("Should add a Set-Cookie header with Max-Age=0", () => {
            const res = new HttpRes();
            res.removeCookie("session");
            const webRes = res.buildWebRes();
            const cookie = webRes.headers.get("Set-Cookie");
            expect(cookie).toContain("session=");
            expect(cookie).toContain("Max-Age=0");
        });

        test("Should update an existing cookie to expire it", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123");
            res.removeCookie("session");
            const webRes = res.buildWebRes();
            const cookie = webRes.headers.get("Set-Cookie");
            expect(cookie).toContain("Max-Age=0");
            expect(cookie).not.toContain("abc123");
        });

        test("Should throw TypeError when cookie name is not a string", () => {
            const res = new HttpRes();
            expect(() => res.removeCookie(42 as unknown as string)).toThrow(
                TypeError,
            );
        });

        test("Should return the instance for chaining", () => {
            const res = new HttpRes();
            const result = res.removeCookie("a");
            expect(result).toBe(res);
        });
    });

    describe("method: hasCookies", () => {
        test("Should return false when no Set-Cookie headers are set", () => {
            const res = new HttpRes();
            expect(res.hasCookies()).toBe(false);
        });

        test("Should return true when at least one Set-Cookie header exists", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123");
            expect(res.hasCookies()).toBe(true);
        });

        test("Should return true when checking for an existing cookie by name", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123");
            expect(res.hasCookies("session")).toBe(true);
        });

        test("Should return false when checking for a non-existent cookie by name", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc123");
            expect(res.hasCookies("nonexistent")).toBe(false);
        });

        test("Should return false when no cookie matches the given name", () => {
            const res = new HttpRes();
            res.putCookie("token", "xyz");
            expect(res.hasCookies("session")).toBe(false);
        });

        test("Should throw TypeError when name is not a string", () => {
            const res = new HttpRes();
            expect(() => res.hasCookies(123 as unknown as string)).toThrow(
                TypeError,
            );
        });
    });

    describe("method: withoutCookies", () => {
        test("Should remove all Set-Cookie headers when called without a name", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc");
            res.putCookie("token", "xyz");
            res.withoutCookies();
            expect(res.hasCookies()).toBe(false);
        });

        test("Should remove only the named Set-Cookie header", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc");
            res.putCookie("token", "xyz");
            res.withoutCookies("session");
            expect(res.hasCookies("session")).toBe(false);
            expect(res.hasCookies("token")).toBe(true);
        });

        test("Should be a no-op when the named cookie does not exist", () => {
            const res = new HttpRes();
            res.putCookie("session", "abc");
            res.withoutCookies("unknown");
            expect(res.hasCookies("session")).toBe(true);
        });

        test("Should throw TypeError when name is not a string", () => {
            const res = new HttpRes();
            expect(() => res.withoutCookies(999 as unknown as string)).toThrow(
                TypeError,
            );
        });

        test("Should return the instance for chaining", () => {
            const res = new HttpRes();
            const result = res.withoutCookies();
            expect(result).toBe(res);
        });
    });

    describe("method: buildWebRes", () => {
        test("Should return a Response with status 200 by default", () => {
            const res = new HttpRes();
            const webRes = res.buildWebRes();
            expect(webRes.status).toBe(200);
        });

        test("Should return a Response with the configured status", () => {
            const res = new HttpRes();
            res.setStatus(404);
            expect(res.buildWebRes().status).toBe(404);
        });

        test("Should return a Response with configured headers", () => {
            const res = new HttpRes();
            res.setHeader("X-Custom", "value");
            expect(res.buildWebRes().headers.get("X-Custom")).toBe("value");
        });

        test("Should return a Response with a string body", async () => {
            const res = new HttpRes();
            res.setBody("test body");
            const webRes = res.buildWebRes();
            expect(await webRes.text()).toBe("test body");
        });

        test("Should return a Response without a body when none is set", () => {
            const res = new HttpRes();
            const webRes = res.buildWebRes();
            expect(webRes.body).toBeNull();
        });
    });

    describe("chaining", () => {
        test("Should support fluent method chaining", () => {
            const res = new HttpRes();
            const result = res
                .setStatus(201)
                .setHeader("X-A", "1")
                .setContentType("application/json")
                .setBody("{}");

            expect(result).toBe(res);
            const webRes = res.buildWebRes();
            expect(webRes.status).toBe(201);
            expect(webRes.headers.get("X-A")).toBe("1");
            expect(webRes.headers.get("Content-Type")).toBe("application/json");
        });
    });
});
