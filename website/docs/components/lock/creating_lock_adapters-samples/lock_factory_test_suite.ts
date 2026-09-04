// filename: MyLockFactory.test.ts

import { beforeEach, describe, expect, test } from "vitest";
import { lockFactoryTestSuite } from "eridu-tech/lock/test-utilities";
import { MyLockFactory } from "./MyLockFactory.js";

describe("class: MyLockFactory", () => {
    lockFactoryTestSuite({
        createLockFactory: () => new MyLockFactory(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
