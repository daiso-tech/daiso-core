import { beforeEach, describe, expect, test, vi } from "vitest";

import {
    IsolatedCircuitBreakerError,
    OpenCircuitBreakerError,
    type ICircuitBreakerStateMethods,
    type IsolatedCircuitBreakerEvent,
    type ResetedCircuitBreakerEvent,
} from "@/circuit-breaker/contracts/_module.js";
import {
    type CircuitBreakerStateTransition,
    type ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/circuit-breaker-adapter.contract.js";
import {
    CIRCUIT_BREAKER_TRIGGER,
    type ICircuitBreakerProvider,
} from "@/circuit-breaker/contracts/circuit-breaker-provider.contract.js";
import {
    CIRCUIT_BREAKER_STATE,
    type CircuitBreakerState,
} from "@/circuit-breaker/contracts/circuit-breaker-state.contract.js";
import {
    CIRCUIT_BREAKER_EVENTS,
    type StateTransitionCircuitBreakerEvent,
    type TrackedFailureCircuitBreakerEvent,
    type TrackedSlowCallCircuitBreakerEvent,
    type TrackedSuccessCircuitBreakerEvent,
    type UntrackedFailureCircuitBreakerEvent,
} from "@/circuit-breaker/contracts/circuit-breaker.events.js";
import { CircuitBreakerProvider } from "@/circuit-breaker/implementations/derivables/circuit-breaker-provider/circuit-breaker-provider.js";
import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/serde.js";
import { Task } from "@/task/implementations/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("class: CircuitBreakerProvider", () => {
    const adapter: ICircuitBreakerAdapter = {
        getState: function (_key: string): Promise<CircuitBreakerState> {
            throw new Error("Function not implemented.");
        },
        updateState: function (
            _key: string,
        ): Promise<CircuitBreakerStateTransition> {
            throw new Error("Function not implemented.");
        },
        isolate: function (_key: string): Promise<void> {
            throw new Error("Function not implemented.");
        },
        trackFailure: function (_key: string): Promise<void> {
            throw new Error("Function not implemented.");
        },
        trackSuccess: function (_key: string): Promise<void> {
            throw new Error("Function not implemented.");
        },
        reset: function (_key: string): Promise<void> {
            throw new Error("Function not implemented.");
        },
    };
    const KEY = "A";

    let circuitBreakerProvider: ICircuitBreakerProvider;
    const slowCallTime = TimeSpan.fromMilliseconds(50);
    beforeEach(() => {
        vi.resetAllMocks();
        circuitBreakerProvider = new CircuitBreakerProvider({
            adapter,
            eventBus: new EventBus({
                adapter: new MemoryEventBusAdapter(),
            }),
            serde: new Serde(new SuperJsonSerdeAdapter()),
            defaultSlowCallTime: slowCallTime,
            enableAsyncTracking: false,
        });
    });

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

                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(
                                new Error("UNEXPECTED ERROR"),
                            );
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(trackFailureSpy).toHaveBeenCalledOnce();
                });
                test("Should call ICircuitBreakerAdapter.trackFailure when the function exceedes the CircuitBreakerProviderSettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await Task.delay(slowCallTime.addMilliseconds(10));
                    });

                    expect(trackFailureSpy).toHaveBeenCalledOnce();
                });
                test("Should call ICircuitBreakerAdapter.trackSuccess when the function does not throw an error and does not exceed the CircuitBreakerProviderSettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackSuccessSpy = vi
                        .spyOn(adapter, "trackSuccess")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
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

                    class ErrorA extends Error {}
                    class ErrorB extends Error {}
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                        errorPolicy: ErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(new ErrorB());
                        });
                    } catch {
                        /* EMPTY */
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

                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(new Error("UNEXPECTED ERROR"));
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

                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(new Error("UNEXPECTED ERROR"));
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

                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(
                                new Error("UNEXPECTED ERROR"),
                            );
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(trackFailureSpy).toHaveBeenCalledOnce();
                });
                test("Should not call ICircuitBreakerAdapter.trackFailure when the function exceedes the CircuitBreakerProviderSettings.slowCallTime", async () => {
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

                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await Task.delay(slowCallTime.addMilliseconds(10));
                    });

                    expect(trackFailureSpy).not.toHaveBeenCalled();
                });
                test("Should call ICircuitBreakerAdapter.trackSuccess when the function exceedes the CircuitBreakerProviderSettings.slowCallTime", async () => {
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

                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await Task.delay(slowCallTime.addMilliseconds(10));
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

                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
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

                    class ErrorA extends Error {}
                    class ErrorB extends Error {}
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                        errorPolicy: ErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(new ErrorB());
                        });
                    } catch {
                        /* EMPTY */
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

                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(new Error("UNEXPECTED ERROR"));
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

                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(new Error("UNEXPECTED ERROR"));
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

                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(
                                new Error("UNEXPECTED ERROR"),
                            );
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(trackFailureSpy).not.toHaveBeenCalled();
                });
                test("Should call ICircuitBreakerAdapter.trackFailure when the function exceedes the CircuitBreakerProviderSettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await Task.delay(slowCallTime.addMilliseconds(10));
                    });

                    expect(trackFailureSpy).toHaveBeenCalledOnce();
                });
                test("Should call ICircuitBreakerAdapter.trackSuccess when does not exceed the CircuitBreakerProviderSettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackSuccessSpy = vi
                        .spyOn(adapter, "trackSuccess")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
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

                    class ErrorA extends Error {}
                    class ErrorB extends Error {}
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                        errorPolicy: ErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(new ErrorB());
                        });
                    } catch {
                        /* EMPTY */
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

                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(new Error("UNEXPECTED ERROR"));
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

                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(new Error("UNEXPECTED ERROR"));
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

                const circuitBreaker = circuitBreakerProvider.create(KEY);

                await circuitBreaker.isolate();

                expect(isolateSpy).toHaveBeenCalledOnce();
            });
        });
        describe("method: reset", () => {
            test("Should call ICircuitBreakerAdapter.reset", async () => {
                const resetSpy = vi
                    .spyOn(adapter, "reset")
                    .mockImplementation(() => Promise.resolve());

                const circuitBreaker = circuitBreakerProvider.create(KEY);

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
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(
                                new Error("UNEXPECTED ERROR"),
                            );
                        });
                    } catch {
                        /* EMPTY */
                    }

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
                        } satisfies TrackedFailureCircuitBreakerEvent),
                    );
                });
                test("Should dispatch TrackedSlowCallCircuitBreakerEvent when the function exceedes the CircuitBreakerProviderSettings.slowCallTime", async () => {
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
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_SLOW_CALL,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    try {
                        await circuitBreaker.runOrFail(async () => {
                            await Task.delay(slowCallTime.addMilliseconds(25));
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledOnce();
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            circuitBreaker: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ICircuitBreakerStateMethods["getState"],
                                key: circuitBreaker.key,
                            } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                        } satisfies TrackedSlowCallCircuitBreakerEvent),
                    );
                });
                test("Should dispatch TrackedSuccessCircuitBreakerEvent when the function does not throw an error and does not exceed the CircuitBreakerProviderSettings.slowCallTime", async () => {
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
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {});
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledOnce();
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            circuitBreaker: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ICircuitBreakerStateMethods["getState"],
                                key: circuitBreaker.key,
                            } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                        } satisfies TrackedSuccessCircuitBreakerEvent),
                    );
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
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE,
                        handlerFn,
                    );
                    class ErrorA extends Error {}
                    class ErrorB extends Error {}
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                        errorPolicy: ErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            throw new ErrorB();
                        });
                    } catch {
                        /* EMPTY */
                    }

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
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.UNTRACKED_FAILURE,
                        handlerFn,
                    );
                    class ErrorA extends Error {}
                    class ErrorB extends Error {}
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                        errorPolicy: ErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            throw new ErrorB();
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalled();
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
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(
                                new Error("UNEXPECTED ERROR"),
                            );
                        });
                    } catch {
                        /* EMPTY */
                    }

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
                        } satisfies TrackedFailureCircuitBreakerEvent),
                    );
                });
                test("Should not dispatch TrackedSlowCallCircuitBreakerEvent when the function exceedes the CircuitBreakerProviderSettings.slowCallTime", async () => {
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
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_SLOW_CALL,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    try {
                        await circuitBreaker.runOrFail(async () => {
                            await Task.delay(slowCallTime.addMilliseconds(25));
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).not.toHaveBeenCalledOnce();
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
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {});
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledOnce();
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            circuitBreaker: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ICircuitBreakerStateMethods["getState"],
                                key: circuitBreaker.key,
                            } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                        } satisfies TrackedSlowCallCircuitBreakerEvent),
                    );
                });
                test("Should dispatch TrackedSuccessCircuitBreakerEvent when the function does exceed the CircuitBreakerProviderSettings.slowCallTime", async () => {
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
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    try {
                        await circuitBreaker.runOrFail(async () => {
                            await Task.delay(slowCallTime.addMilliseconds(25));
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledOnce();
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            circuitBreaker: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ICircuitBreakerStateMethods["getState"],
                                key: circuitBreaker.key,
                            } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                        } satisfies TrackedSuccessCircuitBreakerEvent),
                    );
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
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE,
                        handlerFn,
                    );
                    class ErrorA extends Error {}
                    class ErrorB extends Error {}
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                        errorPolicy: ErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            throw new ErrorB();
                        });
                    } catch {
                        /* EMPTY */
                    }

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
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.UNTRACKED_FAILURE,
                        handlerFn,
                    );
                    class ErrorA extends Error {}
                    class ErrorB extends Error {}
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                        errorPolicy: ErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            throw new ErrorB();
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalled();
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
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(
                                new Error("UNEXPECTED ERROR"),
                            );
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should dispatch TrackedSlowCallCircuitBreakerEvent when the function exceedes the CircuitBreakerProviderSettings.slowCallTime", async () => {
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
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_SLOW_CALL,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await Task.delay(slowCallTime.addMilliseconds(10));
                    });

                    expect(handlerFn).toHaveBeenCalledOnce();
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            circuitBreaker: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ICircuitBreakerStateMethods["getState"],
                                key: circuitBreaker.key,
                            } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                        } satisfies TrackedSlowCallCircuitBreakerEvent),
                    );
                });
                test("Should dispatch TrackedSuccessCircuitBreakerEvent when does not exceed the CircuitBreakerProviderSettings.slowCallTime", async () => {
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
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    await circuitBreaker.runOrFail(async () => {});

                    expect(handlerFn).toHaveBeenCalledOnce();
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            circuitBreaker: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ICircuitBreakerStateMethods["getState"],
                                key: circuitBreaker.key,
                            } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                        } satisfies TrackedSuccessCircuitBreakerEvent),
                    );
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

                    class ErrorA extends Error {}
                    class ErrorB extends Error {}
                    const handlerFn = vi.fn(
                        (_event: TrackedFailureCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_FAILURE,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                        errorPolicy: ErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(new ErrorB());
                        });
                    } catch {
                        /* EMPTY */
                    }

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

                    class ErrorA extends Error {}
                    class ErrorB extends Error {}
                    const handlerFn = vi.fn(
                        (_event: TrackedSuccessCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.TRACKED_SUCCESS,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                        errorPolicy: ErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(new ErrorB());
                        });
                    } catch {
                        /* EMPTY */
                    }

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

                    class ErrorA extends Error {}
                    class ErrorB extends Error {}
                    const handlerFn = vi.fn(
                        (_event: UntrackedFailureCircuitBreakerEvent) => {},
                    );
                    await circuitBreakerProvider.events.addListener(
                        CIRCUIT_BREAKER_EVENTS.UNTRACKED_FAILURE,
                        handlerFn,
                    );
                    const circuitBreaker = circuitBreakerProvider.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                        errorPolicy: ErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(new ErrorB());
                        });
                    } catch {
                        /* EMPTY */
                    }

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
                await circuitBreakerProvider.events.addListener(
                    CIRCUIT_BREAKER_EVENTS.STATE_TRANSITIONED,
                    handlerFn,
                );
                const circuitBreaker = circuitBreakerProvider.create(KEY);
                try {
                    await circuitBreaker.runOrFail(() => {});
                } catch {
                    /* EMPTY */
                }

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
                    } satisfies StateTransitionCircuitBreakerEvent),
                );
            });
        });
        describe("method: isolate", () => {
            test("Should call dispatch IsolatedCircuitBreakerEvent when isolate method is called", async () => {
                vi.spyOn(adapter, "isolate").mockImplementation(() =>
                    Promise.resolve(),
                );
                const handlerFn = vi.fn(() => {});
                await circuitBreakerProvider.events.addListener(
                    CIRCUIT_BREAKER_EVENTS.ISOLATED,
                    handlerFn,
                );

                const circuitBreaker = circuitBreakerProvider.create(KEY);
                await circuitBreaker.isolate();

                expect(handlerFn).toHaveBeenCalledOnce();
                expect(handlerFn).toHaveBeenCalledWith(
                    expect.objectContaining({
                        circuitBreaker: expect.objectContaining({
                            getState: expect.any(
                                Function,
                            ) as ICircuitBreakerStateMethods["getState"],
                            key: circuitBreaker.key,
                        } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                    } satisfies IsolatedCircuitBreakerEvent),
                );
            });
        });
        describe("method: reset", () => {
            test("Should call dispatch ResetedCircuitBreakerEvent when reset method is called", async () => {
                vi.spyOn(adapter, "reset").mockImplementation(() =>
                    Promise.resolve(),
                );
                const handlerFn = vi.fn(() => {});
                await circuitBreakerProvider.events.addListener(
                    CIRCUIT_BREAKER_EVENTS.RESETED,
                    handlerFn,
                );

                const circuitBreaker = circuitBreakerProvider.create(KEY);
                await circuitBreaker.reset();

                expect(handlerFn).toHaveBeenCalledOnce();
                expect(handlerFn).toHaveBeenCalledWith(
                    expect.objectContaining({
                        circuitBreaker: expect.objectContaining({
                            getState: expect.any(
                                Function,
                            ) as ICircuitBreakerStateMethods["getState"],
                            key: circuitBreaker.key,
                        } satisfies ICircuitBreakerStateMethods) as ICircuitBreakerStateMethods,
                    } satisfies ResetedCircuitBreakerEvent),
                );
            });
        });
    });
    describe("Serde tests:", () => {
        test.todo("Write tests!!!");
    });
});
