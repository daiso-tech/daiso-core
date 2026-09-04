// filename: MyEventBus.test.ts

import { describe, test, beforeEach, expect } from "vitest";
import { eventBusTestSuite } from "eridu-tech/event-bus/test-utilities";
import { MyEventBus } from "./MyEventBus.js";

describe("class: EventBus", () => {
    eventBusTestSuite({
        test,
        expect,
        describe,
        beforeEach,
        createEventBus: () => new MyEventBus(),
    });
});
