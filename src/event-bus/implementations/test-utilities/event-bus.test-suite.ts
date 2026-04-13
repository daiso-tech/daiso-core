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
    const { expect, test, describe, createEventBus, beforeEach } = settings;

    const TTL = TimeSpan.fromMilliseconds(50);
    type AddEvent = {
        a: number;
        b: number;
    };

    let eventBus: IEventBus<{
        add: AddEvent;
    }>;
    describe("IEventBus tests:", () => {
        beforeEach(async () => {
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
                expect(listener).toHaveBeenCalledWith(event);
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
            test.todo("Write test for multiple events.");
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
                expect(listener).toHaveBeenCalledWith(event);
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
            test.todo("Write test for multiple events.");
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
                const listener = vi.fn((_event_AddEvent) => {});
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
