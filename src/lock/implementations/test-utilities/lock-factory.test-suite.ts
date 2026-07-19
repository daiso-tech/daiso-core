/**
 * @module Lock
 */
import {
    type TestAPI,
    type SuiteAPI,
    type ExpectStatic,
    type beforeEach,
    vi,
} from "vitest";

import {
    FailedAcquireLockError,
    FailedReleaseLockError,
    FailedRefreshLockError,
    LOCK_STATE,
    type ILock,
    type ILockAcquiredState,
    type ILockExpiredState,
    type ILockFactory,
    type ILockUnavailableState,
} from "@/lock/contracts/_module.js";
import { type ISerde } from "@/serde/contracts/_module.js";
import { createIsTimeSpanEqualityTester } from "@/test-utilities/_module.js";
import {
    TO_MILLISECONDS,
    type ITimeSpan,
} from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { delay, type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/test-utilities"`
 * @group Utilities
 */
export type LockFactoryTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createLockFactory: () => Promisable<{
        lockFactory: ILockFactory;
        serde: ISerde;
    }>;

    /**
     * @default true
     */
    excludeSerdeTests?: boolean;

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
};

/**
 * The `lockFactoryTestSuite` function simplifies the process of testing your custom implementation of {@link ILock | `ILock`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/test-utilities"`
 * @group Utilities
 * @example
 * ```ts
 * import { describe, expect, test, beforeEach } from "vitest";
 * import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";
 * import { LockFactory } from "@daiso-tech/core/lock";
 * import { EventBus } from "@daiso-tech/core/event-bus";
 * import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
 * import { lockFactoryTestSuite } from "@daiso-tech/core/lock/test-utilities";
 * import { Serde } from "@daiso-tech/core/serde";
 * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
 * import type { ILockData } from "@daiso-tech/core/lock/contracts";
 *
 * describe("class: LockFactory", () => {
 *     lockFactoryTestSuite({
 *         createLockFactory: () => {
 *             const serde = new Serde(new SuperJsonSerdeAdapter());
 *             const lockFactory = new LockFactory({
 *                 serde,
 *                 adapter: new MemoryLockAdapter(),
 *             });
 *             return { lockFactory, serde };
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
export function lockFactoryTestSuite(
    settings: LockFactoryTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createLockFactory,
        describe,
        beforeEach: beforeEach_,
        excludeSerdeTests = false,
        delayBuffer = TimeSpan.fromMilliseconds(10),
        timeSpanEqualityBuffer = TimeSpan.fromMilliseconds(10),
    } = settings;

    let lockFactory: ILockFactory;
    let serde: ISerde;

    async function delayWithBuffer(ttl: ITimeSpan): Promise<void> {
        await delay(TimeSpan.fromTimeSpan(ttl).addTimeSpan(delayBuffer));
    }

    const RETURN_VALUE = "RETURN_VALUE";
    describe("ILockFactory tests:", () => {
        beforeEach_(async () => {
            const { lockFactory: lockFactory_, serde: serde_ } =
                await createLockFactory();
            lockFactory = lockFactory_;
            serde = serde_;
        });
        describe("Api tests:", () => {
            describe("method: runOrFail", () => {
                test("Should call acquireOrFail method", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockFactory.create(key, {
                        ttl,
                    });

                    const acquireSpy = vi.spyOn(lock, "acquireOrFail");

                    await lock.runOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(acquireSpy).toHaveBeenCalledTimes(1);
                });
                test("Should call acquireOrFail before release method", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockFactory.create(key, {
                        ttl,
                    });

                    const acquireSpy = vi.spyOn(lock, "acquireOrFail");
                    const releaseSpy = vi.spyOn(lock, "release");

                    await lock.runOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(acquireSpy).toHaveBeenCalledBefore(releaseSpy);
                });
                test("Should call release method", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockFactory.create(key, {
                        ttl,
                    });

                    const releaseSpy = vi.spyOn(lock, "release");

                    await lock.runOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(releaseSpy).toHaveBeenCalledTimes(1);
                });
                test("Should call release after acquireOrFail method", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockFactory.create(key, {
                        ttl,
                    });

                    const releaseSpy = vi.spyOn(lock, "release");
                    const acquireSpy = vi.spyOn(lock, "acquireOrFail");

                    await lock.runOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(releaseSpy).toHaveBeenCalledAfter(acquireSpy);
                });
                test("Should call release when an error is thrown", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockFactory.create(key, {
                        ttl,
                    });

                    const releaseSpy = vi.spyOn(lock, "release");

                    class UnexpectedError extends Error {}
                    try {
                        await lock.runOrFail(() => {
                            return Promise.reject(new UnexpectedError());
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedError)) {
                            throw error;
                        }
                    }

                    expect(releaseSpy).toHaveBeenCalledTimes(1);
                });
                test("Should propagate thrown error", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockFactory.create(key, {
                        ttl,
                    });

                    class UnexpectedErrorA extends Error {}

                    const error = lock.runOrFail(() => {
                        return Promise.reject(new UnexpectedErrorA());
                    });

                    await expect(error).rejects.toBeInstanceOf(
                        UnexpectedErrorA,
                    );
                });
                test("Should call handler function when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await lockFactory
                        .create(key, {
                            ttl,
                        })
                        .runOrFail(handlerFn);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should call handler function when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockFactory.create(key, { ttl }).acquire();
                    await delayWithBuffer(ttl);

                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await lockFactory.create(key, { ttl }).runOrFail(handlerFn);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should call handler function when key is unexpireable and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await lock.runOrFail(handlerFn);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should call handler function when key is unexpired and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockFactory.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await lock.runOrFail(handlerFn);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should not call handler function when key is unexpireable and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    await lockFactory.create(key, { ttl }).acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await lockFactory
                            .create(key, { ttl })
                            .runOrFail(handlerFn);
                    } catch (error: unknown) {
                        if (!(error instanceof FailedAcquireLockError)) {
                            throw error;
                        }
                    }

                    await delay(delayBuffer);
                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should not call handler function when key is unexpired and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockFactory.create(key, { ttl }).acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await lockFactory
                            .create(key, { ttl })
                            .runOrFail(handlerFn);
                    } catch (error: unknown) {
                        if (!(error instanceof FailedAcquireLockError)) {
                            throw error;
                        }
                    }

                    await delay(delayBuffer);
                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should return value when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const result = await lockFactory
                        .create(key, {
                            ttl,
                        })
                        .runOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should return value when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockFactory.create(key, { ttl }).acquire();
                    await delayWithBuffer(ttl);

                    const result = await lockFactory
                        .create(key, { ttl })
                        .runOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should not throw error when key is unexpireable and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();
                    const result = await lock.runOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should not throw error when key is unexpired and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockFactory.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    const result = await lock.runOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should throw FailedAcquireLockError when key is unexpireable and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    await lockFactory.create(key, { ttl }).acquire();
                    const result = lockFactory
                        .create(key, { ttl })
                        .runOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    await expect(result).rejects.toBeInstanceOf(
                        FailedAcquireLockError,
                    );
                });
                test("Should throw FailedAcquireLockError when key is unexpired and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockFactory.create(key, { ttl }).acquire();
                    const result = lockFactory
                        .create(key, { ttl })
                        .runOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    await expect(result).rejects.toBeInstanceOf(
                        FailedAcquireLockError,
                    );
                });
            });
            describe("method: acquire", () => {
                test("Should return true when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const result = await lockFactory
                        .create(key, {
                            ttl,
                        })
                        .acquire();

                    expect(result).toBe(true);
                });
                test("Should return true when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockFactory.create(key, { ttl }).acquire();
                    await delayWithBuffer(ttl);

                    const result = await lockFactory
                        .create(key, { ttl })
                        .acquire();
                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpireable and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();
                    const result = await lock.acquire();

                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpired and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockFactory.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    const result = await lock.acquire();

                    expect(result).toBe(true);
                });
                test("Should return false when key is unexpireable and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    await lockFactory.create(key, { ttl }).acquire();
                    const result = await lockFactory
                        .create(key, { ttl })
                        .acquire();

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpired and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockFactory.create(key, { ttl }).acquire();
                    const result = await lockFactory
                        .create(key, { ttl })
                        .acquire();

                    expect(result).toBe(false);
                });
            });
            describe("method: acquireOrFail", () => {
                test("Should not throw error when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const result = lockFactory
                        .create(key, {
                            ttl,
                        })
                        .acquireOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockFactory.create(key, { ttl }).acquireOrFail();
                    await delayWithBuffer(ttl);

                    const result = lockFactory
                        .create(key, { ttl })
                        .acquireOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is unexpireable and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquireOrFail();
                    const result = lock.acquireOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is unexpired and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockFactory.create(key, {
                        ttl,
                    });
                    await lock.acquireOrFail();
                    const result = lock.acquireOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should throw FailedAcquireLockError when key is unexpireable and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    await lockFactory.create(key, { ttl }).acquireOrFail();
                    const result = lockFactory
                        .create(key, { ttl })
                        .acquireOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedAcquireLockError,
                    );
                });
                test("Should throw FailedAcquireLockError when key is unexpired and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockFactory.create(key, { ttl }).acquireOrFail();
                    const result = lockFactory
                        .create(key, { ttl })
                        .acquireOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedAcquireLockError,
                    );
                });
            });
            describe("method: release", () => {
                test("Should return false when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const result = await lockFactory
                        .create(key, {
                            ttl,
                        })
                        .release();

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpireable and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    await lockFactory.create(key, { ttl }).acquire();

                    const result = await lockFactory
                        .create(key, { ttl })
                        .release();

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpired and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await lockFactory.create(key, { ttl }).acquire();

                    const result = await lockFactory
                        .create(key, { ttl })
                        .release();

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await lockFactory.create(key, { ttl }).acquire();
                    await delayWithBuffer(ttl);

                    const result = await lockFactory
                        .create(key, { ttl })
                        .release();

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();
                    await delayWithBuffer(ttl);

                    const result = await lock.release();

                    expect(result).toBe(false);
                });
                test("Should return true when key is unexpireable and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();

                    const result = await lock.release();

                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpired and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();

                    const result = await lock.release();

                    expect(result).toBe(true);
                });
                test("Should not be reacquirable when key is unexpireable and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();

                    const lock2 = lockFactory.create(key, { ttl });
                    await lock2.release();
                    const result = await lock2.acquire();

                    expect(result).toBe(false);
                });
                test("Should not be reacquirable when key is unexpired and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();

                    const lock2 = lockFactory.create(key, { ttl });
                    await lock2.release();
                    const result = await lock2.acquire();

                    expect(result).toBe(false);
                });
                test("Should be reacquirable when key is unexpireable and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();
                    await lock1.release();

                    const lock2 = lockFactory.create(key, { ttl });
                    const result = await lock2.acquire();

                    expect(result).toBe(true);
                });
                test("Should be reacquirable when key is unexpired and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();
                    await lock1.release();

                    const lock2 = lockFactory.create(key, { ttl });
                    const result = await lock2.acquire();

                    expect(result).toBe(true);
                });
            });
            describe("method: releaseOrFail", () => {
                test("Should throw FailedReleaseLockError when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const result = lockFactory
                        .create(key, {
                            ttl,
                        })
                        .releaseOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseLockError,
                    );
                });
                test("Should throw FailedReleaseLockError when key is unexpireable and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    await lockFactory.create(key, { ttl }).acquire();

                    const result = lockFactory
                        .create(key, { ttl })
                        .releaseOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseLockError,
                    );
                });
                test("Should throw FailedReleaseLockError when key is unexpired and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await lockFactory.create(key, { ttl }).acquire();

                    const result = lockFactory
                        .create(key, { ttl })
                        .releaseOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseLockError,
                    );
                });
                test("Should throw FailedReleaseLockError when key is expired and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await lockFactory.create(key, { ttl }).acquire();
                    await delayWithBuffer(ttl);

                    const result = lockFactory
                        .create(key, { ttl })
                        .releaseOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseLockError,
                    );
                });
                test("Should throw FailedReleaseLockError when key is expired and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();
                    await delayWithBuffer(ttl);

                    const result = lock.releaseOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseLockError,
                    );
                });
                test("Should not throw error when key is unexpireable and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();

                    const result = lock.releaseOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is unexpired and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();

                    const result = lock.releaseOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not be reacquirable when key is unexpireable and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();

                    const lock2 = lockFactory.create(key, { ttl });
                    try {
                        await lock2.releaseOrFail();
                    } catch (error: unknown) {
                        if (!(error instanceof FailedReleaseLockError)) {
                            throw error;
                        }
                    }
                    const result = await lock2.acquire();

                    expect(result).toBe(false);
                });
                test("Should not be reacquirable when key is unexpired and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();

                    const lock2 = lockFactory.create(key, { ttl });
                    try {
                        await lock2.releaseOrFail();
                    } catch (error: unknown) {
                        if (!(error instanceof FailedReleaseLockError)) {
                            throw error;
                        }
                    }
                    const result = await lock2.acquire();

                    expect(result).toBe(false);
                });
                test("Should be reacquirable when key is unexpireable and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();
                    await lock1.releaseOrFail();

                    const lock2 = lockFactory.create(key, { ttl });
                    const result = await lock2.acquire();

                    expect(result).toBe(true);
                });
                test("Should be reacquirable when key is unexpired and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();
                    await lock1.releaseOrFail();

                    const lock2 = lockFactory.create(key, { ttl });
                    const result = await lock2.acquire();

                    expect(result).toBe(true);
                });
            });
            describe("method: forceRelease", () => {
                test("Should return false when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const result = await lockFactory
                        .create(key, {
                            ttl,
                        })
                        .forceRelease();

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockFactory.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    await delayWithBuffer(ttl);

                    const result = await lock.forceRelease();
                    expect(result).toBe(false);
                });
                test("Should return true when key is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();

                    const result = await lock.forceRelease();
                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();

                    const result = await lock.forceRelease();
                    expect(result).toBe(true);
                });
                test("Should be reacquirable when key is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();
                    await lock.forceRelease();

                    const result = await lock.acquire();
                    expect(result).toBe(true);
                });
                test("Should be reacquirable when key is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();
                    await lock.forceRelease();

                    const result = await lock.acquire();
                    expect(result).toBe(true);
                });
            });
            describe("method: refresh", () => {
                test("Should return false when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = await lockFactory
                        .create(key, {
                            ttl,
                        })
                        .refresh(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpireable and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockFactory.create(key, { ttl });
                    const result = await lock2.refresh(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpired and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockFactory.create(key, { ttl });
                    const result = await lock2.refresh(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();
                    await delayWithBuffer(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockFactory.create(key, { ttl });
                    const result = await lock2.refresh(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockFactory.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    await delayWithBuffer(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = await lock.refresh(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpireable and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = await lock.refresh(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return true when key is unexpired and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = await lock.refresh(newTtl);

                    expect(result).toBe(true);
                });
                test("Should not update expiration when key is unexpireable and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMilliseconds(50);
                    await lock1.refresh(newTtl);
                    await delayWithBuffer(newTtl);
                    const lock2 = lockFactory.create(key, { ttl });
                    const result = await lock2.acquire();

                    expect(result).toBe(false);
                });
                test("Should update expiration when key is unexpired and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    await lock1.refresh(newTtl);
                    await delayWithBuffer(newTtl.divide(2));

                    const lock2 = lockFactory.create(key, { ttl });
                    const result1 = await lock2.acquire();
                    expect(result1).toBe(false);

                    await delayWithBuffer(newTtl.divide(2));
                    const result2 = await lock2.acquire();
                    expect(result2).toBe(true);
                });
            });
            describe("method: refreshOrFail", () => {
                test("Should throw FailedRefreshLockError when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = lockFactory
                        .create(key, {
                            ttl,
                        })
                        .refreshOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshLockError,
                    );
                });
                test("Should throw FailedRefreshLockError when key is unexpireable and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockFactory.create(key, { ttl });
                    const result = lock2.refreshOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshLockError,
                    );
                });
                test("Should throw FailedRefreshLockError when key is unexpired and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockFactory.create(key, { ttl });
                    const result = lock2.refreshOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshLockError,
                    );
                });
                test("Should throw FailedRefreshLockError when key is expired and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();
                    await delayWithBuffer(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockFactory.create(key, { ttl });
                    const result = lock2.refreshOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshLockError,
                    );
                });
                test("Should throw FailedRefreshLockError when key is expired and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockFactory.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    await delayWithBuffer(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = lock.refreshOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshLockError,
                    );
                });
                test("Should throw FailedRefreshLockError when key is unexpireable and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = lock.refreshOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshLockError,
                    );
                });
                test("Should not throw error when key is unexpired and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockFactory.create(key, { ttl });
                    await lock.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = lock.refreshOrFail(newTtl);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not update expiration when key is unexpireable and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMilliseconds(50);
                    try {
                        await lock1.refreshOrFail(newTtl);
                    } catch (error: unknown) {
                        if (!(error instanceof FailedRefreshLockError)) {
                            throw error;
                        }
                    }
                    await delayWithBuffer(newTtl);
                    const lock2 = lockFactory.create(key, { ttl });
                    const result = await lock2.acquire();

                    expect(result).toBe(false);
                });
                test("Should update expiration when key is unexpired and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockFactory.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    await lock1.refreshOrFail(newTtl);
                    await delayWithBuffer(newTtl.divide(2));

                    const lock2 = lockFactory.create(key, { ttl });
                    const result1 = await lock2.acquire();
                    expect(result1).toBe(false);

                    await delayWithBuffer(newTtl.divide(2));
                    const result2 = await lock2.acquire();
                    expect(result2).toBe(true);
                });
            });
            describe("method: id", () => {
                test("Should return lock id of ILock instance", () => {
                    const key = "a";
                    const lockId = "1";

                    const lock = lockFactory.create(key, {
                        lockId,
                    });

                    expect(lock.id).toBe(lockId);
                });
                test("Should return lock id of ILock instance implicitly", () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockFactory.create(key, {
                        ttl,
                    });

                    expect(lock.id).toBeTypeOf("string");
                    expect(lock.id.length).toBeGreaterThan(0);
                });
            });
            describe("method: ttl", () => {
                test("Should return null when given null ttl", () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockFactory.create(key, {
                        ttl,
                    });

                    expect(lock.ttl).toBeNull();
                });
                test("Should return TimeSpan when given TimeSpan", () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(100);

                    const lock = lockFactory.create(key, {
                        ttl,
                    });

                    expect(lock.ttl).toBeInstanceOf(TimeSpan);
                    expect(lock.ttl?.[TO_MILLISECONDS]()).toBe(
                        ttl.toMilliseconds(),
                    );
                });
            });
            describe("method: getState", () => {
                test("Should return ILockExpiredState when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockFactory.create(key, {
                        ttl,
                    });

                    const result = await lock.getState();

                    expect(result).toEqual({
                        type: LOCK_STATE.EXPIRED,
                    } satisfies ILockExpiredState);
                });
                test("Should return ILockExpiredState when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockFactory.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    await delayWithBuffer(ttl);

                    const result = await lock.getState();

                    expect(result).toEqual({
                        type: LOCK_STATE.EXPIRED,
                    } satisfies ILockExpiredState);
                });
                test("Should return ILockExpiredState when key is released with forceRelease method", async () => {
                    const key = "a";

                    const ttl1 = null;
                    const lock1 = lockFactory.create(key, {
                        ttl: ttl1,
                    });
                    await lock1.acquire();

                    const ttl2 = null;
                    const lock2 = lockFactory.create(key, {
                        ttl: ttl2,
                    });
                    await lock2.acquire();

                    await lock2.forceRelease();

                    const result = await lock1.getState();

                    expect(result).toEqual({
                        type: LOCK_STATE.EXPIRED,
                    } satisfies ILockExpiredState);
                });
                test("Should return ILockExpiredState when key is released with release method", async () => {
                    const key = "a";

                    const ttl1 = null;
                    const lock1 = lockFactory.create(key, {
                        ttl: ttl1,
                    });
                    await lock1.acquire();

                    const ttl2 = null;
                    const lock2 = lockFactory.create(key, {
                        ttl: ttl2,
                    });
                    await lock2.acquire();

                    await lock1.release();
                    await lock2.release();

                    const result = await lock2.getState();

                    expect(result).toEqual({
                        type: LOCK_STATE.EXPIRED,
                    } satisfies ILockExpiredState);
                });
                test("Should return ILockAcquiredState when key is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockFactory.create(key, {
                        ttl,
                    });
                    await lock.acquire();

                    const state = await lock.getState();

                    expect(state).toEqual({
                        type: LOCK_STATE.ACQUIRED,
                        remainingTime: ttl,
                    } satisfies ILockAcquiredState);
                });
                test("Should return ILockAcquiredState when key is unexpired", async () => {
                    expect.addEqualityTesters([
                        createIsTimeSpanEqualityTester(timeSpanEqualityBuffer),
                    ]);

                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockFactory.create(key, {
                        ttl,
                    });
                    await lock.acquire();

                    const state = await lock.getState();

                    expect(state).toEqual({
                        type: LOCK_STATE.ACQUIRED,
                        remainingTime: ttl,
                    } satisfies ILockAcquiredState);
                });
                test("Should return ILockUnavailableState when key is acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockFactory.create(key, {
                        ttl,
                    });
                    await lock1.acquire();

                    const lock2 = lockFactory.create(key, {
                        ttl,
                    });
                    const state = await lock2.getState();

                    expect(state).toEqual({
                        type: LOCK_STATE.UNAVAILABLE,
                        owner: lock1.id,
                    } satisfies ILockUnavailableState);
                });
            });
        });
        describe.skipIf(excludeSerdeTests)("Serde tests:", () => {
            test("Should return ILockExpiredState when is derserialized and key doesnt exists", async () => {
                const key = "a";
                const ttl = TimeSpan.fromMilliseconds(50);

                const lock = lockFactory.create(key, {
                    ttl,
                });
                const deserializedLock = serde.deserialize<ILock>(
                    serde.serialize(lock),
                );
                const result = await deserializedLock.getState();

                expect(result).toEqual({
                    type: LOCK_STATE.EXPIRED,
                } satisfies ILockExpiredState);
            });
            test("Should return ILockExpiredState when is derserialized and key is expired", async () => {
                const key = "a";
                const ttl = TimeSpan.fromMilliseconds(50);

                const lock = lockFactory.create(key, {
                    ttl,
                });
                await lock.acquire();
                await delayWithBuffer(ttl);

                const deserializedLock = serde.deserialize<ILock>(
                    serde.serialize(lock),
                );
                const result = await deserializedLock.getState();

                expect(result).toEqual({
                    type: LOCK_STATE.EXPIRED,
                } satisfies ILockExpiredState);
            });
            test("Should return ILockExpiredState when is derserialized and all key is released with forceRelease method", async () => {
                const key = "a";

                const ttl1 = null;
                const lock1 = lockFactory.create(key, {
                    ttl: ttl1,
                });
                await lock1.acquire();

                const ttl2 = null;
                const lock2 = lockFactory.create(key, {
                    ttl: ttl2,
                });
                await lock2.acquire();

                await lock2.forceRelease();

                const deserializedLock1 = serde.deserialize<ILock>(
                    serde.serialize(lock1),
                );
                const result = await deserializedLock1.getState();

                expect(result).toEqual({
                    type: LOCK_STATE.EXPIRED,
                } satisfies ILockExpiredState);
            });
            test("Should return ILockExpiredState when is derserialized and all key is released with release method", async () => {
                const key = "a";

                const ttl1 = null;
                const lock1 = lockFactory.create(key, {
                    ttl: ttl1,
                });
                await lock1.acquire();

                const ttl2 = null;
                const lock2 = lockFactory.create(key, {
                    ttl: ttl2,
                });
                await lock2.acquire();

                await lock1.release();
                await lock2.release();

                const deserializedLock2 = serde.deserialize<ILock>(
                    serde.serialize(lock2),
                );
                const result = await deserializedLock2.getState();

                expect(result).toEqual({
                    type: LOCK_STATE.EXPIRED,
                } satisfies ILockExpiredState);
            });
            test("Should return ILockAcquiredState when is derserialized and key is unexpireable", async () => {
                const key = "a";
                const ttl = null;
                const lock = lockFactory.create(key, {
                    ttl,
                });
                await lock.acquire();

                const deserializedLock = serde.deserialize<ILock>(
                    serde.serialize(lock),
                );
                const state = await deserializedLock.getState();

                expect(state).toEqual({
                    type: LOCK_STATE.ACQUIRED,
                    remainingTime: ttl,
                } satisfies ILockAcquiredState);
            });
            test("Should return ILockAcquiredState when is derserialized and key is unexpired", async () => {
                expect.addEqualityTesters([
                    createIsTimeSpanEqualityTester(timeSpanEqualityBuffer),
                ]);

                const key = "a";
                const ttl = TimeSpan.fromMilliseconds(50);
                const lock = lockFactory.create(key, {
                    ttl,
                });
                await lock.acquire();

                const deserializedLock = serde.deserialize<ILock>(
                    serde.serialize(lock),
                );
                const state = await deserializedLock.getState();

                expect(state).toEqual({
                    type: LOCK_STATE.ACQUIRED,
                    remainingTime: ttl,
                } satisfies ILockAcquiredState);
            });
            test("Should return ILockUnavailableState when is derserialized and key is acquired by different lock-id", async () => {
                const key = "a";
                const ttl = null;
                const lock1 = lockFactory.create(key, {
                    ttl,
                });
                await lock1.acquire();

                const lock2 = lockFactory.create(key, {
                    ttl,
                });
                const deserializedLock2 = serde.deserialize<ILock>(
                    serde.serialize(lock2),
                );
                const state = await deserializedLock2.getState();

                expect(state).toEqual({
                    type: LOCK_STATE.UNAVAILABLE,
                    owner: lock1.id,
                } satisfies ILockUnavailableState);
            });
        });
    });
}
