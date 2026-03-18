import { beforeEach, describe, expect, test, vi } from "vitest";

import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import {
    BlockedRateLimiterError,
    RATE_LIMITER_EVENTS,
    RATE_LIMITER_STATE,
    type AllowedRateLimiterEvent,
    type BlockedRateLimiterEvent,
    type IRateLimiterProvider,
    type IRateLimiterStateMethods,
    type RateLimiterExpiredState,
    type ResetedRateLimiterEvent,
    type TrackedFailureRateLimiterEvent,
    type UntrackedFailureRateLimiterEvent,
    type IRateLimiterAdapter,
    type IRateLimiterAdapterState,
    type RateLimiterAllowedState,
    type RateLimiterBlockedState,
} from "@/rate-limiter/contracts/_module.js";
import { RateLimiterProvider } from "@/rate-limiter/implementations/derivables/rate-limiter-provider/rate-limiter-provider.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

describe("class: RateLimiterProvider", () => {
    const adapter: IRateLimiterAdapter = {
        getState: function (
            _key: string,
        ): Promise<IRateLimiterAdapterState | null> {
            throw new Error("Function not implemented.");
        },
        updateState: function (
            _key: string,
            _limit: number,
        ): Promise<IRateLimiterAdapterState> {
            throw new Error("Function not implemented.");
        },
        reset: function (_key: string): Promise<void> {
            throw new Error("Function not implemented.");
        },
    };
    const KEY = "a";

    let rateLimiterProvider: IRateLimiterProvider;
    beforeEach(() => {
        vi.resetAllMocks();
        rateLimiterProvider = new RateLimiterProvider({
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
                        await rateLimiterProvider
                            .create(KEY, {
                                limit: 5,
                                onlyError: true,
                            })
                            .runOrFail(() => {
                                throw new Error("Unexpected error");
                            });
                    } catch {
                        /* EMPTY */
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

                    await rateLimiterProvider
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
                        await rateLimiterProvider
                            .create(KEY, {
                                limit: 5,
                                onlyError: true,
                            })
                            .runOrFail(() => {
                                throw new Error("Unexpected error");
                            });
                    } catch {
                        /* EMPTY */
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

                    await rateLimiterProvider
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

                    const rateLimiter = rateLimiterProvider.create(KEY, {
                        limit: 5,
                        onlyError: true,
                    });
                    const promise = rateLimiter.runOrFail(() => {
                        return Promise.reject(new Error("UNEXPECTED ERROR"));
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
                        await rateLimiterProvider
                            .create(KEY, {
                                limit: 5,
                                onlyError: false,
                            })
                            .runOrFail(() => {
                                throw new Error("Unexpected error");
                            });
                    } catch {
                        /* EMPTY */
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

                    await rateLimiterProvider
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
                        await rateLimiterProvider
                            .create(KEY, {
                                limit: 5,
                                onlyError: false,
                            })
                            .runOrFail(() => {
                                throw new Error("Unexpected error");
                            });
                    } catch {
                        /* EMPTY */
                    }

                    expect(getStateSpy).not.toHaveBeenCalledOnce();
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

                    await rateLimiterProvider
                        .create(KEY, {
                            limit: 5,
                            onlyError: false,
                        })
                        .runOrFail(() => {});

                    expect(getStateSpy).not.toHaveBeenCalledOnce();
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

                    const rateLimiter = rateLimiterProvider.create(KEY, {
                        limit: 5,
                        onlyError: false,
                    });
                    const promise = rateLimiter.runOrFail(() => {
                        return Promise.reject(new Error("UNEXPECTED ERROR"));
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

                const rateLimiter = rateLimiterProvider.create(KEY, {
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

                const rateLimiter = rateLimiterProvider.create(KEY, {
                    limit: 10,
                });

                await rateLimiter.getState();

                expect(getStateSpy).toHaveBeenCalledOnce();
            });
            test("Should return RateLimiterExpiredState when IRateLimiterAdapter.getState returns null", async () => {
                vi.spyOn(adapter, "getState").mockImplementation(() =>
                    Promise.resolve(null),
                );

                const rateLimiter = rateLimiterProvider.create(KEY, {
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

                const rateLimiter = rateLimiterProvider.create(KEY, {
                    limit,
                });

                const state = await rateLimiter.getState();

                expect(state).toEqual({
                    type: RATE_LIMITER_STATE.ALLOWED,
                    usedAttempts: attempt,
                    reaminingAttemps: limit - attempt,
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

                const rateLimiter = rateLimiterProvider.create(KEY, {
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
                    await rateLimiterProvider.events.addListener(
                        RATE_LIMITER_EVENTS.TRACKED_FAILURE,
                        handlerFn,
                    );

                    const limit = 5;
                    class ErrorA extends Error {}
                    const rateLimiter = rateLimiterProvider.create(KEY, {
                        limit,
                        onlyError: true,
                    });
                    try {
                        await rateLimiter.runOrFail(() => {
                            throw new ErrorA("Unexpected error");
                        });
                    } catch {
                        /* EMPTY */
                    }

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
                            error: expect.any(ErrorA),
                        } satisfies TrackedFailureRateLimiterEvent),
                    );
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
                    await rateLimiterProvider.events.addListener(
                        RATE_LIMITER_EVENTS.TRACKED_FAILURE,
                        handlerFn,
                    );

                    class ErrorA extends Error {}
                    class ErrorB extends Error {}
                    try {
                        await rateLimiterProvider
                            .create(KEY, {
                                limit: 5,
                                onlyError: true,
                                errorPolicy: ErrorA,
                            })
                            .runOrFail(() => {
                                throw new ErrorB("Unexpected error");
                            });
                    } catch {
                        /* EMPTY */
                    }

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
                    await rateLimiterProvider.events.addListener(
                        RATE_LIMITER_EVENTS.UNTRACKED_FAILURE,
                        handlerFn,
                    );

                    class ErrorA extends Error {}
                    class ErrorB extends Error {}
                    const limit = 5;
                    const rateLimiter = rateLimiterProvider.create(KEY, {
                        limit,
                        onlyError: true,
                        errorPolicy: ErrorA,
                    });
                    try {
                        await rateLimiter.runOrFail(() => {
                            throw new ErrorB("Unexpected error");
                        });
                    } catch {
                        /* EMPTY */
                    }

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
                            error: expect.any(ErrorB),
                        } satisfies UntrackedFailureRateLimiterEvent),
                    );
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
                    await rateLimiterProvider.events.addListener(
                        RATE_LIMITER_EVENTS.ALLOWED,
                        handlerFn,
                    );

                    class ErrorA extends Error {}
                    const rateLimiter = rateLimiterProvider.create(KEY, {
                        limit,
                        onlyError: true,
                    });
                    try {
                        await rateLimiter.runOrFail(() => {
                            throw new ErrorA("Unexpected error");
                        });
                    } catch {
                        /* EMPTY */
                    }

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
                        } satisfies AllowedRateLimiterEvent),
                    );
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
                    await rateLimiterProvider.events.addListener(
                        RATE_LIMITER_EVENTS.BLOCKED,
                        handlerFn,
                    );

                    class ErrorA extends Error {}
                    const rateLimiter = rateLimiterProvider.create(KEY, {
                        limit,
                        onlyError: true,
                    });
                    try {
                        await rateLimiter.runOrFail(() => {
                            throw new ErrorA("Unexpected error");
                        });
                    } catch {
                        /* EMPTY */
                    }

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
                        } satisfies BlockedRateLimiterEvent),
                    );
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
                    await rateLimiterProvider.events.addListener(
                        RATE_LIMITER_EVENTS.ALLOWED,
                        handlerFn,
                    );

                    const rateLimiter = rateLimiterProvider.create(KEY, {
                        limit,
                        onlyError: true,
                    });
                    await rateLimiter.runOrFail(() => {});

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
                        } satisfies AllowedRateLimiterEvent),
                    );
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
                    await rateLimiterProvider.events.addListener(
                        RATE_LIMITER_EVENTS.ALLOWED,
                        handlerFn,
                    );

                    class ErrorA extends Error {}
                    const rateLimiter = rateLimiterProvider.create(KEY, {
                        limit,
                        onlyError: false,
                    });
                    try {
                        await rateLimiter.runOrFail(() => {
                            throw new ErrorA("Unexpected error");
                        });
                    } catch {
                        /* EMPTY */
                    }

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
                        } satisfies AllowedRateLimiterEvent),
                    );
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
                    await rateLimiterProvider.events.addListener(
                        RATE_LIMITER_EVENTS.BLOCKED,
                        handlerFn,
                    );

                    class ErrorA extends Error {}
                    const rateLimiter = rateLimiterProvider.create(KEY, {
                        limit,
                        onlyError: false,
                    });
                    try {
                        await rateLimiter.runOrFail(() => {
                            throw new ErrorA("Unexpected error");
                        });
                    } catch {
                        /* EMPTY */
                    }

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
                        } satisfies BlockedRateLimiterEvent),
                    );
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
                    await rateLimiterProvider.events.addListener(
                        RATE_LIMITER_EVENTS.ALLOWED,
                        handlerFn,
                    );

                    const rateLimiter = rateLimiterProvider.create(KEY, {
                        limit,
                        onlyError: false,
                    });
                    await rateLimiter.runOrFail(() => {});

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
                        } satisfies AllowedRateLimiterEvent),
                    );
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
                    await rateLimiterProvider.events.addListener(
                        RATE_LIMITER_EVENTS.BLOCKED,
                        handlerFn,
                    );

                    const rateLimiter = rateLimiterProvider.create(KEY, {
                        limit,
                        onlyError: false,
                    });
                    try {
                        await rateLimiter.runOrFail(() => {});
                    } catch {
                        /* EMPTY */
                    }

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
                        } satisfies BlockedRateLimiterEvent),
                    );
                });
            });
        });
        describe("method: reset", () => {
            test("Should call dispatch ResetedRateLimiterEvent when reset method is called", async () => {
                vi.spyOn(adapter, "reset").mockImplementation(() =>
                    Promise.resolve(),
                );
                const handlerFn = vi.fn(() => {});
                await rateLimiterProvider.events.addListener(
                    RATE_LIMITER_EVENTS.RESETED,
                    handlerFn,
                );

                const rateLimiter = rateLimiterProvider.create(KEY, {
                    limit: 10,
                });
                await rateLimiter.reset();

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
                    } satisfies ResetedRateLimiterEvent),
                );
            });
        });
    });
    describe("Serde tests:", () => {
        test.todo("Write tests!!!");
    });
});
