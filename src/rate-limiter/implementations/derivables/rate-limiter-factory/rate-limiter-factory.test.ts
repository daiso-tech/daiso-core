import { beforeEach, describe, expect, test, vi } from "vitest";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { Namespace } from "@/namespace/implementations/_module.js";
import {
    BlockedRateLimiterError,
    RATE_LIMITER_STATE,
    type IRateLimiterFactory,
    type RateLimiterExpiredState,
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

describe("class: RateLimiterFactory", () => {
    const adapter: IRateLimiterAdapter = {
        getState(
            _context: IReadableContext,
            _key: string,
        ): Promise<IRateLimiterAdapterState | null> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
        updateState(
            _context: IReadableContext,
            _key: string,
            _limit: number,
        ): Promise<IRateLimiterAdapterState> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
        reset(_context: IReadableContext, _key: string): Promise<void> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
    };
    const KEY = "a";

    class UnexpectedErrorA extends Error {}

    let rateLimiterFactory: IRateLimiterFactory;
    beforeEach(() => {
        vi.resetAllMocks();
        rateLimiterFactory = new RateLimiterFactory({
            adapter,
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
                constructor(private readonly adapter_: IRateLimiterAdapter) {}

                getState(
                    context: IReadableContext,
                    key: string,
                ): Promise<IRateLimiterAdapterState | null> {
                    return this.adapter_.getState(context, key);
                }

                updateState(
                    context: IReadableContext,
                    key: string,
                    limit: number,
                ): Promise<IRateLimiterAdapterState> {
                    return this.adapter_.updateState(context, key, limit);
                }

                reset(context: IReadableContext, key: string): Promise<void> {
                    return this.adapter_.reset(context, key);
                }
            }

            const serde = new Serde(new SuperJsonSerdeAdapter());
            const rateLimiterNamespace = new Namespace("@circuit-breaker");
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
