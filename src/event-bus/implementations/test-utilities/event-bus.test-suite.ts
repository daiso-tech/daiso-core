/**
 * @module EventBus
 */

import {
    type TestAPI,
    type SuiteAPI,
    type ExpectStatic,
    type beforeEach,
    vi,
} from "vitest";

import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay, type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/test-utilities"`
 * @group TestUtilities
 */
export type EventBusTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createEventBus: () => Promisable<IEventBus>;
};

/**
 * The `eventBusTestSuite` function simplifies the process of testing your custom implementation of {@link IEventBus | `IEventBus`} with vitest.
 *
 * IMPORT_PATH: `"@daiso-tech/core/event-bus/test-utilities"`
 * @group TestUtilities
 */
export function eventBusTestSuite(settings: EventBusTestSuiteSettings): void {
    const {
        expect,
        test,
        describe,
        createEventBus,
        beforeEach: beforeEach_,
    } = settings;

    const TTL = TimeSpan.fromMilliseconds(50);
    type AddEvent = {
        a: number;
        b: number;
    };
    type SubtractEvent = {
        c: number;
        d: number;
    };

    let eventBus: IEventBus<{
        add: AddEvent;
        subtract: SubtractEvent;
    }>;
    describe("IEventBus tests:", () => {
        beforeEach_(async () => {
            eventBus = await createEventBus();
        });

        describe("method: addListener, removeListener, dispatch", () => {
            test("Should not call listener when listener is added and event is not triggered", async () => {
                const listener = vi.fn((_event: AddEvent) => {});

                await eventBus.addListener("add", listener);

                expect(listener).toHaveBeenCalledTimes(0);
                await eventBus.removeListener("add", listener);
            });
            test("Should call listener 2 times with AddEvent when listener is added and event is triggered 2 times", async () => {
                const listener = vi.fn((_event: AddEvent) => {});
                await eventBus.addListener("add", listener);

                const event: AddEvent = {
                    a: 1,
                    b: 2,
                };
                await eventBus.dispatch("add", event);
                await eventBus.dispatch("add", event);
                await delay(TTL);

                expect(listener).toHaveBeenCalledTimes(2);
                expect(listener).toHaveBeenCalledWith({
                    type: "add",
                    ...event,
                });
                await eventBus.removeListener("add", listener);
            });
            test("Should not call listener when listener is removed and event is triggered", async () => {
                const listener = vi.fn((_event: AddEvent) => {});
                await eventBus.addListener("add", listener);

                await eventBus.removeListener("add", listener);
                const event: AddEvent = {
                    a: 1,
                    b: 2,
                };
                await eventBus.dispatch("add", event);
                await delay(TTL);

                expect(listener).toHaveBeenCalledTimes(0);
            });
            test("Should call listener for each dispatched event when subscribed to multiple events", async () => {
                const listener = vi.fn(() => {});
                await eventBus.addListener(["add", "subtract"], listener);

                const addEvent: AddEvent = { a: 1, b: 2 };
                const subtractEvent: SubtractEvent = { c: 3, d: 4 };
                await eventBus.dispatch("add", addEvent);
                await eventBus.dispatch("subtract", subtractEvent);
                await delay(TTL);

                expect(listener).toHaveBeenCalledTimes(2);
                expect(listener).toHaveBeenNthCalledWith(1, {
                    type: "add",
                    ...addEvent,
                });
                expect(listener).toHaveBeenNthCalledWith(2, {
                    type: "subtract",
                    ...subtractEvent,
                });
                await eventBus.removeListener(["add", "subtract"], listener);
            });
            test("Should not call listener for any event when removed from multiple events", async () => {
                const listener = vi.fn(() => {});
                await eventBus.addListener(["add", "subtract"], listener);
                await eventBus.removeListener(["add", "subtract"], listener);

                const addEvent: AddEvent = { a: 1, b: 2 };
                const subtractEvent: SubtractEvent = { c: 3, d: 4 };
                await eventBus.dispatch("add", addEvent);
                await eventBus.dispatch("subtract", subtractEvent);
                await delay(TTL);

                expect(listener).toHaveBeenCalledTimes(0);
            });
        });
        describe("method: subscribe, dispatch", () => {
            test("Should not call listener when listener is added and event is not triggered", async () => {
                const listener = vi.fn((_event: AddEvent) => {});

                const unsubscribe = await eventBus.subscribe("add", listener);
                expect(listener).toHaveBeenCalledTimes(0);

                await unsubscribe();
            });
            test("Should call listener 2 times with AddEvent when listener is added and event is triggered 2 times", async () => {
                const listener = vi.fn((_event: AddEvent) => {});
                const unsubscribe = await eventBus.subscribe("add", listener);

                const event: AddEvent = {
                    a: 1,
                    b: 2,
                };
                await eventBus.dispatch("add", event);
                await eventBus.dispatch("add", event);
                await delay(TTL);

                expect(listener).toHaveBeenCalledTimes(2);
                expect(listener).toHaveBeenCalledWith({
                    type: "add",
                    ...event,
                });
                await unsubscribe();
            });
            test("Should not call listener when listener is removed by unsubscribe and event is triggered", async () => {
                const listener = vi.fn((_event: AddEvent) => {});
                const unsubscribe = await eventBus.subscribe("add", listener);
                await unsubscribe();

                const event: AddEvent = {
                    a: 1,
                    b: 2,
                };
                await eventBus.dispatch("add", event);
                await delay(TTL);

                expect(listener).toHaveBeenCalledTimes(0);
            });
            test("Should not call listener when listener is removed by removeListener and event is triggered", async () => {
                const listener = vi.fn((_event: AddEvent) => {});
                await eventBus.subscribe("add", listener);
                await eventBus.removeListener("add", listener);

                const event: AddEvent = {
                    a: 1,
                    b: 2,
                };
                await eventBus.dispatch("add", event);
                await delay(TTL);

                expect(listener).toHaveBeenCalledTimes(0);
            });
            test("Should call listener for each dispatched event when subscribed to multiple events", async () => {
                const listener = vi.fn(() => {});
                const unsubscribe = await eventBus.subscribe(
                    ["add", "subtract"],
                    listener,
                );

                const addEvent: AddEvent = { a: 1, b: 2 };
                const subtractEvent: SubtractEvent = { c: 3, d: 4 };
                await eventBus.dispatch("add", addEvent);
                await eventBus.dispatch("subtract", subtractEvent);
                await delay(TTL);

                expect(listener).toHaveBeenCalledTimes(2);
                expect(listener).toHaveBeenNthCalledWith(1, {
                    type: "add",
                    ...addEvent,
                });
                expect(listener).toHaveBeenNthCalledWith(2, {
                    type: "subtract",
                    ...subtractEvent,
                });
                await unsubscribe();
            });
            test("Should not call listener for any event when unsubscribed from multiple events", async () => {
                const listener = vi.fn(() => {});
                const unsubscribe = await eventBus.subscribe(
                    ["add", "subtract"],
                    listener,
                );
                await unsubscribe();

                const addEvent: AddEvent = { a: 1, b: 2 };
                const subtractEvent: SubtractEvent = { c: 3, d: 4 };
                await eventBus.dispatch("add", addEvent);
                await eventBus.dispatch("subtract", subtractEvent);
                await delay(TTL);

                expect(listener).toHaveBeenCalledTimes(0);
            });
            test("Should not call listener for any event when removed via removeListener from multiple events", async () => {
                const listener = vi.fn(() => {});
                await eventBus.subscribe(["add", "subtract"], listener);
                await eventBus.removeListener(["add", "subtract"], listener);

                const addEvent: AddEvent = { a: 1, b: 2 };
                const subtractEvent: SubtractEvent = { c: 3, d: 4 };
                await eventBus.dispatch("add", addEvent);
                await eventBus.dispatch("subtract", subtractEvent);
                await delay(TTL);

                expect(listener).toHaveBeenCalledTimes(0);
            });
        });
        describe("method: subscribeOnce", () => {
            test("Should not call listener when listener is added and event is not triggered", async () => {
                const listener = vi.fn((_event: AddEvent) => {});

                await eventBus.subscribeOnce("add", listener);

                expect(listener).toHaveBeenCalledTimes(0);
            });
            test("Should call listener once with AddEvent when listener is added and event is triggered 2 times", async () => {
                const listener = vi.fn((_event: AddEvent) => {});
                await eventBus.subscribeOnce("add", listener);

                const event: AddEvent = {
                    a: 1,
                    b: 2,
                };
                await eventBus.dispatch("add", event);
                await eventBus.dispatch("add", event);
                await delay(TTL);

                expect(listener).toHaveBeenCalledOnce();
                expect(listener).toHaveBeenCalledWith(event);
            });
            test("Should only listen for event once", async () => {
                const listener = vi.fn(() => {});
                await eventBus.subscribeOnce("add", listener);

                const event: AddEvent = {
                    a: 1,
                    b: 2,
                };
                await eventBus.dispatch("add", event);
                await eventBus.dispatch("add", event);
                await delay(TTL);

                expect(listener).toHaveBeenCalledOnce();
            });
            test("Should not call listener when listener is removed by unsubscribe function and event is triggered", async () => {
                const listener = vi.fn((_event: AddEvent) => {});
                const unsubscribe = await eventBus.subscribeOnce(
                    "add",
                    listener,
                );
                await unsubscribe();

                const event: AddEvent = {
                    a: 1,
                    b: 2,
                };
                await eventBus.dispatch("add", event);
                await delay(TTL);

                expect(listener).toHaveBeenCalledTimes(0);
            });
            test("Should not call listener when listener is removed by removeListener method and event is triggered", async () => {
                const listener = vi.fn((_event: AddEvent) => {});
                await eventBus.subscribeOnce("add", listener);
                await eventBus.removeListener("add", listener);

                const event: AddEvent = {
                    a: 1,
                    b: 2,
                };
                await eventBus.dispatch("add", event);
                await delay(TTL);

                expect(listener).toHaveBeenCalledTimes(0);
            });
        });
        describe("method: listenOnce", () => {
            test("Should not call listener when listener is added and event is not triggered", async () => {
                const listener = vi.fn((_event: AddEvent) => {});

                await eventBus.listenOnce("add", listener);

                expect(listener).toHaveBeenCalledTimes(0);
            });
            test("Should call listener once with AddEvent when listener is added and event is triggered 2 times", async () => {
                const listener = vi.fn((_event: AddEvent) => {});
                await eventBus.listenOnce("add", listener);

                const event: AddEvent = {
                    a: 1,
                    b: 2,
                };
                await eventBus.dispatch("add", event);
                await eventBus.dispatch("add", event);
                await delay(TTL);

                expect(listener).toHaveBeenCalledOnce();
                expect(listener).toHaveBeenCalledWith(event);
            });
            test("Should not call listener when listener is removed and event is triggered", async () => {
                const listener = vi.fn((_event: AddEvent) => {});
                await eventBus.listenOnce("add", listener);
                await eventBus.removeListener("add", listener);

                const event: AddEvent = {
                    a: 1,
                    b: 2,
                };
                await eventBus.dispatch("add", event);
                await delay(TTL);

                expect(listener).toHaveBeenCalledTimes(0);
            });
        });
        describe("method: asPromise", () => {
            test("Should not call onfulfilled handler when event is not triggered", () => {
                const listener = vi.fn((_event: AddEvent) => {});

                void eventBus.asPromise("add").then(listener);

                expect(listener).toHaveBeenCalledTimes(0);
            });
            test("Should call onfulfilled with AddEvent when event is triggered", async () => {
                const listener = vi.fn((_event: AddEvent) => {});

                void eventBus.asPromise("add").then(listener);
                const event: AddEvent = {
                    a: 1,
                    b: 2,
                };
                await eventBus.dispatch("add", event);
                await delay(TTL);

                expect(listener).toHaveBeenCalledTimes(1);
                expect(listener).toHaveBeenCalledWith(event);
            });
        });
    });
}
