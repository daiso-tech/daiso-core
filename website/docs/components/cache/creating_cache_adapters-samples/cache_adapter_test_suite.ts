// filename: MyCacheAdapter.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { cacheAdapterTestSuite } from "eridu-tech/cache/test-utilities";
import { MemoryCacheAdapter } from "./MemoryCacheAdapter.js";

describe("class: MyCacheAdapter", () => {
    cacheAdapterTestSuite({
        createAdapter: () => new MemoryCacheAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
