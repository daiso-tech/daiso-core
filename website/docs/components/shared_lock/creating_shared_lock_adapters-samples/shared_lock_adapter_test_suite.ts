// filename: MySharedLockAdapter.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { sharedLockAdapterTestSuite } from "eridu-tech/shared-lock/test-utilities";
import { MemorySharedLockAdapter } from "./MemorySharedLockAdapter.js";

describe("class: MySharedLockAdapter", () => {
    sharedLockAdapterTestSuite({
        createAdapter: () => new MemorySharedLockAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
