import { describe, expect, test } from "vitest";

import { httpResHelpers } from "@/http-router/implementations/http-res-helpers.js";

describe("object: httpResHelpers", () => {
    describe("method: text", () => {
        test("Should return an HttpRes with text/plain content type", () => {
            const res = httpResHelpers.text("hello");
            expect(res.getHeader("Content-Type")).toBe("text/plain");
            const webRes = res.buildWebRes();
            expect(webRes).toBeInstanceOf(Response);
        });

        test("Should set the body to the provided content", async () => {
            const res = httpResHelpers.text("hello world");
            const webRes = res.buildWebRes();
            expect(await webRes.text()).toBe("hello world");
        });
    });

    describe("method: html", () => {
        test("Should return an HttpRes with text/html content type", () => {
            const res = httpResHelpers.html("<p>Hello</p>");
            expect(res.getHeader("Content-Type")).toBe("text/html");
        });

        test("Should set the body to the provided HTML", async () => {
            const res = httpResHelpers.html("<h1>Title</h1>");
            const webRes = res.buildWebRes();
            expect(await webRes.text()).toBe("<h1>Title</h1>");
        });
    });

    describe("method: json", () => {
        test("Should return an HttpRes with application/json content type", () => {
            const res = httpResHelpers.json({ key: "value" });
            expect(res.getHeader("Content-Type")).toBe("application/json");
        });

        test("Should serialize the data as JSON", async () => {
            const res = httpResHelpers.json({ a: 1, b: "two" });
            const webRes = res.buildWebRes();
            const parsed: unknown = JSON.parse(await webRes.text());
            expect(parsed).toEqual({ a: 1, b: "two" });
        });

        test("Should handle arrays as JSON", async () => {
            const res = httpResHelpers.json([1, 2, 3]);
            const webRes = res.buildWebRes();
            const parsed: unknown = JSON.parse(await webRes.text());
            expect(parsed).toEqual([1, 2, 3]);
        });

        test("Should handle null as JSON", async () => {
            const res = httpResHelpers.json(null);
            const webRes = res.buildWebRes();
            expect(await webRes.text()).toBe("null");
        });
    });

    describe("method: notFound", () => {
        test("Should return an HttpRes with status 404", () => {
            const res = httpResHelpers.notFound();
            expect(res.buildWebRes().status).toBe(404);
        });

        test("Should return HTML content type with a message", () => {
            const res = httpResHelpers.notFound();
            expect(res.getHeader("Content-Type")).toBe("text/html");
        });
    });

    describe("method: redirect", () => {
        test("Should return an HttpRes with status 302", () => {
            const res = httpResHelpers.redirect("/new-location");
            expect(res.buildWebRes().status).toBe(302);
        });

        test("Should set the Location header", () => {
            const res = httpResHelpers.redirect("/new-location");
            expect(res.getHeader("Location")).toBe("/new-location");
        });
    });

    describe("method: permanentRedirect", () => {
        test("Should return an HttpRes with status 301", () => {
            const res = httpResHelpers.permanentRedirect("/new-permanent");
            expect(res.buildWebRes().status).toBe(301);
        });

        test("Should set the Location header", () => {
            const res = httpResHelpers.permanentRedirect("/new-permanent");
            expect(res.getHeader("Location")).toBe("/new-permanent");
        });
    });

    describe("method: fromWebRes", () => {
        test("Should create an HttpRes from a Web Response", () => {
            const webRes = new Response("body", {
                status: 201,
                statusText: "Created",
                headers: { "X-Custom": "value" },
            });
            const httpRes = httpResHelpers.fromWebRes(webRes);
            const built = httpRes.buildWebRes();
            expect(built.status).toBe(201);
            expect(built.statusText).toBe("Created");
            expect(built.headers.get("X-Custom")).toBe("value");
        });
    });
});
