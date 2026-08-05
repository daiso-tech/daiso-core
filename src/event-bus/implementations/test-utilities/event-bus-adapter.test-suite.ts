/**
 * @module EventBus
 */

import { describe, vi } from "vitest";

import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay } from "@/utilities/_module.js";

import type { TestAPI, SuiteAPI, ExpectStatic, beforeEach } from "vitest";

import type {
    BaseEvent,
    IEventBusAdapter,
} from "@/event-bus/contracts/_module.js";
import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type { Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/event-bus/test-utilities"`
 * @group TestUtilities
 */
export type EventBusAdapterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<IEventBusAdapter>;

    /**
     * @default
     * ```ts
     * import { ExecutionContext } from "eridu-tech/execution-context"
     * import { NoOpExecutionContextAdapter } from "eridu-tech/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    context?: IReadableContext;
};

/**
 * The `eventBusAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link IEventBusAdapter | `IEventBusAdapter`} with vitest.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/test-utilities"`
 * @group TestUtilities
 */
export function eventBusAdapterTestSuite(
    settings: EventBusAdapterTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createAdapter,
        beforeEach: beforeEach_,
        context = new ExecutionContext(new NoOpExecutionContextAdapter()),
    } = settings;

    let adapter: IEventBusAdapter;

    const TTL = TimeSpan.fromMilliseconds(50);

    describe("IEventBusAdapter tests:", () => {
        beforeEach_(async () => {
            adapter = await createAdapter();
        });
        describe("method: addListener, removeListener, dispatch", () => {
            test("Should be null when listener added and event is not triggered", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});

                await adapter.addListener("event", handlerFn, context);

                await delay(TTL);
                expect(handlerFn).not.toHaveBeenCalled();
            });
            test("Should be TestEvent when listener added and event is triggered", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});
                await adapter.addListener("event", handlerFn, context);

                const event = {
                    type: "event",
                };
                await adapter.dispatch("event", event, context);
                await delay(TTL);

                expect(handlerFn).toHaveBeenCalledTimes(1);
                expect(handlerFn).toHaveBeenCalledWith(event);
            });
            test("Should be null when listener removed and event is triggered", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});

                await adapter.addListener("event", handlerFn, context);
                await adapter.removeListener("event", handlerFn, context);
                const event = {
                    type: "event",
                };

                await adapter.dispatch("event", event, context);

                await delay(TTL);
                expect(handlerFn).not.toHaveBeenCalled();
            });
        });
    });
}
