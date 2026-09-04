// filename: MySemaphoreFactory.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { semaphoreFactoryTestSuite } from "eridu-tech/semaphore/test-utilities";
import { MySemaphoreFactory } from "./MySemaphoreFactory.js";

describe("class: MySemaphoreFactory", () => {
    semaphoreFactoryTestSuite({
        createSemaphoreFactory: () => new MySemaphoreFactory(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
