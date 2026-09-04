// filename: MyEventBusAdapter.test.ts

import { describe, test, beforeEach, expect } from "vitest";
import { eventBusAdapterTestSuite } from "eridu-tech/event-bus/test-utilities";
import { MyEventBusAdapter } from "./MyEventBusAdapter.js";

describe("class: MyEventBusAdapter", () => {
    eventBusAdapterTestSuite({
        createAdapter: () => new MyEventBusAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
});
