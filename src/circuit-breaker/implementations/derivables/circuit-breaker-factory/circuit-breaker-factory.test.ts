import { beforeEach, describe, expect, test, vi } from "vitest";

import {
    IsolatedCircuitBreakerError,
    OpenCircuitBreakerError,
    type ICircuitBreakerStateMethods,
    type IsolatedCircuitBreakerEvent,
    type ResetedCircuitBreakerEvent,
    type CircuitBreakerStateTransition,
    type ICircuitBreakerAdapter,
    CIRCUIT_BREAKER_TRIGGER,
    type ICircuitBreakerFactory,
    CIRCUIT_BREAKER_STATE,
    type CircuitBreakerState,
    type ICircuitBreaker,
} from "@/circuit-breaker/contracts/_module.js";
import {
    CIRCUIT_BREAKER_EVENTS,
    type StateTransitionCircuitBreakerEvent,
    type TrackedFailureCircuitBreakerEvent,
    type TrackedSlowCallCircuitBreakerEvent,
    type TrackedSuccessCircuitBreakerEvent,
    type UntrackedFailureCircuitBreakerEvent,
} from "@/circuit-breaker/contracts/circuit-breaker.events.js";
import {
    DatabaseCircuitBreakerAdapter,
    MemoryCircuitBreakerStorageAdapter,
} from "@/circuit-breaker/implementations/adapters/_module.js";
import { CircuitBreakerFactory } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/circuit-breaker-factory.js";
import { ConsecutiveBreaker } from "@/circuit-breaker/implementations/policies/_module.js";
import { type EventWithType } from "@/event-bus/contracts/_module.js";
import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { Namespace } from "@/namespace/implementations/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/serde.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay } from "@/utilities/_module.js";

