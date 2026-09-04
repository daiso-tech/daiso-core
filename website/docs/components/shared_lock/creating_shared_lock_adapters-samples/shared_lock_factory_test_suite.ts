// filename: MySharedLockFactory.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { sharedLockProviderTestSuite } from "eridu-tech/shared-lock/test-utilities";
import { MySharedLockFactory } from "./MySharedLockFactory.js";

describe("class: MySharedLockFactory", () => {
    sharedLockProviderTestSuite({
        createSharedLockFactory: () => new MySharedLockFactory(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
