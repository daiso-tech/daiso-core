import { describe, expect, test } from "vitest";

import { abortAndFail } from "@/resilience/utilities/abort-and-fail/abort-and-fail.js";

describe("function: abortAndFail", () => {
    test("should throw Error when aborted", async () => {
        const inputPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve("a");
            }, 50);
        });
        const abortController = new AbortController();
        setTimeout(() => {
            abortController.abort(new Error("Promise was aborted"));
        }, 25);
        const outputPromise = abortAndFail(
            inputPromise,
            abortController.signal,
        );
        await expect(outputPromise).rejects.toBeInstanceOf(Error);
    });
    test("should return value when not aborted", async () => {
        const inputPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve("a");
            }, 50);
        });
        const abortController = new AbortController();
        const outputPromise = abortAndFail(
            inputPromise,
            abortController.signal,
        );
        await expect(outputPromise).resolves.toBe("a");
    });
    test("Should forward error", async () => {
        class ErrorA extends Error {}
        const abortController = new AbortController();
        const promise = abortAndFail(
            Promise.reject(new ErrorA()),
            abortController.signal,
        );
        await expect(promise).rejects.toBeInstanceOf(ErrorA);
    });
});
