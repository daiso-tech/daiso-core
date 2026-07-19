/**
 * @module SharedLock
 */
import {
    type TestAPI,
    type SuiteAPI,
    type ExpectStatic,
    type beforeEach,
    vi,
} from "vitest";

import { type ISerde } from "@/serde/contracts/_module.js";
import {
    FailedAcquireWriterLockError,
    FailedRefreshReaderSemaphoreError,
    FailedRefreshWriterLockError,
    FailedReleaseReaderSemaphoreError,
    FailedReleaseWriterLockError,
    LimitReachedReaderSemaphoreError,
    SHARED_LOCK_STATE,
    type ISharedLock,
    type ISharedLockExpiredState,
    type ISharedLockFactory,
    type ISharedLockReaderAcquiredState,
    type ISharedLockReaderLimitReachedState,
    type ISharedLockReaderUnacquiredState,
    type ISharedLockWriterAcquiredState,
    type ISharedLockWriterUnavailableState,
} from "@/shared-lock/contracts/_module.js";
import { createIsTimeSpanEqualityTester } from "@/test-utilities/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay, type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/test-utilities"`
 * @group Utilities
 */
export type SharedLockFactoryTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createSharedLockFactory: () => Promisable<{
        sharedLockFactory: ISharedLockFactory;
        serde: ISerde;
    }>;

    /**
     * @default true
     */
    excludeSerdeTests?: boolean;

    /**
     * Enable retry for flaky tests.
     * @default 0
     */
    retry?: number;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromMilliseconds(10)
     * ```
     */
    delayBuffer?: ITimeSpan;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromMilliseconds(10)
     * ```
     */
    timeSpanEqualityBuffer?: ITimeSpan;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span"
     *
     * TimeSpan.fromMilliseconds(10)
     * ```
     */
    eventDispatchWaitTime?: ITimeSpan;
};

/**
 * The `sharedLockFactoryTestSuite` function simplifies the process of testing your custom implementation of {@link ISharedLock | `ISharedLock`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/test-utilities"`
 * @group Utilities
 * @example
 * ```ts
 * import { describe, expect, test, beforeEach } from "vitest";
 * import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";
 * import { SharedLockFactory } from "@daiso-tech/core/shared-lock";
 * import { EventBus } from "@daiso-tech/core/event-bus";
 * import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
 * import { sharedLockFactoryTestSuite } from "@daiso-tech/core/shared-lock/test-utilities";
 * import { Serde } from "@daiso-tech/core/serde";
 * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
 * import type { ISharedLockData } from "@daiso-tech/core/shared-lock/contracts";
 *
 * describe("class: SharedLockFactory", () => {
 *     sharedLockFactoryTestSuite({
 *         createSharedLockFactory: () => {
 *             const serde = new Serde(new SuperJsonSerdeAdapter());
 *             const sharedLockFactory = new SharedLockFactory({
 *                 serde,
 *                 adapter: new MemorySharedLockAdapter(),
 *             });
 *             return { sharedLockFactory, serde };
 *         },
 *         beforeEach,
 *         describe,
 *         expect,
 *         test,
 *         serde,
 *     });
 * });
 * ```
 */
