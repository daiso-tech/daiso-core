import { beforeEach, describe, expect, test, vi } from "vitest";

import {
    IsolatedCircuitBreakerError,
    OpenCircuitBreakerError,
    type CircuitBreakerStateTransition,
    type ICircuitBreakerAdapter,
    CIRCUIT_BREAKER_TRIGGER,
    type ICircuitBreakerFactory,
    CIRCUIT_BREAKER_STATE,
    type CircuitBreakerState,
    type ICircuitBreaker,
} from "@/circuit-breaker/contracts/_module.js";
import {
    DatabaseCircuitBreakerAdapter,
    MemoryCircuitBreakerStorageAdapter,
} from "@/circuit-breaker/implementations/adapters/_module.js";
import { CircuitBreakerFactory } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/circuit-breaker-factory.js";
import { ConsecutiveBreaker } from "@/circuit-breaker/implementations/policies/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
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

    let circuitBreakerFactory: ICircuitBreakerFactory;
    const slowCallTime = TimeSpan.fromMilliseconds(50);
    beforeEach(() => {
        vi.resetAllMocks();
        circuitBreakerFactory = new CircuitBreakerFactory({
            adapter,
            serde: new Serde(new SuperJsonSerdeAdapter()),
            defaultSlowCallTime: slowCallTime,
            enableAsyncTracking: false,
        });
    });

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
    describe("Serde tests:", () => {
        test("Should differentiate between different adapters", async () => {
            class WrapperCircuitBreakerAdapter implements ICircuitBreakerAdapter {
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