describe("class: CircuitBreakerFactory", () => {
    const adapter: ICircuitBreakerAdapter = {
        getState(
            _context: IReadableContext,
            _key: string,
        ): Promise<CircuitBreakerState> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
        updateState(
            _context: IReadableContext,
            _key: string,
        ): Promise<CircuitBreakerStateTransition> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
        isolate(_context: IReadableContext, _key: string): Promise<void> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
        trackFailure(_context: IReadableContext, _key: string): Promise<void> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
        trackSuccess(_context: IReadableContext, _key: string): Promise<void> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
        reset(_context: IReadableContext, _key: string): Promise<void> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
    };
    const KEY = "A";
    const eventDispatchWaitTime = TimeSpan.fromMilliseconds(10);

    let circuitBreakerFactory: ICircuitBreakerFactory;
    const slowCallTime = TimeSpan.fromMilliseconds(50);
    beforeEach(() => {
        vi.resetAllMocks();
        circuitBreakerFactory = new CircuitBreakerFactory({
            adapter,
            eventBus: new EventBus({
                adapter: new MemoryEventBusAdapter(),
            }),
            serde: new Serde(new SuperJsonSerdeAdapter()),
            defaultSlowCallTime: slowCallTime,
            enableAsyncTracking: false,
        });
    });

    const waitForSettings = {
        interval: TimeSpan.fromTimeSpan(eventDispatchWaitTime).toMilliseconds(),
        timeout: TimeSpan.fromTimeSpan(eventDispatchWaitTime)
            .multiply(3)
            .toMilliseconds(),
    };

    class UnexpectedErrorA extends Error {}
    class UnexpectedErrorB extends Error {}

    describe("API tests:", () => {
        describe("method: runOrFail", () => {
            describe("CIRCUIT_BREAKER_TRIGGER.BOTH:", () => {
                test("Should call ICircuitBreakerAdapter.trackFailure when the function throws an error", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(
                                new UnexpectedErrorA("UNEXPECTED ERROR"),
                            );
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorA)) {
                            throw error;
                        }
                    }

                    expect(trackFailureSpy).toHaveBeenCalledOnce();
                });
                test("Should call ICircuitBreakerAdapter.trackFailure when the function exceedes the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await delay(slowCallTime.addMilliseconds(10));
                    });

                    expect(trackFailureSpy).toHaveBeenCalledOnce();
                });
                test("Should call ICircuitBreakerAdapter.trackSuccess when the function does not throw an error and does not exceed the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackSuccessSpy = vi
                        .spyOn(adapter, "trackSuccess")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    await circuitBreaker.runOrFail(async () => {});

                    expect(trackSuccessSpy).toHaveBeenCalledOnce();
                });
                test("Should not call ICircuitBreakerAdapter.trackFailure when given error doesnt match the error policy", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );

                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                        errorPolicy: UnexpectedErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(new UnexpectedErrorB());
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorB)) {
                            throw error;
                        }
                    }

                    expect(trackFailureSpy).not.toHaveBeenCalled();
                });
                test("Should throw OpenCircuitBreakerError when in OpenedState", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.OPEN,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(
                            new UnexpectedErrorA("UNEXPECTED ERROR"),
                        );
                    });
                    await expect(promise).rejects.toBeInstanceOf(
                        OpenCircuitBreakerError,
                    );
                });
                test("Should throw IsolatedCircuitBreakerError when in IsolatedState", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.ISOLATED,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(
                            new UnexpectedErrorA("UNEXPECTED ERROR"),
                        );
                    });
                    await expect(promise).rejects.toBeInstanceOf(
                        IsolatedCircuitBreakerError,
                    );
                });
            });
            describe("CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR:", () => {
                test("Should call ICircuitBreakerAdapter.trackFailure when the function throws an error", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(
                                new UnexpectedErrorA("UNEXPECTED ERROR"),
                            );
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorA)) {
                            throw error;
                        }
                    }

                    expect(trackFailureSpy).toHaveBeenCalledOnce();
                });
                test("Should not call ICircuitBreakerAdapter.trackFailure when the function exceedes the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackSuccess").mockImplementation(() =>
                        Promise.resolve(),
                    );
                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await delay(slowCallTime.addMilliseconds(10));
                    });

                    expect(trackFailureSpy).not.toHaveBeenCalled();
                });
                test("Should call ICircuitBreakerAdapter.trackSuccess when the function exceedes the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackSuccess").mockImplementation(() =>
                        Promise.resolve(),
                    );
                    const trackSuccessSpy = vi
                        .spyOn(adapter, "trackSuccess")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await delay(slowCallTime.addMilliseconds(10));
                    });

                    expect(trackSuccessSpy).toHaveBeenCalled();
                });
                test("Should call ICircuitBreakerAdapter.trackSuccess when the function does not throw an error", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackSuccessSpy = vi
                        .spyOn(adapter, "trackSuccess")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    await circuitBreaker.runOrFail(async () => {});

                    expect(trackSuccessSpy).toHaveBeenCalledOnce();
                });
                test("Should not call ICircuitBreakerAdapter.trackFailure when given error doesnt match the error policy", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );

                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                        errorPolicy: UnexpectedErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(new UnexpectedErrorB());
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorB)) {
                            throw error;
                        }
                    }

                    expect(trackFailureSpy).not.toHaveBeenCalled();
                });
                test("Should throw OpenCircuitBreakerError when in OpenedState", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.OPEN,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(
                            new UnexpectedErrorA("UNEXPECTED ERROR"),
                        );
                    });
                    await expect(promise).rejects.toBeInstanceOf(
                        OpenCircuitBreakerError,
                    );
                });
                test("Should throw IsolatedCircuitBreakerError when in IsolatedState", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.ISOLATED,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(
                            new UnexpectedErrorA("UNEXPECTED ERROR"),
                        );
                    });
                    await expect(promise).rejects.toBeInstanceOf(
                        IsolatedCircuitBreakerError,
                    );
                });
            });
            describe("CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL:", () => {
                test("Should not call ICircuitBreakerAdapter.trackFailure when the function throws an error", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(
                                new UnexpectedErrorA("UNEXPECTED ERROR"),
                            );
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorA)) {
                            throw error;
                        }
                    }

                    expect(trackFailureSpy).not.toHaveBeenCalled();
                });
                test("Should call ICircuitBreakerAdapter.trackFailure when the function exceedes the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await delay(slowCallTime.addMilliseconds(10));
                    });

                    expect(trackFailureSpy).toHaveBeenCalledOnce();
                });
                test("Should call ICircuitBreakerAdapter.trackSuccess when does not exceed the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackSuccessSpy = vi
                        .spyOn(adapter, "trackSuccess")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    await circuitBreaker.runOrFail(async () => {});

                    expect(trackSuccessSpy).toHaveBeenCalledOnce();
                });
                test("Should not call ICircuitBreakerAdapter.trackFailure when given error doesnt match the error policy", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );

                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                        errorPolicy: UnexpectedErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(new UnexpectedErrorB());
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorB)) {
                            throw error;
                        }
                    }

                    expect(trackFailureSpy).not.toHaveBeenCalled();
                });
                test("Should throw OpenCircuitBreakerError when in OpenedState", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.OPEN,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(
                            new UnexpectedErrorA("UNEXPECTED ERROR"),
                        );
                    });
                    await expect(promise).rejects.toBeInstanceOf(
                        OpenCircuitBreakerError,
                    );
                });
                test("Should throw IsolatedCircuitBreakerError when in IsolatedState", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.ISOLATED,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(
                            new UnexpectedErrorA("UNEXPECTED ERROR"),
                        );
                    });
                    await expect(promise).rejects.toBeInstanceOf(
                        IsolatedCircuitBreakerError,
                    );
                });
            });
        });
        describe("method: isolate", () => {
            test("Should call ICircuitBreakerAdapter.isolate", async () => {
                const isolateSpy = vi
                    .spyOn(adapter, "isolate")
                    .mockImplementation(() => Promise.resolve());

                const circuitBreaker = circuitBreakerFactory.create(KEY);

                await circuitBreaker.isolate();

                expect(isolateSpy).toHaveBeenCalledOnce();
            });
        });
        describe("method: reset", () => {
            test("Should call ICircuitBreakerAdapter.reset", async () => {
                const resetSpy = vi
                    .spyOn(adapter, "reset")
                    .mockImplementation(() => Promise.resolve());

                const circuitBreaker = circuitBreakerFactory.create(KEY);

                await circuitBreaker.reset();

                expect(resetSpy).toHaveBeenCalledOnce();
            });
        });
    });
    describe("Event tests:", () => {
        describe("method: runOrFail", () => {
            describe("trigger = CIRCUIT_BREAKER_TRIGGER.BOTH:", () => {
                test("Should dispatch TrackedFailureCircuitBreakerEvent when the function throws", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: TrackedFailureCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(
                                new UnexpectedErrorA("UNEXPECTED ERROR"),
                            );
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorA)) {
                            throw error;
                        }
                    }
                    await vi.waitFor(() => {
                        expect(handlerFn).toHaveBeenCalledOnce();
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                circuitBreaker: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as ICircuitBreakerStateMethods["getState"],
                                    key: circuitBreaker.key,
                                } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                                error: expect.any(Error),
                                type: CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE,
                            } satisfies EventWithType<
                                TrackedFailureCircuitBreakerEvent,
                                typeof CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE
                            >),
                        );
                    }, waitForSettings);
                });
                test("Should dispatch TrackedSlowCallCircuitBreakerEvent when the function exceedes the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: TrackedSlowCallCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_SLOW_CALL,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await delay(slowCallTime.addMilliseconds(25));
                    });

                    await vi.waitFor(() => {
                        expect(handlerFn).toHaveBeenCalledOnce();
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                circuitBreaker: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as ICircuitBreakerStateMethods["getState"],
                                    key: circuitBreaker.key,
                                } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                                type: CIRCUIT_BREAKER_EVENTS.TRACKED_SLOW_CALL,
                            } satisfies EventWithType<
                                TrackedSlowCallCircuitBreakerEvent,
                                typeof CIRCUIT_BREAKER_EVENTS.TRACKED_SLOW_CALL
                            >),
                        );
                    }, waitForSettings);
                });
                test("Should dispatch TrackedSuccessCircuitBreakerEvent when the function does not throw an error and does not exceed the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackSuccess").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: TrackedSuccessCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    await circuitBreaker.runOrFail(() => {});

                    await vi.waitFor(() => {
                        expect(handlerFn).toHaveBeenCalledOnce();
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                circuitBreaker: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as ICircuitBreakerStateMethods["getState"],
                                    key: circuitBreaker.key,
                                } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                                type: CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS,
                            } satisfies EventWithType<
                                TrackedSuccessCircuitBreakerEvent,
                                typeof CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS
                            >),
                        );
                    }, waitForSettings);
                });
                test("Should not dispatch TrackedFailureCircuitBreakerEvent when given error doesnt match the error policy", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackSuccess").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: TrackedFailureCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                        errorPolicy: UnexpectedErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            throw new UnexpectedErrorB();
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorB)) {
                            throw error;
                        }
                    }

                    await delay(eventDispatchWaitTime);
                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should dispatch UntrackedFailureCircuitBreakerEvent when given error doesnt match the error policy", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: UntrackedFailureCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.UNTRACKED_FAILURE,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                        errorPolicy: UnexpectedErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            throw new UnexpectedErrorB();
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorB)) {
                            throw error;
                        }
                    }
                    await vi.waitFor(() => {
                        expect(handlerFn).toHaveBeenCalled();
                    }, waitForSettings);
                });
            });
            describe("trigger = CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR:", () => {
                test("Should dispatch TrackedFailureCircuitBreakerEvent when the function throws", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: TrackedFailureCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(
                                new UnexpectedErrorA("UNEXPECTED ERROR"),
                            );
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorA)) {
                            throw error;
                        }
                    }
                    await vi.waitFor(() => {
                        expect(handlerFn).toHaveBeenCalledOnce();
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                circuitBreaker: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as ICircuitBreakerStateMethods["getState"],
                                    key: circuitBreaker.key,
                                } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                                error: expect.any(Error),
                                type: CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE,
                            } satisfies EventWithType<
                                TrackedFailureCircuitBreakerEvent,
                                typeof CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE
                            >),
                        );
                    }, waitForSettings);
                });
                test("Should not dispatch TrackedSlowCallCircuitBreakerEvent when the function exceedes the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackSuccess").mockImplementation(() =>
                        Promise.resolve(),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: TrackedSlowCallCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_SLOW_CALL,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await delay(slowCallTime.addMilliseconds(25));
                    });

                    await delay(eventDispatchWaitTime);
                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should dispatch TrackedSuccessCircuitBreakerEvent when the function does not throw", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackSuccess").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: TrackedSuccessCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    await circuitBreaker.runOrFail(() => {});

                    await vi.waitFor(() => {
                        expect(handlerFn).toHaveBeenCalledOnce();
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                circuitBreaker: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as ICircuitBreakerStateMethods["getState"],
                                    key: circuitBreaker.key,
                                } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                                type: CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS,
                            } satisfies EventWithType<
                                TrackedSuccessCircuitBreakerEvent,
                                typeof CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS
                            >),
                        );
                    }, waitForSettings);
                });
                test("Should dispatch TrackedSuccessCircuitBreakerEvent when the function does exceed the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackSuccess").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: TrackedSuccessCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await delay(slowCallTime.addMilliseconds(25));
                    });

                    await vi.waitFor(() => {
                        expect(handlerFn).toHaveBeenCalledOnce();
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                circuitBreaker: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as ICircuitBreakerStateMethods["getState"],
                                    key: circuitBreaker.key,
                                } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                                type: CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS,
                            } satisfies EventWithType<
                                TrackedSuccessCircuitBreakerEvent,
                                typeof CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS
                            >),
                        );
                    }, waitForSettings);
                });
                test("Should not dispatch TrackedFailureCircuitBreakerEvent when given error doesnt match the error policy", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackSuccess").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: TrackedFailureCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                        errorPolicy: UnexpectedErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            throw new UnexpectedErrorB();
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorB)) {
                            throw error;
                        }
                    }

                    await delay(eventDispatchWaitTime);
                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should dispatch UntrackedFailureCircuitBreakerEvent when given error doesnt match the error policy", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: UntrackedFailureCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.UNTRACKED_FAILURE,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                        errorPolicy: UnexpectedErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            throw new UnexpectedErrorB();
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorB)) {
                            throw error;
                        }
                    }
                    await vi.waitFor(() => {
                        expect(handlerFn).toHaveBeenCalled();
                    }, waitForSettings);
                });
            });
            describe("trigger = CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL:", () => {
                test("Should not dispatch TrackedFailureCircuitBreakerEvent when the function throws an error", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: TrackedFailureCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(
                                new UnexpectedErrorA("UNEXPECTED ERROR"),
                            );
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorA)) {
                            throw error;
                        }
                    }

                    await delay(eventDispatchWaitTime);
                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should dispatch TrackedSlowCallCircuitBreakerEvent when the function exceedes the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: TrackedSlowCallCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_SLOW_CALL,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await delay(slowCallTime.addMilliseconds(10));
                    });
                    await vi.waitFor(() => {
                        expect(handlerFn).toHaveBeenCalledOnce();
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                circuitBreaker: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as ICircuitBreakerStateMethods["getState"],
                                    key: circuitBreaker.key,
                                } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                                type: CIRCUIT_BREAKER_EVENTS.TRACKED_SLOW_CALL,
                            } satisfies EventWithType<
                                TrackedSlowCallCircuitBreakerEvent,
                                typeof CIRCUIT_BREAKER_EVENTS.TRACKED_SLOW_CALL
                            >),
                        );
                    }, waitForSettings);
                });
                test("Should dispatch TrackedSuccessCircuitBreakerEvent when does not exceed the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackSuccess").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: TrackedSuccessCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    await circuitBreaker.runOrFail(async () => {});
                    await vi.waitFor(() => {
                        expect(handlerFn).toHaveBeenCalledOnce();
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                circuitBreaker: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as ICircuitBreakerStateMethods["getState"],
                                    key: circuitBreaker.key,
                                } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                                type: CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS,
                            } satisfies EventWithType<
                                TrackedSuccessCircuitBreakerEvent,
                                typeof CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS
                            >),
                        );
                    }, waitForSettings);
                });
                test("Should not dispatch TrackedFailureCircuitBreakerEvent when given error doesnt match the error policy", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: TrackedFailureCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                        errorPolicy: UnexpectedErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(new UnexpectedErrorB());
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorB)) {
                            throw error;
                        }
                    }

                    await delay(eventDispatchWaitTime);
                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should not dispatch TrackedSuccessCircuitBreakerEvent when given error doesnt match the error policy", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: TrackedSuccessCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                        errorPolicy: UnexpectedErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(new UnexpectedErrorB());
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorB)) {
                            throw error;
                        }
                    }

                    await delay(eventDispatchWaitTime);
                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should not dispatch UntrackedFailureCircuitBreakerEvent when given error doesnt match the error policy", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const handlerFn = vi.fn(
                        (_event: UntrackedFailureCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerFactory.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.UNTRACKED_FAILURE,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                        errorPolicy: UnexpectedErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(new UnexpectedErrorB());
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorB)) {
                            throw error;
                        }
                    }

                    await delay(eventDispatchWaitTime);
                    expect(handlerFn).not.toHaveBeenCalled();
                });
            });
            test("Should dispatch StateTransitionCircuitBreakerEvent when state transition occures", async () => {
                vi.spyOn(adapter, "updateState").mockImplementation(() =>
                    Promise.resolve({
                        from: CIRCUIT_BREAKER_STATE.CLOSED,
                        to: CIRCUIT_BREAKER_STATE.OPEN,
                    }),
                );
                vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                    Promise.resolve(),
                );
                vi.spyOn(adapter, "trackSuccess").mockImplementation(() =>
                    Promise.resolve(),
                );

                const handlerFn = vi.fn(
                    (_event: StateTransitionCircuitBreakerEvent) => {},
                );
                await circuitBreakerFactory.events.addListener(
                    CIRCUIT_BREAKER_EVENTS.STATE_TRANSITIONED,
                    handlerFn,
                );
                const circuitBreaker = circuitBreakerFactory.create(KEY);
                try {
                    await circuitBreaker.runOrFail(() => {});
                } catch (error: unknown) {
                    if (!(error instanceof OpenCircuitBreakerError)) {
                        throw error;
                    }
                }

                await vi.waitFor(() => {
                    expect(handlerFn).toHaveBeenCalledOnce();
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            circuitBreaker: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ICircuitBreakerStateMethods["getState"],
                                key: circuitBreaker.key,
                            } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.OPEN,
                            type: CIRCUIT_BREAKER_EVENTS.STATE_TRANSITIONED,
                        } satisfies EventWithType<
                            StateTransitionCircuitBreakerEvent,
                            typeof CIRCUIT_BREAKER_EVENTS.STATE_TRANSITIONED
                        >),
                    );
                }, waitForSettings);
            });
        });
        describe("method: isolate", () => {
            test("Should call dispatch IsolatedCircuitBreakerEvent when isolate method is called", async () => {
                vi.spyOn(adapter, "isolate").mockImplementation(() =>
                    Promise.resolve(),
                );
                const handlerFn = vi.fn(() => {});
                await circuitBreakerFactory.events.addListener(
                    CIRCUIT_BREAKER_EVENTS.ISOLATED,
                    handlerFn,
                );

                const circuitBreaker = circuitBreakerFactory.create(KEY);
                await circuitBreaker.isolate();
                await vi.waitFor(() => {
                    expect(handlerFn).toHaveBeenCalledOnce();
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            circuitBreaker: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ICircuitBreakerStateMethods["getState"],
                                key: circuitBreaker.key,
                            } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                            type: CIRCUIT_BREAKER_EVENTS.ISOLATED,
                        } satisfies EventWithType<
                            IsolatedCircuitBreakerEvent,
                            typeof CIRCUIT_BREAKER_EVENTS.ISOLATED
                        >),
                    );
                }, waitForSettings);
            });
        });
        describe("method: reset", () => {
            test("Should call dispatch ResetedCircuitBreakerEvent when reset method is called", async () => {
                vi.spyOn(adapter, "reset").mockImplementation(() =>
                    Promise.resolve(),
                );
                const handlerFn = vi.fn(() => {});
                await circuitBreakerFactory.events.addListener(
                    CIRCUIT_BREAKER_EVENTS.RESETED,
                    handlerFn,
                );

                const circuitBreaker = circuitBreakerFactory.create(KEY);
                await circuitBreaker.reset();
                await vi.waitFor(() => {
                    expect(handlerFn).toHaveBeenCalledOnce();
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            circuitBreaker: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ICircuitBreakerStateMethods["getState"],
                                key: circuitBreaker.key,
                            } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                            type: CIRCUIT_BREAKER_EVENTS.RESETED,
                        } satisfies EventWithType<
                            ResetedCircuitBreakerEvent,
                            typeof CIRCUIT_BREAKER_EVENTS.RESETED
                        >),
                    );
                }, waitForSettings);
            });
        });
    });
    describe("Serde tests:", () => {
        test("Should differentiate between different namespaces", async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const key = "a";
            const circuitBreakerPolicy = new ConsecutiveBreaker({
                failureThreshold: 1,
                successThreshold: 1,
            });

            const circuitBreakerFactory1 = new CircuitBreakerFactory({
                adapter: new DatabaseCircuitBreakerAdapter({
                    adapter: new MemoryCircuitBreakerStorageAdapter(),
                    circuitBreakerPolicy,
                }),
                enableAsyncTracking: false,
                namespace: new Namespace("@circuit-breaker-1"),
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: new Namespace("@event-bus/circuit-breaker-1"),
                }),
                serde,
            });
            const circuitBreaker1 = circuitBreakerFactory1.create(key);
            try {
                await circuitBreaker1.runOrFail(() => {
                    return Promise.reject(
                        new UnexpectedErrorA("Unexpected error"),
                    );
                });
            } catch (error: unknown) {
                if (!(error instanceof UnexpectedErrorA)) {
                    throw error;
                }
            }

            const circuitBreakerFactory2 = new CircuitBreakerFactory({
                adapter: new DatabaseCircuitBreakerAdapter({
                    adapter: new MemoryCircuitBreakerStorageAdapter(),
                    circuitBreakerPolicy,
                }),
                enableAsyncTracking: false,
                namespace: new Namespace("@circuit-breaker-2"),
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: new Namespace("@event-bus/circuit-breaker-2"),
                }),
                serde,
            });
            const circuitBreaker2 = circuitBreakerFactory2.create(key);

            const deserializedCircuitBreaker2 =
                serde.deserialize<ICircuitBreaker>(
                    serde.serialize(circuitBreaker2),
                );
            const handler = vi.fn();
            await deserializedCircuitBreaker2.runOrFail(handler);
            expect(handler).toHaveBeenCalledOnce();
        });
        test("Should differentiate between different adapters that have same namespace", async () => {
            class WrapperCircuitBreakerAdapter
                implements ICircuitBreakerAdapter
            {
                constructor(
                    private readonly adapter_: ICircuitBreakerAdapter,
                ) {}

                getState(
                    context: IReadableContext,
                    key: string,
                ): Promise<CircuitBreakerState> {
                    return this.adapter_.getState(context, key);
                }
                updateState(
                    context: IReadableContext,
                    key: string,
                ): Promise<CircuitBreakerStateTransition> {
                    return this.adapter_.updateState(context, key);
                }
                isolate(context: IReadableContext, key: string): Promise<void> {
                    return this.adapter_.isolate(context, key);
                }
                trackFailure(
                    context: IReadableContext,
                    key: string,
                ): Promise<void> {
                    return this.adapter_.trackFailure(context, key);
                }
                trackSuccess(
                    context: IReadableContext,
                    key: string,
                ): Promise<void> {
                    return this.adapter_.trackSuccess(context, key);
                }
                reset(context: IReadableContext, key: string): Promise<void> {
                    return this.adapter_.reset(context, key);
                }
            }

            const serde = new Serde(new SuperJsonSerdeAdapter());
            const circuitBreakerNamespace = new Namespace("@circuit-breaker");
            const eventNamespace = new Namespace("@event-bus/circuit-breaker");
            const key = "a";
            const circuitBreakerPolicy = new ConsecutiveBreaker({
                failureThreshold: 1,
                successThreshold: 1,
            });

            const circuitBreakerFactory1 = new CircuitBreakerFactory({
                adapter: new WrapperCircuitBreakerAdapter(
                    new DatabaseCircuitBreakerAdapter({
                        adapter: new MemoryCircuitBreakerStorageAdapter(),
                        circuitBreakerPolicy,
                    }),
                ),
                enableAsyncTracking: false,
                namespace: circuitBreakerNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serde,
            });
            const circuitBreaker1 = circuitBreakerFactory1.create(key);
            try {
                await circuitBreaker1.runOrFail(() => {
                    return Promise.reject(
                        new UnexpectedErrorA("Unexpected error"),
                    );
                });
            } catch (error: unknown) {
                if (!(error instanceof UnexpectedErrorA)) {
                    throw error;
                }
            }

            const circuitBreakerFactory2 = new CircuitBreakerFactory({
                adapter: new DatabaseCircuitBreakerAdapter({
                    adapter: new MemoryCircuitBreakerStorageAdapter(),
                    circuitBreakerPolicy,
                }),
                enableAsyncTracking: false,
                namespace: circuitBreakerNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serde,
            });
            const circuitBreaker2 = circuitBreakerFactory2.create(key);

            const deserializedCircuitBreaker2 =
                serde.deserialize<ICircuitBreaker>(
                    serde.serialize(circuitBreaker2),
                );
            const handler = vi.fn();
            await deserializedCircuitBreaker2.runOrFail(handler);
            expect(handler).toHaveBeenCalledOnce();
        });
        test("Should differentiate between different serdeTransformerNames", async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const circuitBreakerNamespace = new Namespace("@circuit-breaker");
            const eventNamespace = new Namespace("@event-bus/circuit-breaker");
            const key = "a";
            const circuitBreakerPolicy = new ConsecutiveBreaker({
                failureThreshold: 1,
                successThreshold: 1,
            });

            const circuitBreakerFactory1 = new CircuitBreakerFactory({
                adapter: new DatabaseCircuitBreakerAdapter({
                    adapter: new MemoryCircuitBreakerStorageAdapter(),
                    circuitBreakerPolicy,
                }),
                enableAsyncTracking: false,
                namespace: circuitBreakerNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serdeTransformerName: "adapter1",
                serde,
            });
            const circuitBreaker1 = circuitBreakerFactory1.create(key);
            try {
                await circuitBreaker1.runOrFail(() => {
                    return Promise.reject(
                        new UnexpectedErrorA("Unexpected error"),
                    );
                });
            } catch (error: unknown) {
                if (!(error instanceof UnexpectedErrorA)) {
                    throw error;
                }
            }

            const circuitBreakerFactory2 = new CircuitBreakerFactory({
                adapter: new DatabaseCircuitBreakerAdapter({
                    adapter: new MemoryCircuitBreakerStorageAdapter(),
                    circuitBreakerPolicy,
                }),
                enableAsyncTracking: false,
                namespace: circuitBreakerNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serdeTransformerName: "adapter2",
                serde,
            });
            const circuitBreaker2 = circuitBreakerFactory2.create(key);

            const deserializedCircuitBreaker2 =
                serde.deserialize<ICircuitBreaker>(
                    serde.serialize(circuitBreaker2),
                );
            const handler = vi.fn();
            await deserializedCircuitBreaker2.runOrFail(handler);
            expect(handler).toHaveBeenCalledOnce();
        });
    });
});