export function sharedLockFactoryTestSuite(
    settings: SharedLockFactoryTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createSharedLockFactory,
        describe,
        beforeEach: beforeEach_,
        excludeSerdeTests = false,
        retry = 0,
        delayBuffer = TimeSpan.fromMilliseconds(10),
        timeSpanEqualityBuffer = TimeSpan.fromMilliseconds(10),
    } = settings;

    let sharedLockFactory: ISharedLockFactory;
    let serde: ISerde;
    async function delayWithBuffer(ttl: ITimeSpan): Promise<void> {
        await delay(TimeSpan.fromTimeSpan(ttl).addTimeSpan(delayBuffer));
    }

    class UnexpectedErrorA extends Error {}

    const RETURN_VALUE = "RETURN_VALUE";

    describe("ISharedLockFactory tests:", () => {
        beforeEach_(async () => {
            const { sharedLockFactory: sharedLockFactory_, serde: serde_ } =
                await createSharedLockFactory();
            sharedLockFactory = sharedLockFactory_;
            serde = serde_;
        });
        describe("Api tests:", () => {
            describe("method: runWriterOrFail", () => {
                test("Should call acquireReaderOrFail method", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });

                    const acquireSpy = vi.spyOn(
                        sharedLock,
                        "acquireWriterOrFail",
                    );

                    await sharedLock.runWriterOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(acquireSpy).toHaveBeenCalledTimes(1);
                });
                test("Should call acquireReaderOrFail before release method", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });

                    const acquireSpy = vi.spyOn(
                        sharedLock,
                        "acquireWriterOrFail",
                    );
                    const releaseSpy = vi.spyOn(sharedLock, "releaseWriter");

                    await sharedLock.runWriterOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(acquireSpy).toHaveBeenCalledBefore(releaseSpy);
                });
                test("Should call release method", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });

                    const releaseSpy = vi.spyOn(sharedLock, "releaseWriter");

                    await sharedLock.runWriterOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(releaseSpy).toHaveBeenCalledTimes(1);
                });
                test("Should call release after acquireReaderOrFail method", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });

                    const releaseSpy = vi.spyOn(sharedLock, "releaseWriter");
                    const acquireSpy = vi.spyOn(
                        sharedLock,
                        "acquireWriterOrFail",
                    );

                    await sharedLock.runWriterOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(releaseSpy).toHaveBeenCalledAfter(acquireSpy);
                });
                test("Should call release when an error is thrown", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });

                    const releaseSpy = vi.spyOn(sharedLock, "releaseWriter");

                    try {
                        await sharedLock.runWriterOrFail(() => {
                            return Promise.reject(new UnexpectedErrorA());
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorA)) {
                            throw error;
                        }
                    }

                    expect(releaseSpy).toHaveBeenCalledTimes(1);
                });
                test("Should propagate thrown error", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });

                    const error = sharedLock.runWriterOrFail(() => {
                        return Promise.reject(new UnexpectedErrorA());
                    });

                    await expect(error).rejects.toBeInstanceOf(
                        UnexpectedErrorA,
                    );
                });
                test("Should call handler function when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = null;

                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runWriterOrFail(handlerFn);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should call handler function when key is expired", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquireWriter();
                    await delayWithBuffer(ttl);

                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runWriterOrFail(handlerFn);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should call handler function when key is unexpireable and acquired by same shared-lock-id", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await sharedLock.runWriterOrFail(handlerFn);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should call handler function when key is unexpired and acquired by same shared-lock-id", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await sharedLock.runWriterOrFail(handlerFn);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should not call handler function when key is unexpireable and acquired by different shared-lock-id", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = null;

                    await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquireWriter();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await sharedLockFactory
                            .create(key, {
                                ttl,
                                limit,
                            })
                            .runWriterOrFail(handlerFn);
                    } catch (error: unknown) {
                        if (!(error instanceof FailedAcquireWriterLockError)) {
                            throw error;
                        }
                    }

                    await delay(delayBuffer);
                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should not call handler function when key is unexpired and acquired by different shared-lock-id", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquireWriter();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await sharedLockFactory
                            .create(key, {
                                ttl,
                                limit,
                            })
                            .runWriterOrFail(handlerFn);
                    } catch (error: unknown) {
                        if (!(error instanceof FailedAcquireWriterLockError)) {
                            throw error;
                        }
                    }

                    await delay(delayBuffer);
                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should return value when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = null;

                    const result = await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runWriterOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should return value when key is expired", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquireWriter();
                    await delayWithBuffer(ttl);

                    const result = await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runWriterOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should not throw error when key is unexpireable and acquired by same shared-lock-id", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();
                    const result = await sharedLock.runWriterOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should not throw error when key is unexpired and acquired by same shared-lock-id", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();
                    const result = await sharedLock.runWriterOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should throw FailedAcquireWriterLockError when key is unexpireable and acquired by different shared-lock-id", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = null;

                    await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquireWriter();
                    const result = sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runWriterOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    await expect(result).rejects.toBeInstanceOf(
                        FailedAcquireWriterLockError,
                    );
                });
                test("Should throw FailedAcquireWriterLockError when key is unexpired and acquired by different shared-lock-id", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquireWriter();
                    const result = sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runWriterOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    await expect(result).rejects.toBeInstanceOf(
                        FailedAcquireWriterLockError,
                    );
                });
            });
            describe("method: acquireWriter", () => {
                test("Should return true when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const result = await sharedLockFactory
                        .create(key, {
                            limit,
                            ttl,
                        })
                        .acquireWriter();

                    expect(result).toBe(true);
                });
                test("Should return true when key is expired", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const sharedLock = sharedLockFactory.create(key, {
                        limit,
                        ttl,
                    });
                    await sharedLock.acquireWriter();
                    await delayWithBuffer(ttl);

                    const result = await sharedLock.acquireWriter();
                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpireable and acquired by same shared-lock-id", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();
                    const result = await sharedLock.acquireWriter();

                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpired and acquired by same shared-lock-id", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();
                    const result = await sharedLock.acquireWriter();

                    expect(result).toBe(true);
                });
                test("Should return false when key is unexpireable and acquired by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.acquireWriter();

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpired and acquired by different shared-lock-id", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const sharedLock1 = sharedLockFactory.create(key, {
                        limit,
                        ttl,
                    });
                    await sharedLock1.acquireWriter();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        limit,
                        ttl,
                    });
                    const result = await sharedLock2.acquireWriter();

                    expect(result).toBe(false);
                });
                test("Should return false when key is acquired as reader", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        limit,
                        ttl,
                    });
                    await sharedLock.acquireReader();

                    const result = await sharedLock.acquireWriter();
                    expect(result).toBe(false);
                });
                test("Should not update state when key is acquired as reader", async () => {
                    const key = "a";
                    const limit = 3;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        limit,
                        ttl,
                    });
                    await sharedLock.acquireReader();

                    await sharedLock.acquireWriter();

                    const state = await sharedLock.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.READER_ACQUIRED,
                        limit,
                        remainingTime: ttl,
                        freeSlotsCount: 2,
                        acquiredSlotsCount: 1,
                        acquiredSlots: [sharedLock.id],
                    } satisfies ISharedLockReaderAcquiredState);
                });
            });
            describe("method: acquireWriterOrFail", () => {
                test("Should not throw error when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const result = sharedLockFactory
                        .create(key, {
                            limit,
                            ttl,
                        })
                        .acquireWriterOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is expired", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const sharedLock = sharedLockFactory.create(key, {
                        limit,
                        ttl,
                    });
                    await sharedLock.acquireWriterOrFail();
                    await delayWithBuffer(ttl);

                    const result = sharedLock.acquireWriterOrFail();
                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is unexpireable and acquired by same shared-lock-id", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriterOrFail();
                    const result = sharedLock.acquireWriterOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is unexpired and acquired by same shared-lock-id", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriterOrFail();
                    const result = sharedLock.acquireWriterOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should throw FailedAcquireWriterLockError when key is unexpireable and acquired by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriterOrFail();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = sharedLock2.acquireWriterOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedAcquireWriterLockError,
                    );
                });
                test("Should throw FailedAcquireWriterLockError when key is unexpired and acquired by different shared-lock-id", async () => {
                    const key = "a";
                    const limit = 4;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const sharedLock1 = sharedLockFactory.create(key, {
                        limit,
                        ttl,
                    });
                    await sharedLock1.acquireWriterOrFail();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        limit,
                        ttl,
                    });
                    const result = sharedLock2.acquireWriterOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedAcquireWriterLockError,
                    );
                });
                test("Should throw FailedAcquireWriterLockError when key is acquired as reader", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        limit,
                        ttl,
                    });
                    await sharedLock.acquireReader();

                    const result = sharedLock.acquireWriterOrFail();
                    await expect(result).rejects.toBeInstanceOf(
                        FailedAcquireWriterLockError,
                    );
                });
                test("Should not update state when key is acquired as reader", async () => {
                    const key = "a";
                    const limit = 3;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        limit,
                        ttl,
                    });
                    await sharedLock.acquireReader();

                    try {
                        await sharedLock.acquireWriterOrFail();
                    } catch (error: unknown) {
                        if (!(error instanceof FailedAcquireWriterLockError)) {
                            throw error;
                        }
                    }

                    const state = await sharedLock.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.READER_ACQUIRED,
                        limit,
                        remainingTime: ttl,
                        freeSlotsCount: 2,
                        acquiredSlotsCount: 1,
                        acquiredSlots: [sharedLock.id],
                    } satisfies ISharedLockReaderAcquiredState);
                });
            });
            describe("method: releaseWriter", () => {
                test("Should return false when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock.releaseWriter();

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpireable and released by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.releaseWriter();

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpired and released by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        limit,
                        ttl,
                    });
                    await sharedLock1.acquireWriter();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        limit,
                        ttl,
                    });
                    const result = await sharedLock2.releaseWriter();

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired and released by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();
                    await delayWithBuffer(ttl);

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.releaseWriter();

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired and released by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();
                    await delayWithBuffer(ttl);

                    const result = await sharedLock.releaseWriter();

                    expect(result).toBe(false);
                });
                test("Should return true when key is unexpireable and released by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const result = await sharedLock.releaseWriter();

                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpired and released by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const result = await sharedLock.releaseWriter();

                    expect(result).toBe(true);
                });
                test("Should not be reacquirable when key is unexpireable and released by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock2.releaseWriter();
                    const result = await sharedLock2.acquireWriter();

                    expect(result).toBe(false);
                });
                test("Should not be reacquirable when key is unexpired and released by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock2.releaseWriter();
                    const result = await sharedLock2.acquireWriter();

                    expect(result).toBe(false);
                });
                test("Should be reacquirable when key is unexpireable and released by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();
                    await sharedLock1.releaseWriter();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.acquireWriter();

                    expect(result).toBe(true);
                });
                test("Should be reacquirable when key is unexpired and released by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();
                    await sharedLock1.releaseWriter();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.acquireWriter();

                    expect(result).toBe(true);
                });
                test("Should return false when key is acquired as reader", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromSeconds(10);

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();

                    const result = await sharedLock.releaseWriter();

                    expect(result).toBe(false);
                });
                test("Should not update state when key is acquired as reader", async () => {
                    const key = "a";
                    const limit = 3;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();

                    await sharedLock.releaseWriter();

                    const state = await sharedLock.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.READER_ACQUIRED,
                        limit,
                        remainingTime: ttl,
                        freeSlotsCount: 2,
                        acquiredSlotsCount: 1,
                        acquiredSlots: [sharedLock.id],
                    } satisfies ISharedLockReaderAcquiredState);
                });
            });
            describe("method: releaseWriterOrFail", () => {
                test("Should throw FailedReleaseWriterLockError when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = sharedLock.releaseWriterOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseWriterLockError,
                    );
                });
                test("Should throw FailedReleaseWriterLockError when key is unexpireable and released by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = sharedLock2.releaseWriterOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseWriterLockError,
                    );
                });
                test("Should throw FailedReleaseWriterLockError when key is unexpired and released by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        limit,
                        ttl,
                    });
                    await sharedLock1.acquireWriter();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        limit,
                        ttl,
                    });
                    const result = sharedLock2.releaseWriterOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseWriterLockError,
                    );
                });
                test("Should throw FailedReleaseWriterLockError when key is expired and released by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();
                    await delayWithBuffer(ttl);

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = sharedLock2.releaseWriterOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseWriterLockError,
                    );
                });
                test("Should throw FailedReleaseWriterLockError when key is expired and released by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();
                    await delayWithBuffer(ttl);

                    const result = sharedLock.releaseWriterOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseWriterLockError,
                    );
                });
                test("Should not throw error when key is unexpireable and released by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const result = sharedLock.releaseWriterOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is unexpired and released by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const result = sharedLock.releaseWriterOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not be reacquirable when key is unexpireable and released by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    try {
                        await sharedLock2.releaseWriterOrFail();
                    } catch (error: unknown) {
                        if (!(error instanceof FailedReleaseWriterLockError)) {
                            throw error;
                        }
                    }
                    const result = await sharedLock2.acquireWriter();

                    expect(result).toBe(false);
                });
                test("Should not be reacquirable when key is unexpired and released by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    try {
                        await sharedLock2.releaseWriterOrFail();
                    } catch (error: unknown) {
                        if (!(error instanceof FailedReleaseWriterLockError)) {
                            throw error;
                        }
                    }
                    const result = await sharedLock2.acquireWriter();

                    expect(result).toBe(false);
                });
                test("Should be reacquirable when key is unexpireable and released by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();
                    await sharedLock1.releaseWriterOrFail();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.acquireWriter();

                    expect(result).toBe(true);
                });
                test("Should be reacquirable when key is unexpired and released by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();
                    await sharedLock1.releaseWriterOrFail();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.acquireWriter();

                    expect(result).toBe(true);
                });
                test("Should throw FailedReleaseWriterLockError when key is acquired as reader", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromSeconds(10);

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();

                    const result = sharedLock.releaseWriterOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseWriterLockError,
                    );
                });
                test("Should not update state when key is acquired as reader", async () => {
                    const key = "a";
                    const limit = 3;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();

                    try {
                        await sharedLock.releaseWriterOrFail();
                    } catch (error: unknown) {
                        if (!(error instanceof FailedReleaseWriterLockError)) {
                            throw error;
                        }
                    }

                    const state = await sharedLock.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.READER_ACQUIRED,
                        limit,
                        remainingTime: ttl,
                        freeSlotsCount: 2,
                        acquiredSlotsCount: 1,
                        acquiredSlots: [sharedLock.id],
                    } satisfies ISharedLockReaderAcquiredState);
                });
            });
            describe("method: refreshWriter", () => {
                test("Should return false when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(25);
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = await sharedLock.refreshWriter(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpireable and refreshed by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.refreshWriter(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpired and refreshed by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.refreshWriter(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired and refreshed by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();
                    await delayWithBuffer(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.refreshWriter(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired and refreshed by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();
                    await delayWithBuffer(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = await sharedLock.refreshWriter(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpireable and refreshed by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = await sharedLock.refreshWriter(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return true when key is unexpired and refreshed by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = await sharedLock.refreshWriter(newTtl);

                    expect(result).toBe(true);
                });
                test("Should not update expiration when key is unexpireable and refreshed by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const newTtl = TimeSpan.fromMilliseconds(50);
                    await sharedLock1.refreshWriter(newTtl);
                    await delayWithBuffer(newTtl);

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.acquireWriter();

                    expect(result).toBe(false);
                });
                test("Should update expiration when key is unexpired and refreshed by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    await sharedLock1.refreshWriter(newTtl);
                    await delay(newTtl.divide(2));

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result1 = await sharedLock2.acquireWriter();
                    expect(result1).toBe(false);

                    await delay(newTtl.divide(2));
                    const result2 = await sharedLock2.acquireWriter();
                    expect(result2).toBe(true);
                });
                test("Should return false when key is acquired as reader", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromSeconds(10);

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();

                    const newTtl = TimeSpan.fromSeconds(20);
                    const result = await sharedLock.refreshWriter(newTtl);

                    expect(result).toBe(false);
                });
                test("Should not update state when key is acquired as reader", async () => {
                    const key = "a";
                    const limit = 3;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();

                    const newTtl = TimeSpan.fromSeconds(20);
                    await sharedLock.refreshWriter(newTtl);

                    const state = await sharedLock.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.READER_ACQUIRED,
                        limit,
                        remainingTime: ttl,
                        freeSlotsCount: 2,
                        acquiredSlotsCount: 1,
                        acquiredSlots: [sharedLock.id],
                    } satisfies ISharedLockReaderAcquiredState);
                });
            });
            describe("method: refreshWriterOrFail", () => {
                test("Should throw FailedRefreshWriterLockError when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(25);
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = sharedLock.refreshWriterOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshWriterLockError,
                    );
                });
                test("Should throw FailedRefreshWriterLockError when key is unexpireable and refreshed by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = sharedLock2.refreshWriterOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshWriterLockError,
                    );
                });
                test("Should throw FailedRefreshWriterLockError when key is unexpired and refreshed by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = sharedLock2.refreshWriterOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshWriterLockError,
                    );
                });
                test("Should throw FailedRefreshWriterLockError when key is expired and refreshed by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();
                    await delayWithBuffer(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = sharedLock2.refreshWriterOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshWriterLockError,
                    );
                });
                test("Should throw FailedRefreshWriterLockError when key is expired and refreshed by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();
                    await delayWithBuffer(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = sharedLock.refreshWriterOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshWriterLockError,
                    );
                });
                test("Should throw FailedRefreshWriterLockError when key is unexpireable and refreshed by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = sharedLock.refreshWriterOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshWriterLockError,
                    );
                });
                test("Should not throw error when key is unexpired and refreshed by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = sharedLock.refreshWriterOrFail(newTtl);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not update expiration when key is unexpireable and refreshed by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const newTtl = TimeSpan.fromMilliseconds(50);
                    try {
                        await sharedLock1.refreshWriterOrFail(newTtl);
                    } catch (error: unknown) {
                        if (!(error instanceof FailedRefreshWriterLockError)) {
                            throw error;
                        }
                    }
                    await delayWithBuffer(newTtl);

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.acquireWriter();

                    expect(result).toBe(false);
                });
                test("Should update expiration when key is unexpired and refreshed by same shared-lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    try {
                        await sharedLock1.refreshWriterOrFail(newTtl);
                    } catch (error: unknown) {
                        if (!(error instanceof FailedRefreshWriterLockError)) {
                            throw error;
                        }
                    }
                    await delay(newTtl.divide(2));

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result1 = await sharedLock2.acquireWriter();
                    expect(result1).toBe(false);

                    await delay(newTtl.divide(2));
                    const result2 = await sharedLock2.acquireWriter();
                    expect(result2).toBe(true);
                });
                test("Should throw FailedRefreshWriterLockError when key is acquired as reader", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromSeconds(10);

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();

                    const newTtl = TimeSpan.fromSeconds(20);
                    const result = sharedLock.refreshWriterOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshWriterLockError,
                    );
                });
                test("Should not update state when key is acquired as reader", async () => {
                    const key = "a";
                    const limit = 3;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();

                    const newTtl = TimeSpan.fromSeconds(20);
                    try {
                        await sharedLock.refreshWriterOrFail(newTtl);
                    } catch (error: unknown) {
                        if (!(error instanceof FailedRefreshWriterLockError)) {
                            throw error;
                        }
                    }

                    const state = await sharedLock.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.READER_ACQUIRED,
                        limit,
                        remainingTime: ttl,
                        freeSlotsCount: 2,
                        acquiredSlotsCount: 1,
                        acquiredSlots: [sharedLock.id],
                    } satisfies ISharedLockReaderAcquiredState);
                });
            });
            describe("method: forceReleaseWriter", () => {
                test("Should return false when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock.forceReleaseWriter();

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();
                    await delayWithBuffer(ttl);

                    const result = await sharedLock.forceReleaseWriter();

                    expect(result).toBe(false);
                });
                test("Should return true when key is uenxpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const result = await sharedLock.forceReleaseWriter();

                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const result = await sharedLock.forceReleaseWriter();

                    expect(result).toBe(true);
                });
                test("Should be reacquirable when key is force released", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    await sharedLock1.forceReleaseWriter();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.acquireWriter();
                    expect(result).toBe(true);
                });
                test("Should return false when key is acquired as reader", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromSeconds(10);

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();

                    const result = await sharedLock.forceReleaseWriter();

                    expect(result).toBe(false);
                });
                test("Should not update state when key is acquired as reader", async () => {
                    const key = "a";
                    const limit = 3;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();

                    await sharedLock.forceReleaseWriter();

                    const state = await sharedLock.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.READER_ACQUIRED,
                        limit,
                        remainingTime: ttl,
                        freeSlotsCount: 2,
                        acquiredSlotsCount: 1,
                        acquiredSlots: [sharedLock.id],
                    } satisfies ISharedLockReaderAcquiredState);
                });
            });
            describe("method: runReaderOrFail", () => {
                test("Should call acquireReaderOrFail method", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });

                    const acquireReaderOrFailSpy = vi.spyOn(
                        sharedLock,
                        "acquireReaderOrFail",
                    );

                    await sharedLock.runReaderOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(acquireReaderOrFailSpy).toHaveBeenCalledTimes(1);
                });
                test("Should call acquireReaderOrFail before release method", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });

                    const acquireReaderOrFailSpy = vi.spyOn(
                        sharedLock,
                        "acquireReaderOrFail",
                    );
                    const releaseSpy = vi.spyOn(sharedLock, "releaseReader");

                    await sharedLock.runReaderOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(acquireReaderOrFailSpy).toHaveBeenCalledBefore(
                        releaseSpy,
                    );
                });
                test("Should call release method", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });

                    const releaseSpy = vi.spyOn(sharedLock, "releaseReader");

                    await sharedLock.runReaderOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(releaseSpy).toHaveBeenCalledTimes(1);
                });
                test("Should call release after acquireReaderOrFail method", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });

                    const releaseSpy = vi.spyOn(sharedLock, "releaseReader");
                    const acquireReaderOrFailSpy = vi.spyOn(
                        sharedLock,
                        "acquireReaderOrFail",
                    );

                    await sharedLock.runReaderOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(releaseSpy).toHaveBeenCalledAfter(
                        acquireReaderOrFailSpy,
                    );
                });
                test("Should call release when an error is thrown", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });

                    const releaseSpy = vi.spyOn(sharedLock, "releaseReader");

                    try {
                        await sharedLock.runReaderOrFail(() => {
                            return Promise.reject(new UnexpectedErrorA());
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorA)) {
                            throw error;
                        }
                    }

                    expect(releaseSpy).toHaveBeenCalledTimes(1);
                });
                test("Should propagate thrown error", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });

                    const error = sharedLock.runReaderOrFail(() => {
                        return Promise.reject(new UnexpectedErrorA());
                    });

                    await expect(error).rejects.toBeInstanceOf(
                        UnexpectedErrorA,
                    );
                });
                test("Should call handler function when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;

                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runReaderOrFail(handlerFn);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should call handler function when shared-lock-slot is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquireReader();
                    await delayWithBuffer(ttl);

                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runReaderOrFail(handlerFn);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should not call handler function when shared-lock-slot is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await sharedLock.runReaderOrFail(handlerFn);
                    } catch (error: unknown) {
                        if (
                            !(error instanceof LimitReachedReaderSemaphoreError)
                        ) {
                            throw error;
                        }
                    }

                    await delay(delayBuffer);
                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should not call handler function when shared-lock-slot is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await sharedLock.runReaderOrFail(handlerFn);
                    } catch (error: unknown) {
                        if (
                            !(error instanceof LimitReachedReaderSemaphoreError)
                        ) {
                            throw error;
                        }
                    }

                    await delay(delayBuffer);
                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should not call handler function when shared-lock-slot is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;

                    await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquireReader();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await sharedLockFactory
                            .create(key, {
                                ttl,
                                limit,
                            })
                            .runReaderOrFail(handlerFn);
                    } catch (error: unknown) {
                        if (
                            !(error instanceof LimitReachedReaderSemaphoreError)
                        ) {
                            throw error;
                        }
                    }

                    await delay(delayBuffer);
                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should not call handler function when shared-lock-slot is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquireReader();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await sharedLockFactory
                            .create(key, {
                                ttl,
                                limit,
                            })
                            .runReaderOrFail(handlerFn);
                    } catch (error: unknown) {
                        if (
                            !(error instanceof LimitReachedReaderSemaphoreError)
                        ) {
                            throw error;
                        }
                    }

                    await delay(delayBuffer);
                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should return value when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;

                    const result = await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runReaderOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should return value when shared-lock-slot is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquireReader();
                    await delayWithBuffer(ttl);

                    const result = await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runReaderOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should throw LimitReachedReaderSemaphoreError when shared-lock-slot is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    const result = sharedLock.runReaderOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    await expect(result).rejects.toBeInstanceOf(
                        LimitReachedReaderSemaphoreError,
                    );
                });
                test("Should throw LimitReachedReaderSemaphoreError when shared-lock-slot is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    const result = sharedLock.runReaderOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    await expect(result).rejects.toBeInstanceOf(
                        LimitReachedReaderSemaphoreError,
                    );
                });
                test("Should throw LimitReachedReaderSemaphoreError when shared-lock-slot is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;

                    await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquireReader();
                    const result = sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runReaderOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    await expect(result).rejects.toBeInstanceOf(
                        LimitReachedReaderSemaphoreError,
                    );
                });
                test("Should throw LimitReachedReaderSemaphoreError when shared-lock-slot is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    await sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquireReader();
                    const result = sharedLockFactory
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runReaderOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    await expect(result).rejects.toBeInstanceOf(
                        LimitReachedReaderSemaphoreError,
                    );
                });
            });
            describe("method: acquireReader", () => {
                test("Should return true when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock.acquireReader();

                    expect(result).toBe(true);
                });
                test("Should return true when key exists and shared-lock-slot is expired", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    await delayWithBuffer(ttl);

                    const result = await sharedLock.acquireReader();

                    expect(result).toBe(true);
                });
                test("Should return true when limit is not reached", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.acquireReader();

                    expect(result).toBe(true);
                });
                test("Should return false when limit is reached", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock2.acquireReader();

                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock3.acquireReader();

                    expect(result).toBe(false);
                });
                test("Should return true when one shared-lock-slot is expired", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await sharedLock2.acquireReader();
                    await delayWithBuffer(ttl2);

                    const ttl3 = null;
                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl: ttl3,
                        limit,
                    });
                    const result = await sharedLock3.acquireReader();

                    expect(result).toBe(true);
                });
                test("Should return true when shared-lock-slot exists, is unexpireable and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    const result = await sharedLock.acquireReader();

                    expect(result).toBe(true);
                });
                test("Should return true when shared-lock-slot exists, is unexpired and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    const result = await sharedLock.acquireReader();

                    expect(result).toBe(true);
                });
                test("Should not acquire a shared-lock-slot when shared-lock-slot exists, is unexpireable and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();
                    await sharedLock1.acquireReader();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.acquireReader();

                    expect(result).toBe(true);
                });
                test("Should not acquire a shared-lock-slot when shared-lock-slot exists, is unexpired and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();
                    await sharedLock1.acquireReader();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.acquireReader();

                    expect(result).toBe(true);
                });
                test("Should not update limit when shared-lock-slot count is more than 0", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const newLimit = 3;
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    await sharedLock2.acquireReader();

                    const result1 = await sharedLock2.getState();
                    expect(result1).toEqual(
                        expect.objectContaining<
                            Partial<ISharedLockReaderLimitReachedState>
                        >({
                            type: SHARED_LOCK_STATE.READER_LIMIT_REACHED,
                            limit,
                        }),
                    );

                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result2 = await sharedLock3.acquireReader();
                    expect(result2).toBe(false);
                });
                test("Should return false when key is acquired as writer", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 3;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const result = await sharedLock1.acquireReader();

                    expect(result).toBe(false);
                });
                test("Should not update state when key is acquired as writer", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 3;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    await sharedLock.acquireReader();

                    const state = await sharedLock.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.WRITER_ACQUIRED,
                        remainingTime: ttl,
                    } satisfies ISharedLockWriterAcquiredState);
                });
            });
            describe("method: acquireReaderOrFail", () => {
                test("Should not throw errror when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = sharedLock.acquireReaderOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw errror when key exists and shared-lock-slot is expired", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReaderOrFail();
                    await delayWithBuffer(ttl);

                    const result = sharedLock.acquireReaderOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw errror when limit is not reached", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReaderOrFail();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = sharedLock2.acquireReaderOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should throw LimitReachedReaderSemaphoreError when limit is reached", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReaderOrFail();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock2.acquireReaderOrFail();

                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = sharedLock3.acquireReaderOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        LimitReachedReaderSemaphoreError,
                    );
                });
                test("Should not throw errror when one shared-lock-slot is expired", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await sharedLock1.acquireReaderOrFail();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await sharedLock2.acquireReaderOrFail();
                    await delayWithBuffer(ttl2);

                    const ttl3 = null;
                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl: ttl3,
                        limit,
                    });
                    const result = sharedLock3.acquireReaderOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw errror when shared-lock-slot exists, is unexpireable and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReaderOrFail();
                    const result = sharedLock.acquireReaderOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw errror when shared-lock-slot exists, is unexpired and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReaderOrFail();
                    const result = sharedLock.acquireReaderOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not acquire a shared-lock-slot when shared-lock-slot exists, is unexpireable and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReaderOrFail();
                    await sharedLock1.acquireReaderOrFail();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = sharedLock2.acquireReaderOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not acquire a shared-lock-slot when shared-lock-slot exists, is unexpired and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReaderOrFail();
                    await sharedLock1.acquireReaderOrFail();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = sharedLock2.acquireReaderOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not update limit when shared-lock-slot count is more than 0", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReaderOrFail();

                    const newLimit = 3;
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    await sharedLock2.acquireReaderOrFail();

                    const result1 = await sharedLock2.getState();
                    expect(result1).toEqual(
                        expect.objectContaining<
                            Partial<ISharedLockReaderLimitReachedState>
                        >({
                            type: SHARED_LOCK_STATE.READER_LIMIT_REACHED,
                            limit,
                        }),
                    );

                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result2 = sharedLock3.acquireReaderOrFail();
                    await expect(result2).rejects.toBeInstanceOf(
                        LimitReachedReaderSemaphoreError,
                    );
                });
                test("Should throw LimitReachedReaderSemaphoreError when key is acquired as writer", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 3;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const result = sharedLock1.acquireReaderOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        LimitReachedReaderSemaphoreError,
                    );
                });
                test("Should not update state when key is acquired as writer", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 3;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    try {
                        await sharedLock.acquireReaderOrFail();
                    } catch (error: unknown) {
                        if (
                            !(error instanceof LimitReachedReaderSemaphoreError)
                        ) {
                            throw error;
                        }
                    }

                    const state = await sharedLock.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.WRITER_ACQUIRED,
                        remainingTime: ttl,
                    } satisfies ISharedLockWriterAcquiredState);
                });
            });
            describe("method: releaseReader", () => {
                test("Should return false when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const noneExistingKey = "c";
                    const sharedLock2 = sharedLockFactory.create(
                        noneExistingKey,
                        {
                            ttl,
                            limit,
                        },
                    );
                    const result = await sharedLock2.releaseReader();

                    expect(result).toBe(false);
                });
                test("Should return false when shared-lock-slot doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const noneExistingLockId = "2";
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                        lockId: noneExistingLockId,
                    });
                    const result = await sharedLock2.releaseReader();

                    expect(result).toBe(false);
                });
                test("Should return false when shared-lock-slot is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();
                    await delayWithBuffer(ttl);

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.releaseReader();

                    expect(result).toBe(false);
                });
                test("Should return true when shared-lock-slot exists and is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    const result = await sharedLock.releaseReader();

                    expect(result).toBe(true);
                });
                test("Should return true when shared-lock-slot exists and is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    const result = await sharedLock.releaseReader();

                    expect(result).toBe(true);
                });
                test("Should update limit when shared-lock-slot count is 0", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock2.acquireReader();

                    await sharedLock1.releaseReader();
                    await sharedLock2.releaseReader();

                    const newLimit = 3;
                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    await sharedLock3.acquireReader();

                    const result1 = await sharedLock3.getState();
                    expect(result1).toEqual(
                        expect.objectContaining<
                            Partial<ISharedLockReaderAcquiredState>
                        >({
                            type: SHARED_LOCK_STATE.READER_ACQUIRED,
                            limit: newLimit,
                        }),
                    );

                    const sharedLock4 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock4.acquireReader();

                    const sharedLock5 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result2 = await sharedLock5.acquireReader();
                    expect(result2).toBe(true);

                    const sharedLock6 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result3 = await sharedLock6.acquireReader();
                    expect(result3).toBe(false);
                });
                test("Should decrement shared-lock-slot count when one shared-lock-slot is released", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock2.acquireReader();
                    await sharedLock1.releaseReader();

                    const result1 = await sharedLock2.getState();
                    expect(result1).toEqual(
                        expect.objectContaining<
                            Partial<ISharedLockReaderAcquiredState>
                        >({
                            type: SHARED_LOCK_STATE.READER_ACQUIRED,
                            acquiredSlotsCount: 1,
                        }),
                    );

                    await sharedLock2.releaseReader();

                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result2 = await sharedLock3.acquireReader();
                    expect(result2).toBe(true);

                    const sharedLock4 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result3 = await sharedLock4.acquireReader();
                    expect(result3).toBe(true);
                });
                test("Should return false when key is acquired as writer", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const result = await sharedLock.releaseReader();

                    expect(result).toBe(false);
                });
                test("Should not update state when key is acquired as writer", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    await sharedLock.releaseReader();

                    const state = await sharedLock.getState();

                    expect(state).toEqual({
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        type: SHARED_LOCK_STATE.WRITER_ACQUIRED,
                        remainingTime: ttl,
                    } satisfies ISharedLockWriterAcquiredState);
                });
            });
            describe("method: releaseReaderOrFail", () => {
                test("Should throw FailedReleaseReaderSemaphoreError when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const noneExistingKey = "c";
                    const sharedLock2 = sharedLockFactory.create(
                        noneExistingKey,
                        {
                            ttl,
                            limit,
                        },
                    );
                    const result = sharedLock2.releaseReaderOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseReaderSemaphoreError,
                    );
                });
                test("Should throw FailedReleaseReaderSemaphoreError when shared-lock-slot doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const noneExistingLockId = "2";
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                        lockId: noneExistingLockId,
                    });
                    const result = sharedLock2.releaseReaderOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseReaderSemaphoreError,
                    );
                });
                test("Should throw FailedReleaseReaderSemaphoreError when shared-lock-slot is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();
                    await delayWithBuffer(ttl);

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = sharedLock2.releaseReaderOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseReaderSemaphoreError,
                    );
                });
                test("Should throw FailedReleaseReaderSemaphoreError when shared-lock-slot exists, is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    await delayWithBuffer(ttl);
                    const result = sharedLock.releaseReaderOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseReaderSemaphoreError,
                    );
                });
                test("Should not throw error when shared-lock-slot exists and is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    const result = sharedLock.releaseReaderOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when shared-lock-slot exists and is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    const result = sharedLock.releaseReaderOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should update limit when shared-lock-slot count is 0", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock2.acquireReader();

                    await sharedLock1.releaseReaderOrFail();
                    await sharedLock2.releaseReaderOrFail();

                    const newLimit = 3;
                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    await sharedLock3.acquireReader();

                    const result1 = await sharedLock3.getState();
                    expect(result1).toEqual(
                        expect.objectContaining<
                            Partial<ISharedLockReaderAcquiredState>
                        >({
                            type: SHARED_LOCK_STATE.READER_ACQUIRED,
                            limit: newLimit,
                        }),
                    );

                    const sharedLock4 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock4.acquireReader();

                    const sharedLock5 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result2 = await sharedLock5.acquireReader();
                    expect(result2).toBe(true);

                    const sharedLock6 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result3 = await sharedLock6.acquireReader();
                    expect(result3).toBe(false);
                });
                test("Should decrement shared-lock-slot count when one shared-lock-slot is released", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock2.acquireReader();
                    await sharedLock1.releaseReaderOrFail();

                    const result1 = await sharedLock2.getState();
                    expect(result1).toEqual(
                        expect.objectContaining<
                            Partial<ISharedLockReaderAcquiredState>
                        >({
                            type: SHARED_LOCK_STATE.READER_ACQUIRED,
                            acquiredSlotsCount: 1,
                        }),
                    );

                    await sharedLock2.releaseReaderOrFail();

                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result2 = await sharedLock3.acquireReader();
                    expect(result2).toBe(true);

                    const sharedLock4 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result3 = await sharedLock4.acquireReader();
                    expect(result3).toBe(true);
                });
                test("Should throw FailedReleaseReaderSemaphoreError when key is acquired as writer", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const result = sharedLock.releaseReaderOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseReaderSemaphoreError,
                    );
                });
                test("Should not update state when key is acquired as writer", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    try {
                        await sharedLock.releaseReaderOrFail();
                    } catch (error: unknown) {
                        if (
                            !(
                                error instanceof
                                FailedReleaseReaderSemaphoreError
                            )
                        ) {
                            throw error;
                        }
                    }
                    const state = await sharedLock.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.WRITER_ACQUIRED,
                        remainingTime: ttl,
                    } satisfies ISharedLockWriterAcquiredState);
                });
            });
            describe("method: refreshReader", () => {
                test("Should return false when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const noneExistingKey = "c";
                    const sharedLock2 = sharedLockFactory.create(
                        noneExistingKey,
                        {
                            ttl,
                            limit,
                        },
                    );
                    const result = await sharedLock2.refreshReader(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when shared-lock-slot doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const noneExistingLockId = "c";
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                        lockId: noneExistingLockId,
                    });
                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = await sharedLock2.refreshReader(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when shared-lock-slot is expired", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    await delayWithBuffer(ttl);

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = await sharedLock.refreshReader(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when shared-lock-slot exists and is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = await sharedLock.refreshReader(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return true when shared-lock-slot exists and is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = await sharedLock.refreshReader(newTtl);

                    expect(result).toBe(true);
                });
                test("Should not update expiration when shared-lock-slot exists and is unexpireable", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const ttl2 = null;
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await sharedLock2.acquireReader();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    await sharedLock2.refreshReader(newTtl);
                    await delayWithBuffer(newTtl);

                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    const result1 = await sharedLock3.acquireReader();
                    expect(result1).toBe(false);
                });
                test("Should update expiration when shared-lock-slot exists and is unexpired", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await sharedLock2.acquireReader();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    await sharedLock2.refreshReader(newTtl);
                    await delay(newTtl.divide(2));

                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    const result1 = await sharedLock3.acquireReader();
                    expect(result1).toBe(false);

                    await delay(newTtl.divide(2));

                    const result2 = await sharedLock3.acquireReader();
                    expect(result2).toBe(true);
                });
                test("Should return false when key is acquired as writer", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const newTtl = TimeSpan.fromSeconds(20);
                    const result = await sharedLock.refreshReader(newTtl);

                    expect(result).toBe(false);
                });
                test("Should not update state when key is acquired as writer", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const newTtl = TimeSpan.fromSeconds(20);
                    await sharedLock.refreshReader(newTtl);

                    const state = await sharedLock.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.WRITER_ACQUIRED,
                        remainingTime: ttl,
                    } satisfies ISharedLockWriterAcquiredState);
                });
            });
            describe("method: refreshReaderOrFail", () => {
                test("Should throw FailedRefreshReaderSemaphoreError when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const noneExistingKey = "c";
                    const sharedLock2 = sharedLockFactory.create(
                        noneExistingKey,
                        {
                            ttl,
                            limit,
                        },
                    );
                    const result = sharedLock2.refreshReaderOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshReaderSemaphoreError,
                    );
                });
                test("Should throw FailedRefreshReaderSemaphoreError when shared-lock-slot doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const noneExistingLockId = "c";
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                        lockId: noneExistingLockId,
                    });
                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = sharedLock2.refreshReaderOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshReaderSemaphoreError,
                    );
                });
                test("Should throw FailedRefreshReaderSemaphoreError when shared-lock-slot is expired", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    await delayWithBuffer(ttl);

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = sharedLock.refreshReaderOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshReaderSemaphoreError,
                    );
                });
                test("Should throw FailedRefreshReaderSemaphoreError when shared-lock-slot exists, is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    await delayWithBuffer(ttl);

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = sharedLock.refreshReaderOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshReaderSemaphoreError,
                    );
                });
                test("Should throw FailedRefreshReaderSemaphoreError when shared-lock-slot exists and is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = sharedLock.refreshReaderOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshReaderSemaphoreError,
                    );
                });
                test("Should not throw error when shared-lock-slot exists and is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = sharedLock.refreshReaderOrFail(newTtl);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not update expiration when shared-lock-slot exists and is unexpireable", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const ttl2 = null;
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await sharedLock2.acquireReader();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    try {
                        await sharedLock2.refreshReaderOrFail(newTtl);
                    } catch (error: unknown) {
                        if (
                            !(
                                error instanceof
                                FailedRefreshReaderSemaphoreError
                            )
                        ) {
                            throw error;
                        }
                    }
                    await delayWithBuffer(newTtl);

                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    const result1 = await sharedLock3.acquireReader();
                    expect(result1).toBe(false);
                });
                test("Should update expiration when shared-lock-slot exists and is unexpired", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await sharedLock2.acquireReader();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    await sharedLock2.refreshReaderOrFail(newTtl);
                    await delay(newTtl.divide(2));

                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    const result1 = await sharedLock3.acquireReader();
                    expect(result1).toBe(false);

                    await delay(newTtl.divide(2));

                    const result2 = await sharedLock3.acquireReader();
                    expect(result2).toBe(true);
                });
                test("Should throw FailedRefreshReaderSemaphoreError when key is acquired as writer", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const newTtl = TimeSpan.fromSeconds(20);
                    const result = sharedLock.refreshReaderOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshReaderSemaphoreError,
                    );
                });
                test("Should not update state when key is acquired as writer", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const newTtl = TimeSpan.fromSeconds(20);
                    try {
                        await sharedLock.refreshReaderOrFail(newTtl);
                    } catch (error: unknown) {
                        if (
                            !(
                                error instanceof
                                FailedRefreshReaderSemaphoreError
                            )
                        ) {
                            throw error;
                        }
                    }

                    const state = await sharedLock.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.WRITER_ACQUIRED,
                        remainingTime: ttl,
                    } satisfies ISharedLockWriterAcquiredState);
                });
            });
            describe("method: forceReleaseAllReaders", () => {
                test("Should return false when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const noneExistingKey = "c";
                    const sharedLock2 = sharedLockFactory.create(
                        noneExistingKey,
                        {
                            ttl,
                            limit,
                        },
                    );
                    const result = await sharedLock2.forceReleaseAllReaders();

                    expect(result).toBe(false);
                });
                test("Should return false when shared-lock-slot is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    await delayWithBuffer(ttl);

                    const result = await sharedLock.forceReleaseAllReaders();

                    expect(result).toBe(false);
                });
                test("Should return false when no shared-lock-slots are acquired", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock2.acquireReader();

                    await sharedLock1.releaseReader();
                    await sharedLock2.releaseReader();

                    const result = await sharedLock2.forceReleaseAllReaders();

                    expect(result).toBe(false);
                });
                test("Should return true when at least 1 shared-lock-slot is acquired", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();

                    const result = await sharedLock.forceReleaseAllReaders();

                    expect(result).toBe(true);
                });
                test("Should make all shared-lock-slots reacquirable", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await sharedLock2.acquireReader();

                    await sharedLock2.forceReleaseAllReaders();

                    const ttl3 = null;
                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl: ttl3,
                        limit,
                    });
                    const result1 = await sharedLock3.acquireReader();
                    expect(result1).toBe(true);

                    const ttl4 = null;
                    const sharedLock4 = sharedLockFactory.create(key, {
                        ttl: ttl4,
                        limit,
                    });
                    const result2 = await sharedLock4.acquireReader();
                    expect(result2).toBe(true);
                });
                test("Should update limit when shared-lock-slot count is 0", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock2.acquireReader();

                    await sharedLock2.forceReleaseAllReaders();

                    const newLimit = 3;
                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    await sharedLock3.acquireReader();

                    const result1 = await sharedLock3.getState();
                    expect(result1).toEqual(
                        expect.objectContaining<
                            Partial<ISharedLockReaderAcquiredState>
                        >({
                            type: SHARED_LOCK_STATE.READER_ACQUIRED,
                            limit: newLimit,
                        }),
                    );

                    const sharedLock4 = sharedLockFactory.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    await sharedLock4.acquireReader();

                    const sharedLock5 = sharedLockFactory.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    const result2 = await sharedLock5.acquireReader();
                    expect(result2).toBe(true);

                    const sharedLock6 = sharedLockFactory.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    const result3 = await sharedLock6.acquireReader();
                    expect(result3).toBe(false);
                });
                test("Should return false when key is acquired as writer", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const result = await sharedLock.forceReleaseAllReaders();

                    expect(result).toBe(false);
                });
                test("Should not update state when key is acquired as writer", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    await sharedLock.forceReleaseAllReaders();

                    const state = await sharedLock.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.WRITER_ACQUIRED,
                        remainingTime: ttl,
                    } satisfies ISharedLockWriterAcquiredState);
                });
            });
            describe("method: forceRelease", () => {
                test("Should return false when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock.forceRelease();

                    expect(result).toBe(false);
                });
                test("Should return false when key is acquired as writer mode and is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();
                    await delayWithBuffer(ttl);

                    const result = await sharedLock.forceRelease();

                    expect(result).toBe(false);
                });
                test("Should return true when key is acquired as writer mode and is uenxpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const result = await sharedLock.forceRelease();

                    expect(result).toBe(true);
                });
                test("Should return true when key is acquired as writer mode and is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const result = await sharedLock.forceRelease();

                    expect(result).toBe(true);
                });
                test("Should be reacquirable when key is acquired as writer mode and is force released", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    await sharedLock1.forceRelease();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await sharedLock2.acquireWriter();
                    expect(result).toBe(true);
                });
                test("Should return false when key is acquired as reader and shared-lock-slot is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    await delayWithBuffer(ttl);

                    const result = await sharedLock.forceRelease();

                    expect(result).toBe(false);
                });
                test("Should return false when key is acquired as reader and no shared-lock-slots are acquired", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock2.acquireReader();
                    await sharedLock1.releaseReader();
                    await sharedLock2.releaseReader();

                    const result = await sharedLock2.forceRelease();

                    expect(result).toBe(false);
                });
                test("Should return true when key is acquired as reader and at least 1 shared-lock-slot is acquired", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();

                    const result = await sharedLock.forceRelease();

                    expect(result).toBe(true);
                });
                test("Should make all shared-lock-slots reacquirable when key is acquired as reader", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await sharedLock2.acquireReader();

                    await sharedLock2.forceRelease();

                    const ttl3 = null;
                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl: ttl3,
                        limit,
                    });
                    const result1 = await sharedLock3.acquireReader();
                    expect(result1).toBe(true);

                    const ttl4 = null;
                    const sharedLock4 = sharedLockFactory.create(key, {
                        ttl: ttl4,
                        limit,
                    });
                    const result2 = await sharedLock4.acquireReader();
                    expect(result2).toBe(true);
                });
                test("Should update limit when key is reader mode and shared-lock-slot count is 0", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock2.acquireReader();
                    await sharedLock2.forceRelease();

                    const newLimit = 3;
                    const sharedLock3 = sharedLockFactory.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    await sharedLock3.acquireReader();

                    const result1 = await sharedLock3.getState();
                    expect(result1).toEqual(
                        expect.objectContaining<
                            Partial<ISharedLockReaderAcquiredState>
                        >({
                            type: SHARED_LOCK_STATE.READER_ACQUIRED,
                            limit: newLimit,
                        }),
                    );

                    const sharedLock4 = sharedLockFactory.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    await sharedLock4.acquireReader();

                    const sharedLock5 = sharedLockFactory.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    const result2 = await sharedLock5.acquireReader();
                    expect(result2).toBe(true);

                    const sharedLock6 = sharedLockFactory.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    const result3 = await sharedLock6.acquireReader();
                    expect(result3).toBe(false);
                });
            });
            describe("method: getState", () => {
                test("Should return ISharedLockExpiredState when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });

                    const result = await sharedLock.getState();

                    expect(result).toEqual({
                        type: SHARED_LOCK_STATE.EXPIRED,
                    } satisfies ISharedLockExpiredState);
                });
                test("Should return ISharedLockExpiredState when writer is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();
                    await delayWithBuffer(ttl);

                    const result = await sharedLock.getState();

                    expect(result).toEqual({
                        type: SHARED_LOCK_STATE.EXPIRED,
                    } satisfies ISharedLockExpiredState);
                });
                test("Should return ISharedLockExpiredState when writer is released with forceReleaseWriter method", async () => {
                    const key = "a";
                    const limit = 4;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const ttl2 = null;
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await sharedLock2.acquireWriter();

                    await sharedLock2.forceReleaseWriter();

                    const result = await sharedLock1.getState();

                    expect(result).toEqual({
                        type: SHARED_LOCK_STATE.EXPIRED,
                    } satisfies ISharedLockExpiredState);
                });
                test("Should return ISharedLockExpiredState when writer is released with forceRelease method", async () => {
                    const key = "a";
                    const limit = 4;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const ttl2 = null;
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await sharedLock2.acquireWriter();

                    await sharedLock2.forceRelease();

                    const result = await sharedLock1.getState();

                    expect(result).toEqual({
                        type: SHARED_LOCK_STATE.EXPIRED,
                    } satisfies ISharedLockExpiredState);
                });
                test("Should return ISharedLockExpiredState when writer is released with release method", async () => {
                    const key = "a";
                    const limit = 4;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const ttl2 = null;
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await sharedLock2.acquireWriter();

                    await sharedLock1.releaseWriter();
                    await sharedLock2.releaseWriter();

                    const result = await sharedLock2.getState();

                    expect(result).toEqual({
                        type: SHARED_LOCK_STATE.EXPIRED,
                    } satisfies ISharedLockExpiredState);
                });
                test("Should return ISharedLockWriterAcquiredState when writer is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const state = await sharedLock.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.WRITER_ACQUIRED,
                        remainingTime: ttl,
                    } satisfies ISharedLockWriterAcquiredState);
                });
                test("Should return ISharedLockWriterAcquiredState when writer is unexpired", async () => {
                    expect.addEqualityTesters([
                        createIsTimeSpanEqualityTester(timeSpanEqualityBuffer),
                    ]);

                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 4;
                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireWriter();

                    const state = await sharedLock.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.WRITER_ACQUIRED,
                        remainingTime: ttl,
                    } satisfies ISharedLockWriterAcquiredState);
                });
                test("Should return ISharedLockWriterUnavailableState when writer is acquired by different shared-lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 4;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock1.acquireWriter();

                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    const state = await sharedLock2.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.WRITER_UNAVAILABLE,
                        owner: sharedLock1.id,
                    } satisfies ISharedLockWriterUnavailableState);
                });
                test("Should return ISharedLockExpiredState when reader is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const sharedLock = sharedLockFactory.create(key, {
                        ttl,
                        limit,
                    });
                    await sharedLock.acquireReader();
                    await delayWithBuffer(ttl);

                    const result = await sharedLock.getState();

                    expect(result).toEqual({
                        type: SHARED_LOCK_STATE.EXPIRED,
                    } satisfies ISharedLockExpiredState);
                });
                test("Should return ISharedLockExpiredState when all reader shared-lock-slots are released with forceReleaseAllReaders method", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const ttl2 = null;
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await sharedLock2.acquireReader();

                    await sharedLock2.forceReleaseAllReaders();

                    const result = await sharedLock1.getState();

                    expect(result).toEqual({
                        type: SHARED_LOCK_STATE.EXPIRED,
                    } satisfies ISharedLockExpiredState);
                });
                test("Should return ISharedLockExpiredState when all reader shared-lock-slots are released with forceRelease method", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const ttl2 = null;
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await sharedLock2.acquireReader();

                    await sharedLock2.forceRelease();

                    const result = await sharedLock1.getState();

                    expect(result).toEqual({
                        type: SHARED_LOCK_STATE.EXPIRED,
                    } satisfies ISharedLockExpiredState);
                });
                test("Should return ISharedLockExpiredState when all reader shared-lock-slots are released with release method", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        limit,
                        ttl: ttl1,
                    });
                    await sharedLock1.acquireReader();

                    const ttl2 = null;
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await sharedLock2.acquireReader();

                    await sharedLock1.releaseReader();
                    await sharedLock2.releaseReader();

                    const result = await sharedLock2.getState();

                    expect(result).toEqual({
                        type: SHARED_LOCK_STATE.EXPIRED,
                    } satisfies ISharedLockExpiredState);
                });
                test("Should return ISharedLockReaderUnacquiredState when reader shared-lock-slot is unacquired", async () => {
                    const key = "a";
                    const limit = 3;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });

                    const state = await sharedLock2.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.READER_UNACQUIRED,
                        limit,
                        freeSlotsCount: limit - 1,
                        acquiredSlotsCount: 1,
                        acquiredSlots: [sharedLock1.id],
                    } satisfies ISharedLockReaderUnacquiredState);
                });
                test("Should return ISharedLockReaderUnacquiredState when reader shared-lock-slot is expired", async () => {
                    const key = "a";
                    const limit = 3;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await sharedLock2.acquireReader();
                    await delayWithBuffer(ttl2);

                    const state = await sharedLock2.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.READER_UNACQUIRED,
                        limit,
                        freeSlotsCount: limit - 1,
                        acquiredSlotsCount: 1,
                        acquiredSlots: [sharedLock1.id],
                    } satisfies ISharedLockReaderUnacquiredState);
                });
                test("Should return ISharedLockReaderAcquiredState when reader shared-lock-slot is unexpired", async () => {
                    expect.addEqualityTesters([
                        createIsTimeSpanEqualityTester(timeSpanEqualityBuffer),
                    ]);

                    const key = "a";
                    const limit = 3;

                    const ttl1 = null;
                    const sharedLock1 = sharedLockFactory.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await sharedLock1.acquireReader();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const sharedLock2 = sharedLockFactory.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await sharedLock2.acquireReader();

                    const state = await sharedLock2.getState();

                    expect(state).toEqual({
                        type: SHARED_LOCK_STATE.READER_ACQUIRED,
                        limit,
                        freeSlotsCount: limit - 2,
                        acquiredSlotsCount: 2,
                        acquiredSlots: [sharedLock1.id, sharedLock2.id],
                        remainingTime: ttl2,
                    } satisfies ISharedLockReaderAcquiredState);
                });
                test(
                    "Should return ISharedLockReaderLimitReachedState when reader limit is reached",
                    { retry },
                    async () => {
                        const key = "a";
                        const limit = 1;

                        const ttl1 = null;
                        const sharedLock1 = sharedLockFactory.create(key, {
                            ttl: ttl1,
                            limit,
                        });
                        await sharedLock1.acquireReader();

                        const ttl2 = TimeSpan.fromMilliseconds(50);
                        const sharedLock2 = sharedLockFactory.create(key, {
                            ttl: ttl2,
                            limit,
                        });
                        await delayWithBuffer(ttl2);

                        const state = await sharedLock2.getState();

                        expect(state).toEqual({
                            type: SHARED_LOCK_STATE.READER_LIMIT_REACHED,
                            limit,
                            acquiredSlots: [sharedLock1.id],
                        } satisfies ISharedLockReaderLimitReachedState);
                    },
                );
            });
        });
        describe.skipIf(excludeSerdeTests)("Serde tests:", () => {
            test("Should return ISharedLockExpiredState when acquired as writer, is derserialized and key doesnt exists", async () => {
                const key = "a";
                const ttl = TimeSpan.fromMilliseconds(50);
                const limit = 4;

                const sharedLock = sharedLockFactory.create(key, {
                    ttl,
                    limit,
                });
                const deserializedSharedLock = serde.deserialize<ISharedLock>(
                    serde.serialize(sharedLock),
                );
                const result = await deserializedSharedLock.getState();

                expect(result).toEqual({
                    type: SHARED_LOCK_STATE.EXPIRED,
                } satisfies ISharedLockExpiredState);
            });
            test("Should return ISharedLockExpiredState when acquired as writer, is derserialized and key is expired", async () => {
                const key = "a";
                const ttl = TimeSpan.fromMilliseconds(50);
                const limit = 4;

                const sharedLock = sharedLockFactory.create(key, {
                    ttl,
                    limit,
                });
                await sharedLock.acquireWriter();
                await delayWithBuffer(ttl);

                const deserializedSharedLock = serde.deserialize<ISharedLock>(
                    serde.serialize(sharedLock),
                );
                const result = await deserializedSharedLock.getState();

                expect(result).toEqual({
                    type: SHARED_LOCK_STATE.EXPIRED,
                } satisfies ISharedLockExpiredState);
            });
            test("Should return ISharedLockExpiredState when acquired as writer, is derserialized and all key is released with forceReleaseWriter method", async () => {
                const key = "a";
                const limit = 4;

                const ttl1 = null;
                const sharedLock1 = sharedLockFactory.create(key, {
                    ttl: ttl1,
                    limit,
                });
                await sharedLock1.acquireWriter();

                const ttl2 = null;
                const sharedLock2 = sharedLockFactory.create(key, {
                    ttl: ttl2,
                    limit,
                });
                await sharedLock2.acquireWriter();

                await sharedLock2.forceReleaseWriter();

                const deserializedSharedLock1 = serde.deserialize<ISharedLock>(
                    serde.serialize(sharedLock1),
                );
                const result = await deserializedSharedLock1.getState();

                expect(result).toEqual({
                    type: SHARED_LOCK_STATE.EXPIRED,
                } satisfies ISharedLockExpiredState);
            });
            test("Should return ISharedLockExpiredState when acquired as writer, is derserialized and all key is released with forceRelease method", async () => {
                const key = "a";
                const limit = 4;

                const ttl1 = null;
                const sharedLock1 = sharedLockFactory.create(key, {
                    ttl: ttl1,
                    limit,
                });
                await sharedLock1.acquireWriter();

                const ttl2 = null;
                const sharedLock2 = sharedLockFactory.create(key, {
                    ttl: ttl2,
                    limit,
                });
                await sharedLock2.acquireWriter();

                await sharedLock2.forceRelease();

                const deserializedSharedLock1 = serde.deserialize<ISharedLock>(
                    serde.serialize(sharedLock1),
                );
                const result = await deserializedSharedLock1.getState();

                expect(result).toEqual({
                    type: SHARED_LOCK_STATE.EXPIRED,
                } satisfies ISharedLockExpiredState);
            });
            test("Should return ISharedLockExpiredState when acquired as writer, is derserialized and all key is released with releaseWriter method", async () => {
                const key = "a";
                const limit = 4;

                const ttl1 = null;
                const sharedLock1 = sharedLockFactory.create(key, {
                    ttl: ttl1,
                    limit,
                });
                await sharedLock1.acquireWriter();

                const ttl2 = null;
                const sharedLock2 = sharedLockFactory.create(key, {
                    ttl: ttl2,
                    limit,
                });
                await sharedLock2.acquireWriter();

                await sharedLock1.releaseWriter();
                await sharedLock2.releaseWriter();

                const deserializedSharedLock2 = serde.deserialize<ISharedLock>(
                    serde.serialize(sharedLock2),
                );
                const result = await deserializedSharedLock2.getState();

                expect(result).toEqual({
                    type: SHARED_LOCK_STATE.EXPIRED,
                } satisfies ISharedLockExpiredState);
            });
            test("Should return ISharedLockWriterAcquiredState when acquired as writer, is derserialized and key is unexpireable", async () => {
                const key = "a";
                const ttl = null;
                const limit = 4;

                const sharedLock = sharedLockFactory.create(key, {
                    ttl,
                    limit,
                });
                await sharedLock.acquireWriter();

                const deserializedSharedLock = serde.deserialize<ISharedLock>(
                    serde.serialize(sharedLock),
                );
                const state = await deserializedSharedLock.getState();

                expect(state).toEqual({
                    type: SHARED_LOCK_STATE.WRITER_ACQUIRED,
                    remainingTime: ttl,
                } satisfies ISharedLockWriterAcquiredState);
            });
            test("Should return ISharedLockWriterAcquiredState when acquired as writer, is derserialized and key is unexpired", async () => {
                const key = "a";
                const ttl = TimeSpan.fromMilliseconds(50);
                const limit = 4;

                const sharedLock = sharedLockFactory.create(key, {
                    ttl,
                    limit,
                });
                await sharedLock.acquireWriter();

                const deserializedSharedLock = serde.deserialize<ISharedLock>(
                    serde.serialize(sharedLock),
                );
                const state = await deserializedSharedLock.getState();

                const writerAcquiredState =
                    state as ISharedLockWriterAcquiredState;

                expect(state.type).toBe(SHARED_LOCK_STATE.WRITER_ACQUIRED);
                expect(
                    writerAcquiredState.remainingTime?.toMilliseconds(),
                ).toBeLessThan(
                    (writerAcquiredState.remainingTime?.toMilliseconds() ?? 0) +
                        10,
                );
                expect(
                    writerAcquiredState.remainingTime?.toMilliseconds(),
                ).toBeGreaterThan(
                    (writerAcquiredState.remainingTime?.toMilliseconds() ?? 0) -
                        10,
                );
            });
            test("Should return ISharedLockWriterUnavailableState when acquired as writer, is derserialized and key is acquired by different shared-lock-id", async () => {
                const key = "a";
                const ttl = null;
                const limit = 4;

                const sharedLock1 = sharedLockFactory.create(key, {
                    ttl,
                    limit,
                });
                await sharedLock1.acquireWriter();

                const sharedLock2 = sharedLockFactory.create(key, {
                    ttl,
                    limit,
                });
                const deserializedSharedLock2 = serde.deserialize<ISharedLock>(
                    serde.serialize(sharedLock2),
                );
                const state = await deserializedSharedLock2.getState();

                expect(state).toEqual({
                    type: SHARED_LOCK_STATE.WRITER_UNAVAILABLE,
                    owner: sharedLock1.id,
                } satisfies ISharedLockWriterUnavailableState);
            });
            test("Should return ISharedLockExpiredState when acquired as reader, is derserialized and key doesnt exists", async () => {
                const key = "a";
                const limit = 3;
                const ttl = TimeSpan.fromMilliseconds(50);

                const sharedLock = sharedLockFactory.create(key, {
                    limit,
                    ttl,
                });
                const deserializedSemaphore = serde.deserialize<ISharedLock>(
                    serde.serialize(sharedLock),
                );

                const result = await deserializedSemaphore.getState();

                expect(result).toEqual({
                    type: SHARED_LOCK_STATE.EXPIRED,
                } satisfies ISharedLockExpiredState);
            });
            test("Should return ISharedLockExpiredState when acquired as reader, is derserialized and key is expired", async () => {
                const key = "a";
                const ttl = TimeSpan.fromMilliseconds(50);
                const limit = 2;

                const sharedLock = sharedLockFactory.create(key, {
                    ttl,
                    limit,
                });
                const deserializedSemaphore = serde.deserialize<ISharedLock>(
                    serde.serialize(sharedLock),
                );
                await deserializedSemaphore.acquireReader();
                await delayWithBuffer(ttl);

                const result = await sharedLock.getState();

                expect(result).toEqual({
                    type: SHARED_LOCK_STATE.EXPIRED,
                } satisfies ISharedLockExpiredState);
            });
            test("Should return ISharedLockExpiredState when acquired as reader, is derserialized and all shared-lock-slots are released with forceReleaseAll method", async () => {
                const key = "a";
                const limit = 2;

                const ttl1 = null;
                const sharedLock1 = sharedLockFactory.create(key, {
                    ttl: ttl1,
                    limit,
                });
                await sharedLock1.acquireReader();

                const ttl2 = null;
                const sharedLock2 = sharedLockFactory.create(key, {
                    ttl: ttl2,
                    limit,
                });
                const deserializedSemaphore2 = serde.deserialize<ISharedLock>(
                    serde.serialize(sharedLock2),
                );
                await deserializedSemaphore2.acquireReader();

                await deserializedSemaphore2.forceReleaseAllReaders();

                const result = await sharedLock1.getState();

                expect(result).toEqual({
                    type: SHARED_LOCK_STATE.EXPIRED,
                } satisfies ISharedLockExpiredState);
            });
            test("Should return ISharedLockExpiredState when acquired as reader, is derserialized and all shared-lock-slots are released with release method", async () => {
                const key = "a";
                const limit = 2;

                const ttl1 = null;
                const sharedLock1 = sharedLockFactory.create(key, {
                    limit,
                    ttl: ttl1,
                });
                await sharedLock1.acquireReader();

                const ttl2 = null;
                const sharedLock2 = sharedLockFactory.create(key, {
                    ttl: ttl2,
                    limit,
                });
                const deserialziedSemaphore2 = serde.deserialize<ISharedLock>(
                    serde.serialize(sharedLock2),
                );
                await deserialziedSemaphore2.acquireReader();

                await sharedLock1.releaseReader();
                await deserialziedSemaphore2.releaseReader();

                const result = await deserialziedSemaphore2.getState();

                expect(result).toEqual({
                    type: SHARED_LOCK_STATE.EXPIRED,
                } satisfies ISharedLockExpiredState);
            });
            test("Should return ISharedLockReaderUnacquiredState when acquired as reader, is derserialized and shared-lock-slot is unacquired", async () => {
                const key = "a";
                const limit = 3;

                const ttl1 = null;
                const sharedLock1 = sharedLockFactory.create(key, {
                    ttl: ttl1,
                    limit,
                });
                await sharedLock1.acquireReader();

                const ttl2 = TimeSpan.fromMilliseconds(50);
                const sharedLock2 = sharedLockFactory.create(key, {
                    ttl: ttl2,
                    limit,
                });
                const deserialziedSemaphore2 = serde.deserialize<ISharedLock>(
                    serde.serialize(sharedLock2),
                );

                const state = await deserialziedSemaphore2.getState();

                expect(state).toEqual({
                    type: SHARED_LOCK_STATE.READER_UNACQUIRED,
                    limit,
                    freeSlotsCount: limit - 1,
                    acquiredSlotsCount: 1,
                    acquiredSlots: [sharedLock1.id],
                } satisfies ISharedLockReaderUnacquiredState);
            });
            test("Should return ISharedLockReaderUnacquiredState when acquired as reader, is derserialized and shared-lock-slot is expired", async () => {
                const key = "a";
                const limit = 3;

                const ttl1 = null;
                const sharedLock1 = sharedLockFactory.create(key, {
                    ttl: ttl1,
                    limit,
                });
                await sharedLock1.acquireReader();

                const ttl2 = TimeSpan.fromMilliseconds(50);
                const sharedLock2 = sharedLockFactory.create(key, {
                    ttl: ttl2,
                    limit,
                });
                const deserializedSemaphore2 = serde.deserialize<ISharedLock>(
                    serde.serialize(sharedLock2),
                );
                await deserializedSemaphore2.acquireReader();
                await delayWithBuffer(ttl2);

                const state = await deserializedSemaphore2.getState();

                expect(state).toEqual({
                    type: SHARED_LOCK_STATE.READER_UNACQUIRED,
                    limit,
                    freeSlotsCount: limit - 1,
                    acquiredSlotsCount: 1,
                    acquiredSlots: [sharedLock1.id],
                } satisfies ISharedLockReaderUnacquiredState);
            });
            test("Should return ISharedLockReaderAcquiredState when acquired as reader, is derserialized and shared-lock-slot is unexpired", async () => {
                expect.addEqualityTesters([
                    createIsTimeSpanEqualityTester(timeSpanEqualityBuffer),
                ]);

                const key = "a";
                const limit = 3;

                const ttl1 = null;
                const sharedLock1 = sharedLockFactory.create(key, {
                    ttl: ttl1,
                    limit,
                });
                await sharedLock1.acquireReader();

                const ttl2 = TimeSpan.fromMilliseconds(50);
                const sharedLock2 = sharedLockFactory.create(key, {
                    ttl: ttl2,
                    limit,
                });
                const deserializedSemaphore2 = serde.deserialize<ISharedLock>(
                    serde.serialize(sharedLock2),
                );
                await deserializedSemaphore2.acquireReader();

                const state = await deserializedSemaphore2.getState();

                expect(state).toEqual({
                    type: SHARED_LOCK_STATE.READER_ACQUIRED,
                    limit,
                    freeSlotsCount: limit - 2,
                    acquiredSlotsCount: 2,
                    acquiredSlots: [sharedLock1.id, sharedLock2.id],
                    remainingTime: ttl2,
                } satisfies ISharedLockReaderAcquiredState);
            });
            test("Should return ISharedLockReaderLimitReachedState when acquired as reader, is derserialized and limit is reached", async () => {
                const key = "a";
                const limit = 1;

                const ttl1 = null;
                const sharedLock1 = sharedLockFactory.create(key, {
                    ttl: ttl1,
                    limit,
                });
                await sharedLock1.acquireReader();

                const ttl2 = TimeSpan.fromMilliseconds(50);
                const sharedLock2 = sharedLockFactory.create(key, {
                    ttl: ttl2,
                    limit,
                });
                const deserializedSemaphore2 = serde.deserialize<ISharedLock>(
                    serde.serialize(sharedLock2),
                );
                await delayWithBuffer(ttl2);

                const state = await deserializedSemaphore2.getState();

                expect(state).toEqual({
                    type: SHARED_LOCK_STATE.READER_LIMIT_REACHED,
                    limit,
                    acquiredSlots: [sharedLock1.id],
                } satisfies ISharedLockReaderLimitReachedState);
            });
        });
    });
}
