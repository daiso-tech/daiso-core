import { EventEmitter } from "node:events";

import { describe, test, beforeEach, expect } from "vitest";
import { z } from "zod";

import { type EventListenerFn } from "@/event-bus/contracts/event-bus-adapter.contract.js";
import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/memory-event-bus-adapter/memory-event-bus-adapter.js";
import { EventBus } from "@/event-bus/implementations/derivables/event-bus/event-bus.js";
import { eventBusTestSuite } from "@/event-bus/implementations/test-utilities/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { Namespace } from "@/namespace/implementations/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay as delay_, ValidationError } from "@/utilities/_module.js";

describe("class: EventBus", () => {
    async function delay(ttl: ITimeSpan): Promise<void> {
        await delay_(TimeSpan.fromTimeSpan(ttl));
    }

    let eventEmitter: EventEmitter;
    const noOpContext = new ExecutionContext(new NoOpExecutionContextAdapter());
    beforeEach(() => {
        eventEmitter = new EventEmitter();
    });
    eventBusTestSuite({
        test,
        expect,
        describe,
        beforeEach,
        createEventBus: () =>
            new EventBus({
                namespace: new Namespace("event-bus"),
                adapter: new MemoryEventBusAdapter(eventEmitter),
            }),
    });
    describe("standard schema:", () => {
        type AddEvent = { a: number; b: number };
        const addEventSchema = z.object({
            a: z.number(),
            b: z.number(),
        });
        const eventMapSchema = {
            add: addEventSchema,
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const invalidInput: AddEvent = { a: "asd", c: null } as any;
        const namespace = new Namespace("event-bus");

        describe("input validation:", () => {
            test("method: dispatch", async () => {
                const eventBus = new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace,
                    eventMapSchema,
                });
                const promise = eventBus.dispatch("add", invalidInput);
                await expect(promise).rejects.toBeInstanceOf(ValidationError);
            });
        });
        describe("output validation:", () => {
            test("method: addListener", async () => {
                let error: unknown = null;
                const adapter = new MemoryEventBusAdapter();
                const eventBus = new EventBus({
                    adapter,
                    namespace,
                    eventMapSchema,
                    __onUncaughtRejection: (error_) => {
                        error = error_;
                    },
                });

                const listener: EventListenerFn<AddEvent> = () => {};

                await eventBus.addListener("add", listener);
                await adapter.dispatch(
                    noOpContext,
                    namespace.create("add").toString(),
                    invalidInput,
                );
                await delay(TimeSpan.fromMilliseconds(10));

                expect(error).toBeInstanceOf(ValidationError);
                await eventBus.removeListener("add", listener);
            });
            test("method: listenOnce", async () => {
                let error: unknown = null;
                const adapter = new MemoryEventBusAdapter();
                const eventBus = new EventBus({
                    adapter,
                    namespace,
                    eventMapSchema,
                    __onUncaughtRejection: (error_) => {
                        error = error_;
                    },
                });

                const listener: EventListenerFn<AddEvent> = () => {};

                await eventBus.listenOnce("add", listener);
                await adapter.dispatch(
                    noOpContext,
                    namespace.create("add").toString(),
                    invalidInput,
                );
                await delay(TimeSpan.fromMilliseconds(10));

                expect(error).toBeInstanceOf(ValidationError);
                await eventBus.removeListener("add", listener);
            });
            test("method: asPromise", async () => {
                let error: unknown = null;
                const adapter = new MemoryEventBusAdapter();
                const eventBus = new EventBus({
                    adapter,
                    namespace,
                    eventMapSchema,
                    __onUncaughtRejection: (error_) => {
                        error = error_;
                    },
                });

                void eventBus.asPromise("add");
                await adapter.dispatch(
                    noOpContext,
                    namespace.create("add").toString(),
                    invalidInput,
                );
                await delay(TimeSpan.fromMilliseconds(10));

                expect(error).toBeInstanceOf(ValidationError);
            });
            test("method: subscribeOnce", async () => {
                let error: unknown = null;
                const adapter = new MemoryEventBusAdapter();
                const eventBus = new EventBus({
                    adapter,
                    namespace,
                    eventMapSchema,
                    __onUncaughtRejection: (error_) => {
                        error = error_;
                    },
                });

                const listener: EventListenerFn<AddEvent> = () => {};

                const unsubscribe = await eventBus.subscribeOnce(
                    "add",
                    listener,
                );
                await adapter.dispatch(
                    noOpContext,
                    namespace.create("add").toString(),
                    invalidInput,
                );
                await delay(TimeSpan.fromMilliseconds(10));

                expect(error).toBeInstanceOf(ValidationError);
                await unsubscribe();
            });
            test("method: subscribe", async () => {
                let error: unknown = null;
                const adapter = new MemoryEventBusAdapter();
                const eventBus = new EventBus({
                    adapter,
                    namespace,
                    eventMapSchema,
                    __onUncaughtRejection: (error_) => {
                        error = error_;
                    },
                });

                const listener: EventListenerFn<AddEvent> = () => {};

                const unsubscribe = await eventBus.subscribe("add", listener);
                await adapter.dispatch(
                    noOpContext,
                    namespace.create("add").toString(),
                    invalidInput,
                );
                await delay(TimeSpan.fromMilliseconds(10));

                expect(error).toBeInstanceOf(ValidationError);
                await unsubscribe();
            });
        });
    });
});
