import { beforeEach, describe, expect, test, vi } from "vitest";

import { type EventWithType } from "@/event-bus/contracts/_module.js";
import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { Namespace } from "@/namespace/implementations/_module.js";
import {
    BlockedRateLimiterError,
    RATE_LIMITER_EVENTS,
    RATE_LIMITER_STATE,
    type AllowedRateLimiterEvent,
    type BlockedRateLimiterEvent,
    type IRateLimiterFactory,
    type IRateLimiterStateMethods,
    type RateLimiterExpiredState,
    type ResetedRateLimiterEvent,
    type TrackedFailureRateLimiterEvent,
    type UntrackedFailureRateLimiterEvent,
    type IRateLimiterAdapter,
    type IRateLimiterAdapterState,
    type RateLimiterAllowedState,
    type RateLimiterBlockedState,
    type IRateLimiter,
} from "@/rate-limiter/contracts/_module.js";
import {
    DatabaseRateLimiterAdapter,
    MemoryRateLimiterStorageAdapter,
} from "@/rate-limiter/implementations/adapters/_module.js";
import { RateLimiterFactory } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter-factory.js";
import { FixedWindowLimiter } from "@/rate-limiter/implementations/policies/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay } from "@/utilities/_module.js";

describe("class: RateLimiterFactory", () => {
    const adapter: IRateLimiterAdapter = {
        getState: function (
            _context: IReadableContext,
            _key: string,
        ): Promise<IRateLimiterAdapterState | null> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
        updateState: function (
            _context: IReadableContext,
            _key: string,
            _limit: number,
        ): Promise<IRateLimiterAdapterState> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
        reset: function (
            _context: IReadableContext,
            _key: string,
        ): Promise<void> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
    };
    const KEY = "a";
    const eventDispatchWaitTime = TimeSpan.fromMilliseconds(10);

    const waitForSettings = {
        interval: TimeSpan.fromTimeSpan(eventDispatchWaitTime).toMilliseconds(),
        timeout: TimeSpan.fromTimeSpan(eventDispatchWaitTime)
            .multiply(3)
            .toMilliseconds(),
    };
    class UnexpectedErrorA extends Error {}
    class UnexpectedErrorB extends Error {}

    let rateLimiterFactory: IRateLimiterFactory;
    beforeEach(() => {
        vi.resetAllMocks();
        rateLimiterFactory = new RateLimiterFactory({
            adapter,
            eventBus: new EventBus({
                adapter: new MemoryEventBusAdapter(),
            }),
            // serde: new Serde(new SuperJsonSerdeAdapter()),
            enableAsyncTracking: false,
        });
    });

    describe("API tests:", () => {
        describe("method: runOrFail", () => {
            describe("onlyError = true", () => {
                test("Should call IRateLimiterAdapter.updateState when the function throws an error", async () => {
                    const state: IRateLimiterAdapterState = {
                        success: true,
                        attempt: 1,
                        resetTime: TimeSpan.fromMilliseconds(1),
                    };
                    const updateStateSpy = vi
                        .spyOn(adapter, "updateState")
                        .mockImplementation(() => Promise.resolve(state));
                    vi.spyOn(adapter, "getState").mockImplementation(() =>
                        Promise.resolve(state),
                    );

                    try {
                        await rateLimiterFactory
                            .create(KEY, {
                                limit: 5,
                                onlyError: true,
                            })
                            .runOrFail(() => {
                                throw new UnexpectedErrorA("Unexpected error");
                            });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorA)) {
                            throw error;
                        }
                    }

                    expect(updateStateSpy).toHaveBeenCalledOnce();
                });
                test("Should not call IRateLimiterAdapter.updateState when the function does not throw an error", async () => {
                    const state: IRateLimiterAdapterState = {
                        success: true,
                        attempt: 1,
                        resetTime: TimeSpan.fromMilliseconds(1),
                    };
                    const updateStateSpy = vi
                        .spyOn(adapter, "updateState")
                        .mockImplementation(() => Promise.resolve(state));
                    vi.spyOn(adapter, "getState").mockImplementation(() =>
                        Promise.resolve(state),
                    );

                    await rateLimiterFactory
                        .create(KEY, {
                            limit: 5,
                            onlyError: true,
                        })
                        .runOrFail(() => {});

                    expect(updateStateSpy).not.toHaveBeenCalled();
                });
                test("Should call IRateLimiterAdapter.getState when the function throws an error", async () => {
                    const state: IRateLimiterAdapterState = {
                        success: true,
                        attempt: 1,
                        resetTime: TimeSpan.fromMilliseconds(1),
                    };
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve(state),
                    );
                    const getStateSpy = vi
                        .spyOn(adapter, "getState")
                        .mockImplementation(() => Promise.resolve(state));

                    try {
                        await rateLimiterFactory
                            .create(KEY, {
                                limit: 5,
                                onlyError: true,
                            })
                            .runOrFail(() => {
                                throw new UnexpectedErrorA("Unexpected error");
                            });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorA)) {
                            throw error;
                        }
                    }

                    expect(getStateSpy).toHaveBeenCalledOnce();
                });
                test("Should call IRateLimiterAdapter.getState when the function does not throw an error", async () => {
                    const state: IRateLimiterAdapterState = {
                        success: true,
                        attempt: 1,
                        resetTime: TimeSpan.fromMilliseconds(1),
                    };
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve(state),
                    );
                    const getStateSpy = vi
                        .spyOn(adapter, "getState")
                        .mockImplementation(() => Promise.resolve(state));

                    await rateLimiterFactory
                        .create(KEY, {
                            limit: 5,
                            onlyError: true,
                        })
                        .runOrFail(() => {});

                    expect(getStateSpy).toHaveBeenCalledOnce();
                });
                test("Should throw BlockedRateLimiterError when in limit is reached", async () => {
                    const state: IRateLimiterAdapterState = {
                        success: false,
                        attempt: 1,
                        resetTime: TimeSpan.fromMinutes(5),
                    };
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve(state),
                    );
                    vi.spyOn(adapter, "getState").mockImplementation(() =>
                        Promise.resolve(state),
                    );

                    const rateLimiter = rateLimiterFactory.create(KEY, {
                        limit: 5,
                        onlyError: true,
                    });
                    const promise = rateLimiter.runOrFail(() => {
                        return Promise.reject(
                            new UnexpectedErrorA("UNEXPECTED ERROR"),
                        );
                    });
                    await expect(promise).rejects.toBeInstanceOf(
                        BlockedRateLimiterError,
                    );
                });
            });
            describe("onlyError = false", () => {
                test("Should call IRateLimiterAdapter.updateState when the function throws an error", async () => {
                    const state: IRateLimiterAdapterState = {
                        success: true,
                        attempt: 1,
                        resetTime: TimeSpan.fromMilliseconds(1),
                    };
                    const updateStateSpy = vi
                        .spyOn(adapter, "updateState")
                        .mockImplementation(() => Promise.resolve(state));
                    vi.spyOn(adapter, "getState").mockImplementation(() =>
                        Promise.resolve(state),
                    );

                    try {
                        await rateLimiterFactory
                            .create(KEY, {
                                limit: 5,
                                onlyError: false,
                            })
                            .runOrFail(() => {
                                throw new UnexpectedErrorA("Unexpected error");
                            });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorA)) {
                            throw error;
                        }
                    }

                    expect(updateStateSpy).toHaveBeenCalledOnce();
                });
                test("Should call IRateLimiterAdapter.updateState when the function does not throw an error", async () => {
                    const state: IRateLimiterAdapterState = {
                        success: true,
                        attempt: 1,
                        resetTime: TimeSpan.fromMilliseconds(1),
                    };
                    const updateStateSpy = vi
                        .spyOn(adapter, "updateState")
                        .mockImplementation(() => Promise.resolve(state));
                    vi.spyOn(adapter, "getState").mockImplementation(() =>
                        Promise.resolve(state),
                    );

                    await rateLimiterFactory
                        .create(KEY, {
                            limit: 5,
                            onlyError: false,
                        })
                        .runOrFail(() => {});

                    expect(updateStateSpy).toHaveBeenCalledOnce();
                });
                test("Should not call IRateLimiterAdapter.getState when the function throws an error", async () => {
                    const state: IRateLimiterAdapterState = {
                        success: true,
                        attempt: 1,
                        resetTime: TimeSpan.fromMilliseconds(1),
                    };
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve(state),
                    );
                    const getStateSpy = vi
                        .spyOn(adapter, "getState")
                        .mockImplementation(() => Promise.resolve(state));

                    try {
                        await rateLimiterFactory
                            .create(KEY, {
                                limit: 5,
                                onlyError: false,
                            })
                            .runOrFail(() => {
                                throw new UnexpectedErrorA("Unexpected error");
                            });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorA)) {
                            throw error;
                        }
                    }

                    expect(getStateSpy).not.toHaveBeenCalled();
                });
                test("Should not call IRateLimiterAdapter.getState when the function does not throw an error", async () => {
                    const state: IRateLimiterAdapterState = {
                        success: true,
                        attempt: 1,
                        resetTime: TimeSpan.fromMilliseconds(1),
                    };
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve(state),
                    );
                    const getStateSpy = vi
                        .spyOn(adapter, "getState")
                        .mockImplementation(() => Promise.resolve(state));

                    await rateLimiterFactory
                        .create(KEY, {
                            limit: 5,
                            onlyError: false,
                        })
                        .runOrFail(() => {});

                    expect(getStateSpy).not.toHaveBeenCalled();
                });
                test("Should throw BlockedRateLimiterError when in limit is reached", async () => {
                    const state: IRateLimiterAdapterState = {
                        success: false,
                        attempt: 1,
                        resetTime: TimeSpan.fromMinutes(5),
                    };
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve(state),
                    );

                    const rateLimiter = rateLimiterFactory.create(KEY, {
                        limit: 5,
                        onlyError: false,
                    });
                    const promise = rateLimiter.runOrFail(() => {
                        return Promise.reject(
                            new UnexpectedErrorA("UNEXPECTED ERROR"),
                        );
                    });
                    await expect(promise).rejects.toBeInstanceOf(
                        BlockedRateLimiterError,
                    );
                });
            });
        });
        describe("method: reset", () => {
            test("Should call IRateLimiterAdapter.reset", async () => {
                const resetSpy = vi
                    .spyOn(adapter, "reset")
                    .mockImplementation(() => Promise.resolve());

                const rateLimiter = rateLimiterFactory.create(KEY, {
                    limit: 10,
                });

                await rateLimiter.reset();

                expect(resetSpy).toHaveBeenCalledOnce();
            });
        });
        describe("method: getState", () => {
            test("Should call IRateLimiterAdapter.getState", async () => {
                const getStateSpy = vi
                    .spyOn(adapter, "getState")
                    .mockImplementation(() => Promise.resolve(null));

                const rateLimiter = rateLimiterFactory.create(KEY, {
                    limit: 10,
                });

                await rateLimiter.getState();

                expect(getStateSpy).toHaveBeenCalledOnce();
            });
            test("Should return RateLimiterExpiredState when IRateLimiterAdapter.getState returns null", async () => {
                vi.spyOn(adapter, "getState").mockImplementation(() =>
                    Promise.resolve(null),
                );

                const rateLimiter = rateLimiterFactory.create(KEY, {
                    limit: 10,
                });

                const state = await rateLimiter.getState();

                expect(state).toEqual({
                    type: RATE_LIMITER_STATE.EXPIRED,
                } satisfies RateLimiterExpiredState);
            });
            test("Should return RateLimiterAllowedState when IRateLimiterAdapter.getState returns success state", async () => {
                const limit = 5;
                const resetTime = TimeSpan.fromMilliseconds(1);
                const attempt = 1;
                vi.spyOn(adapter, "getState").mockImplementation(() =>
                    Promise.resolve({
                        success: true,
                        attempt,
                        resetTime,
                    } satisfies IRateLimiterAdapterState),
                );

                const rateLimiter = rateLimiterFactory.create(KEY, {
                    limit,
                });

                const state = await rateLimiter.getState();

                expect(state).toEqual({
                    type: RATE_LIMITER_STATE.ALLOWED,
                    usedAttempts: attempt,
                    remainingAttempts: limit - attempt,
                    limit,
                    resetAfter: resetTime,
                } satisfies RateLimiterAllowedState);
            });
            test("Should return RateLimiterBlockedState when IRateLimiterAdapter.getState returns failure state", async () => {
                const limit = 5;
                const resetTime = TimeSpan.fromMilliseconds(1);
                const attempt = 6;
                vi.spyOn(adapter, "getState").mockImplementation(() =>
                    Promise.resolve({
                        success: false,
                        attempt,
                        resetTime,
                    } satisfies IRateLimiterAdapterState),
                );

                const rateLimiter = rateLimiterFactory.create(KEY, {
                    limit,
                });

                const state = await rateLimiter.getState();

                expect(state).toEqual({
                    type: RATE_LIMITER_STATE.BLOCKED,
                    limit,
                    retryAfter: resetTime,
                    totalAttempts: attempt,
                    exceedAttempts: attempt - limit,
                } satisfies RateLimiterBlockedState);
            });
        });
    });
    describe("Event tests:", () => {
        describe("method: runOrFail", () => {
            describe("onlyError = true", () => {
                test("Should dispatch TrackedFailureRateLimiterEvent when the function throws", async () => {
                    const state: IRateLimiterAdapterState = {
                        success: true,
                        attempt: 1,
                        resetTime: TimeSpan.fromMilliseconds(1),
                    };
                    vi.spyOn(adapter, "getState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });
                    vi.spyOn(adapter, "updateState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });

                    const handlerFn = vi.fn(
                        (_event: TrackedFailureRateLimiterEvent) => {},
                    );
                    await rateLimiterFactory.events.addListener(
                        RATE_LIMITER_EVENTS.TRACKED_FAILURE,
                        handlerFn,
                    );

                    const limit = 5;
                    const rateLimiter = rateLimiterFactory.create(KEY, {
                        limit,
                        onlyError: true,
                    });
                    try {
                        await rateLimiter.runOrFail(() => {
                            throw new UnexpectedErrorA("Unexpected error");
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
                                rateLimiter: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as IRateLimiterStateMethods["getState"],
                                    key: rateLimiter.key,
                                    limit,
                                } satisfies IRateLimiterStateMethods) as IRateLimiterStateMethods,
                                error: expect.any(UnexpectedErrorA),
                                type: RATE_LIMITER_EVENTS.TRACKED_FAILURE,
                            } satisfies EventWithType<
                                TrackedFailureRateLimiterEvent,
                                typeof RATE_LIMITER_EVENTS.TRACKED_FAILURE
                            >),
                        );
                    }, waitForSettings);
                });
                test("Should not dispatch TrackedFailureRateLimiterEvent when given error doesnt match the error policy", async () => {
                    const state: IRateLimiterAdapterState = {
                        success: true,
                        attempt: 1,
                        resetTime: TimeSpan.fromMilliseconds(1),
                    };
                    vi.spyOn(adapter, "getState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });
                    vi.spyOn(adapter, "updateState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });

                    const handlerFn = vi.fn(
                        (_event: TrackedFailureRateLimiterEvent) => {},
                    );
                    await rateLimiterFactory.events.addListener(
                        RATE_LIMITER_EVENTS.TRACKED_FAILURE,
                        handlerFn,
                    );

                    try {
                        await rateLimiterFactory
                            .create(KEY, {
                                limit: 5,
                                onlyError: true,
                                errorPolicy: UnexpectedErrorA,
                            })
                            .runOrFail(() => {
                                throw new UnexpectedErrorB("Unexpected error");
                            });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorB)) {
                            throw error;
                        }
                    }

                    await delay(eventDispatchWaitTime);
                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should dispatch UntrackedFailureRateLimiterEvent when given error doesnt match the error policy", async () => {
                    const state: IRateLimiterAdapterState = {
                        success: true,
                        attempt: 1,
                        resetTime: TimeSpan.fromMilliseconds(1),
                    };
                    vi.spyOn(adapter, "getState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });
                    vi.spyOn(adapter, "updateState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });

                    const handlerFn = vi.fn(
                        (_event: UntrackedFailureRateLimiterEvent) => {},
                    );
                    await rateLimiterFactory.events.addListener(
                        RATE_LIMITER_EVENTS.UNTRACKED_FAILURE,
                        handlerFn,
                    );

                    const limit = 5;
                    const rateLimiter = rateLimiterFactory.create(KEY, {
                        limit,
                        onlyError: true,
                        errorPolicy: UnexpectedErrorA,
                    });
                    try {
                        await rateLimiter.runOrFail(() => {
                            throw new UnexpectedErrorB("Unexpected error");
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorB)) {
                            throw error;
                        }
                    }
                    await vi.waitFor(() => {
                        expect(handlerFn).toHaveBeenCalledOnce();
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                rateLimiter: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as IRateLimiterStateMethods["getState"],
                                    key: rateLimiter.key,
                                    limit,
                                } satisfies IRateLimiterStateMethods) as IRateLimiterStateMethods,
                                error: expect.any(UnexpectedErrorB),
                                type: RATE_LIMITER_EVENTS.UNTRACKED_FAILURE,
                            } satisfies EventWithType<
                                UntrackedFailureRateLimiterEvent,
                                typeof RATE_LIMITER_EVENTS.UNTRACKED_FAILURE
                            >),
                        );
                    }, waitForSettings);
                });
                test("Should dispatch AllowedRateLimiterEvent when limit is not reached by error", async () => {
                    const limit = 5;
                    const state: IRateLimiterAdapterState = {
                        success: true,
                        attempt: limit,
                        resetTime: TimeSpan.fromMilliseconds(1),
                    };
                    vi.spyOn(adapter, "getState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });
                    vi.spyOn(adapter, "updateState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });

                    const handlerFn = vi.fn(
                        (_event: AllowedRateLimiterEvent) => {},
                    );
                    await rateLimiterFactory.events.addListener(
                        RATE_LIMITER_EVENTS.ALLOWED,
                        handlerFn,
                    );

                    const rateLimiter = rateLimiterFactory.create(KEY, {
                        limit,
                        onlyError: true,
                    });
                    try {
                        await rateLimiter.runOrFail(() => {
                            throw new UnexpectedErrorA("Unexpected error");
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
                                rateLimiter: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as IRateLimiterStateMethods["getState"],
                                    key: rateLimiter.key,
                                    limit,
                                } satisfies IRateLimiterStateMethods) as IRateLimiterStateMethods,
                                type: RATE_LIMITER_EVENTS.ALLOWED,
                            } satisfies EventWithType<
                                AllowedRateLimiterEvent,
                                typeof RATE_LIMITER_EVENTS.ALLOWED
                            >),
                        );
                    }, waitForSettings);
                });
                test("Should dispatch BlockedRateLimiterEvent when limit is reached by error", async () => {
                    const limit = 5;
                    const state: IRateLimiterAdapterState = {
                        success: false,
                        attempt: limit,
                        resetTime: TimeSpan.fromMinutes(1),
                    };
                    vi.spyOn(adapter, "getState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });
                    vi.spyOn(adapter, "updateState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });

                    const handlerFn = vi.fn(
                        (_event: BlockedRateLimiterEvent) => {},
                    );
                    await rateLimiterFactory.events.addListener(
                        RATE_LIMITER_EVENTS.BLOCKED,
                        handlerFn,
                    );

                    const rateLimiter = rateLimiterFactory.create(KEY, {
                        limit,
                        onlyError: true,
                    });
                    try {
                        await rateLimiter.runOrFail(() => {
                            throw new UnexpectedErrorA("Unexpected error");
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
                                rateLimiter: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as IRateLimiterStateMethods["getState"],
                                    key: rateLimiter.key,
                                    limit,
                                } satisfies IRateLimiterStateMethods) as IRateLimiterStateMethods,
                                type: RATE_LIMITER_EVENTS.BLOCKED,
                            } satisfies EventWithType<
                                BlockedRateLimiterEvent,
                                typeof RATE_LIMITER_EVENTS.BLOCKED
                            >),
                        );
                    }, waitForSettings);
                });
                test("Should dispatch AllowedRateLimiterEvent when limit is reached by function call", async () => {
                    const limit = 5;
                    const state: IRateLimiterAdapterState = {
                        success: true,
                        attempt: limit,
                        resetTime: TimeSpan.fromMinutes(1),
                    };
                    vi.spyOn(adapter, "getState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });
                    vi.spyOn(adapter, "updateState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });

                    const handlerFn = vi.fn(
                        (_event: AllowedRateLimiterEvent) => {},
                    );
                    await rateLimiterFactory.events.addListener(
                        RATE_LIMITER_EVENTS.ALLOWED,
                        handlerFn,
                    );

                    const rateLimiter = rateLimiterFactory.create(KEY, {
                        limit,
                        onlyError: true,
                    });
                    await rateLimiter.runOrFail(() => {});
                    await vi.waitFor(() => {
                        expect(handlerFn).toHaveBeenCalledOnce();
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                rateLimiter: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as IRateLimiterStateMethods["getState"],
                                    key: rateLimiter.key,
                                    limit,
                                } satisfies IRateLimiterStateMethods) as IRateLimiterStateMethods,
                                type: RATE_LIMITER_EVENTS.ALLOWED,
                            } satisfies EventWithType<
                                AllowedRateLimiterEvent,
                                typeof RATE_LIMITER_EVENTS.ALLOWED
                            >),
                        );
                    }, waitForSettings);
                });
            });
            describe("onlyError = false", () => {
                test("Should dispatch AllowedRateLimiterEvent when limit is not reached by error", async () => {
                    const limit = 5;
                    const state: IRateLimiterAdapterState = {
                        success: true,
                        attempt: limit - 2,
                        resetTime: TimeSpan.fromMilliseconds(1),
                    };
                    vi.spyOn(adapter, "getState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });
                    vi.spyOn(adapter, "updateState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });

                    const handlerFn = vi.fn(
                        (_event: AllowedRateLimiterEvent) => {},
                    );
                    await rateLimiterFactory.events.addListener(
                        RATE_LIMITER_EVENTS.ALLOWED,
                        handlerFn,
                    );

                    const rateLimiter = rateLimiterFactory.create(KEY, {
                        limit,
                        onlyError: false,
                    });
                    try {
                        await rateLimiter.runOrFail(() => {
                            throw new UnexpectedErrorA("Unexpected error");
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
                                rateLimiter: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as IRateLimiterStateMethods["getState"],
                                    key: rateLimiter.key,
                                    limit,
                                } satisfies IRateLimiterStateMethods) as IRateLimiterStateMethods,
                                type: RATE_LIMITER_EVENTS.ALLOWED,
                            } satisfies EventWithType<
                                AllowedRateLimiterEvent,
                                typeof RATE_LIMITER_EVENTS.ALLOWED
                            >),
                        );
                    }, waitForSettings);
                });
                test("Should dispatch BlockedRateLimiterEvent when limit is reached by error", async () => {
                    const limit = 5;
                    const state: IRateLimiterAdapterState = {
                        success: false,
                        attempt: limit,
                        resetTime: TimeSpan.fromMinutes(1),
                    };
                    vi.spyOn(adapter, "getState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });
                    vi.spyOn(adapter, "updateState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });

                    const handlerFn = vi.fn(
                        (_event: BlockedRateLimiterEvent) => {},
                    );
                    await rateLimiterFactory.events.addListener(
                        RATE_LIMITER_EVENTS.BLOCKED,
                        handlerFn,
                    );

                    const rateLimiter = rateLimiterFactory.create(KEY, {
                        limit,
                        onlyError: false,
                    });
                    try {
                        await rateLimiter.runOrFail(() => {
                            throw new UnexpectedErrorA("Unexpected error");
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
                                rateLimiter: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as IRateLimiterStateMethods["getState"],
                                    key: rateLimiter.key,
                                    limit,
                                } satisfies IRateLimiterStateMethods) as IRateLimiterStateMethods,
                                type: RATE_LIMITER_EVENTS.BLOCKED,
                            } satisfies EventWithType<
                                BlockedRateLimiterEvent,
                                typeof RATE_LIMITER_EVENTS.BLOCKED
                            >),
                        );
                    }, waitForSettings);
                });
                test("Should dispatch AllowedRateLimiterEvent when limit is not reached by function call", async () => {
                    const limit = 5;
                    const state: IRateLimiterAdapterState = {
                        success: true,
                        attempt: limit - 2,
                        resetTime: TimeSpan.fromMilliseconds(1),
                    };
                    vi.spyOn(adapter, "getState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });
                    vi.spyOn(adapter, "updateState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });

                    const handlerFn = vi.fn(
                        (_event: AllowedRateLimiterEvent) => {},
                    );
                    await rateLimiterFactory.events.addListener(
                        RATE_LIMITER_EVENTS.ALLOWED,
                        handlerFn,
                    );

                    const rateLimiter = rateLimiterFactory.create(KEY, {
                        limit,
                        onlyError: false,
                    });
                    await rateLimiter.runOrFail(() => {});
                    await vi.waitFor(() => {
                        expect(handlerFn).toHaveBeenCalledOnce();
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                rateLimiter: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as IRateLimiterStateMethods["getState"],
                                    key: rateLimiter.key,
                                    limit,
                                } satisfies IRateLimiterStateMethods) as IRateLimiterStateMethods,
                                type: RATE_LIMITER_EVENTS.ALLOWED,
                            } satisfies EventWithType<
                                AllowedRateLimiterEvent,
                                typeof RATE_LIMITER_EVENTS.ALLOWED
                            >),
                        );
                    }, waitForSettings);
                });
                test("Should dispatch BlockedRateLimiterEvent when limit is reached by function call", async () => {
                    const limit = 5;
                    const state: IRateLimiterAdapterState = {
                        success: false,
                        attempt: limit,
                        resetTime: TimeSpan.fromMinutes(1),
                    };
                    vi.spyOn(adapter, "getState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });
                    vi.spyOn(adapter, "updateState").mockImplementation(() => {
                        return Promise.resolve(state);
                    });

                    const handlerFn = vi.fn(
                        (_event: BlockedRateLimiterEvent) => {},
                    );
                    await rateLimiterFactory.events.addListener(
                        RATE_LIMITER_EVENTS.BLOCKED,
                        handlerFn,
                    );

                    const rateLimiter = rateLimiterFactory.create(KEY, {
                        limit,
                        onlyError: false,
                    });
                    await rateLimiter.runOrFail(() => {});

                    await vi.waitFor(() => {
                        expect(handlerFn).toHaveBeenCalledOnce();
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                rateLimiter: expect.objectContaining({
                                    getState: expect.any(
                                        Function,
                                    ) as IRateLimiterStateMethods["getState"],
                                    key: rateLimiter.key,
                                    limit,
                                } satisfies IRateLimiterStateMethods) as IRateLimiterStateMethods,
                                type: RATE_LIMITER_EVENTS.BLOCKED,
                            } satisfies EventWithType<
                                BlockedRateLimiterEvent,
                                typeof RATE_LIMITER_EVENTS.BLOCKED
                            >),
                        );
                    }, waitForSettings);
                });
            });
        });
        describe("method: reset", () => {
            test("Should call dispatch ResetedRateLimiterEvent when reset method is called", async () => {
                vi.spyOn(adapter, "reset").mockImplementation(() =>
                    Promise.resolve(),
                );
                const handlerFn = vi.fn(() => {});
                await rateLimiterFactory.events.addListener(
                    RATE_LIMITER_EVENTS.RESETED,
                    handlerFn,
                );

                const rateLimiter = rateLimiterFactory.create(KEY, {
                    limit: 10,
                });
                await rateLimiter.reset();
                await vi.waitFor(() => {
                    expect(handlerFn).toHaveBeenCalledOnce();
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            rateLimiter: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as IRateLimiterStateMethods["getState"],
                                key: rateLimiter.key,
                                limit: 10,
                            } satisfies IRateLimiterStateMethods) as IRateLimiterStateMethods,
                            type: RATE_LIMITER_EVENTS.RESETED,
                        } satisfies EventWithType<
                            ResetedRateLimiterEvent,
                            typeof RATE_LIMITER_EVENTS.RESETED
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
            const rateLimiterPolicy = new FixedWindowLimiter({
                window: TimeSpan.fromMinutes(1),
            });

            const rateLimiterFactory1 = new RateLimiterFactory({
                adapter: new DatabaseRateLimiterAdapter({
                    adapter: new MemoryRateLimiterStorageAdapter(),
                    rateLimiterPolicy,
                }),
                namespace: new Namespace("@circuit-breaker-1"),
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: new Namespace("@event-bus/circuit-breaker-1"),
                }),
                serde,
            });
            const rateLimiter1 = rateLimiterFactory1.create(key, {
                limit: 1,
            });
            try {
                await rateLimiter1.runOrFail(() => {
                    return Promise.reject(
                        new UnexpectedErrorA("Unexpected error"),
                    );
                });
            } catch (error: unknown) {
                if (!(error instanceof UnexpectedErrorA)) {
                    throw error;
                }
            }

            const rateLimiterFactory2 = new RateLimiterFactory({
                adapter: new DatabaseRateLimiterAdapter({
                    adapter: new MemoryRateLimiterStorageAdapter(),
                    rateLimiterPolicy,
                }),
                namespace: new Namespace("@circuit-breaker-2"),
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: new Namespace("@event-bus/circuit-breaker-2"),
                }),
                serde,
            });
            const rateLimiter2 = rateLimiterFactory2.create(key, {
                limit: 1,
            });

            const deserializedRateLimiter2 = serde.deserialize<IRateLimiter>(
                serde.serialize(rateLimiter2),
            );
            const handler = vi.fn();
            await deserializedRateLimiter2.runOrFail(handler);
            expect(handler).toHaveBeenCalledOnce();
        });
        test("Should differentiate between different adapters that have same namespace", async () => {
            class WrapperRateLimiterAdapter implements IRateLimiterAdapter {
                constructor(private readonly adapter: IRateLimiterAdapter) {}

                getState(
                    context: IReadableContext,
                    key: string,
                ): Promise<IRateLimiterAdapterState | null> {
                    return this.adapter.getState(context, key);
                }

                updateState(
                    context: IReadableContext,
                    key: string,
                    limit: number,
                ): Promise<IRateLimiterAdapterState> {
                    return this.adapter.updateState(context, key, limit);
                }

                reset(context: IReadableContext, key: string): Promise<void> {
                    return this.adapter.reset(context, key);
                }
            }

            const serde = new Serde(new SuperJsonSerdeAdapter());
            const rateLimiterNamespace = new Namespace("@circuit-breaker");
            const eventNamespace = new Namespace("@event-bus/circuit-breaker");
            const key = "a";
            const rateLimiterPolicy = new FixedWindowLimiter({
                window: TimeSpan.fromMinutes(1),
            });

            const rateLimiterFactory1 = new RateLimiterFactory({
                adapter: new WrapperRateLimiterAdapter(
                    new DatabaseRateLimiterAdapter({
                        adapter: new MemoryRateLimiterStorageAdapter(),
                        rateLimiterPolicy,
                    }),
                ),
                namespace: rateLimiterNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serde,
            });
            const rateLimiter1 = rateLimiterFactory1.create(key, {
                limit: 1,
            });
            try {
                await rateLimiter1.runOrFail(() => {
                    return Promise.reject(
                        new UnexpectedErrorA("Unexpected error"),
                    );
                });
            } catch (error: unknown) {
                if (!(error instanceof UnexpectedErrorA)) {
                    throw error;
                }
            }

            const rateLimiterFactory2 = new RateLimiterFactory({
                adapter: new DatabaseRateLimiterAdapter({
                    adapter: new MemoryRateLimiterStorageAdapter(),
                    rateLimiterPolicy,
                }),
                namespace: rateLimiterNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serde,
            });
            const rateLimiter2 = rateLimiterFactory2.create(key, {
                limit: 1,
            });

            const deserializedRateLimiter2 = serde.deserialize<IRateLimiter>(
                serde.serialize(rateLimiter2),
            );
            const handler = vi.fn();
            await deserializedRateLimiter2.runOrFail(handler);
            expect(handler).toHaveBeenCalledOnce();
        });
        test("Should differentiate between different serdeTransformerNames", async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const rateLimiterNamespace = new Namespace("@circuit-breaker");
            const eventNamespace = new Namespace("@event-bus/circuit-breaker");
            const key = "a";
            const rateLimiterPolicy = new FixedWindowLimiter({
                window: TimeSpan.fromMinutes(1),
            });

            const rateLimiterFactory1 = new RateLimiterFactory({
                adapter: new DatabaseRateLimiterAdapter({
                    adapter: new MemoryRateLimiterStorageAdapter(),
                    rateLimiterPolicy,
                }),
                namespace: rateLimiterNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serdeTransformerName: "adapter1",
                serde,
            });
            const rateLimiter1 = rateLimiterFactory1.create(key, {
                limit: 1,
            });
            try {
                await rateLimiter1.runOrFail(() => {
                    return Promise.reject(
                        new UnexpectedErrorA("Unexpected error"),
                    );
                });
            } catch (error: unknown) {
                if (!(error instanceof UnexpectedErrorA)) {
                    throw error;
                }
            }

            const rateLimiterFactory2 = new RateLimiterFactory({
                adapter: new DatabaseRateLimiterAdapter({
                    adapter: new MemoryRateLimiterStorageAdapter(),
                    rateLimiterPolicy,
                }),
                namespace: rateLimiterNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serdeTransformerName: "adapter2",
                serde,
            });
            const rateLimiter2 = rateLimiterFactory2.create(key, {
                limit: 1,
            });

            const deserializedRateLimiter2 = serde.deserialize<IRateLimiter>(
                serde.serialize(rateLimiter2),
            );
            const handler = vi.fn();
            await deserializedRateLimiter2.runOrFail(handler);
            expect(handler).toHaveBeenCalledOnce();
        });
    });
});
