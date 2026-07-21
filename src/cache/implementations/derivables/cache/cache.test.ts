import { beforeEach, describe, expect, test } from "vitest";

import { MemoryCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { Cache } from "@/cache/implementations/derivables/_module.js";
import { cacheTestSuite } from "@/cache/implementations/test-utilities/_module.js";

describe("class: Cache", () => {
    cacheTestSuite({
        createCache: () =>
            new Cache({
                adapter: new MemoryCacheAdapter(),
            }),
        test,
        beforeEach,
        expect,
        describe,
    });
});
