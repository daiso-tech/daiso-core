/**
 * @module EventBus
 */

import {
    type TestAPI,
    type SuiteAPI,
    type ExpectStatic,
    type beforeEach,
    describe,
    vi,
} from "vitest";

import {
    type BaseEvent,
    type IEventBusAdapter,
} from "@/event-bus/contracts/_module.js";
import { Task } from "@/task/implementations/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/test-utilities"`
 * @group TestUtilities
 */
export type EventBusAdapterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<IEventBusAdapter>;
};

/**
 * The `eventBusAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link IEventBusAdapter | `IEventBusAdapter`} with vitest.
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/test-utilities"`
 * @group TestUtilities
 */
export function eventBusAdapterTestSuite(
    settings: EventBusAdapterTestSuiteSettings,
): void {
    const { expect, test, createAdapter, beforeEach } = settings;

    let adapter: IEventBusAdapter;

    async function delay(time: TimeSpan): Promise<void> {
        await Task.delay(time);
    }

    const TTL = TimeSpan.fromMilliseconds(50);

    describe("IEventBusAdapter tests:", () => {
        beforeEach(async () => {
            adapter = await createAdapter();
        });
        describe("method: addListener, removeListener, dispatch", () => {
            test("Should be null when listener added and event is not triggered", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});

                await adapter.addListener("event", handlerFn);

                expect(handlerFn).not.toHaveBeenCalled();
            });
            test("Should be TestEvent when listener added and event is triggered", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});
                await adapter.addListener("event", handlerFn);

                const event = {
                    type: "event",
                };
                await adapter.dispatch("event", event);
                await delay(TTL);

                expect(handlerFn).toHaveBeenCalledTimes(1);
                expect(handlerFn).toHaveBeenCalledWith(event);
            });
            test("Should be null when listener removed and event is triggered", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});

                await adapter.addListener("event", handlerFn);
                await adapter.removeListener("event", handlerFn);
                const event = {
                    type: "event",
                };

                await adapter.dispatch("event", event);
                await delay(TTL);

                expect(handlerFn).not.toHaveBeenCalled();
            });
        });
    });
}
