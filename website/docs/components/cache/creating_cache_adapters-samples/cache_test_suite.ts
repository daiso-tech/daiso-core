// filename: MyCache.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { cacheTestSuite } from "eridu-tech/cache/test-utilities";
import { MyCache } from "./MyCache.js";

describe("class: MyCache", () => {
    cacheTestSuite({
        createCache: () => new MyCache(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
