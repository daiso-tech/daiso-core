// filename: MySemaphoreAdapter.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { semaphoreAdapterTestSuite } from "eridu-tech/semaphore/test-utilities";
import { MemorySemaphoreAdapter } from "./MemorySemaphoreAdapter.js";

describe("class: MySemaphoreAdapter", () => {
    semaphoreAdapterTestSuite({
        createAdapter: () => new MemorySemaphoreAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
