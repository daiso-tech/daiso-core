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
    LOCK_EVENTS,
    FailedRefreshLockError,
    LOCK_STATE,
    type AcquiredLockEvent,
    type FailedRefreshLockEvent,
    type FailedReleaseLockEvent,
    type ForceReleasedLockEvent,
    type ILock,
    type ILockAcquiredState,
    type ILockExpiredState,
    type ILockStateMethods,
    type ILockProvider,
    type ILockUnavailableState,
    type RefreshedLockEvent,
    type ReleasedLockEvent,
    type UnavailableLockEvent,
} from "@/lock/contracts/_module.js";
import { type ISerde } from "@/serde/contracts/_module.js";
import { Task } from "@/task/implementations/_module.js";
import {
    TO_MILLISECONDS,
    type ITimeSpan,
} from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/test-utilities"`
 * @group Utilities
 */
export type LockProviderTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createLockProvider: () => Promisable<{
        lockProvider: ILockProvider;
        serde: ISerde;
    }>;

    /**
     * @default true
     */
    excludeSerdeTests?: boolean;

    /**
     * @default true
     */
    excludeEventTests?: boolean;

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
};

/**
 * The `lockProviderTestSuite` function simplifies the process of testing your custom implementation of {@link ILock | `ILock`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/test-utilities"`
 * @group Utilities
 * @example
 * ```ts
 * import { describe, expect, test, beforeEach } from "vitest";
 * import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";
 * import { LockProvider } from "@daiso-tech/core/lock";
 * import { EventBus } from "@daiso-tech/core/event-bus";
 * import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
 * import { lockProviderTestSuite } from "@daiso-tech/core/lock/test-utilities";
 * import { Serde } from "@daiso-tech/core/serde";
 * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
 * import type { ILockData } from "@daiso-tech/core/lock/contracts";
 *
 * describe("class: LockProvider", () => {
 *     lockProviderTestSuite({
 *         createLockProvider: () => {
 *             const serde = new Serde(new SuperJsonSerdeAdapter());
 *             const lockProvider = new LockProvider({
 *                 serde,
 *                 adapter: new MemoryLockAdapter(),
 *             });
 *             return { lockProvider, serde };
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
export function lockProviderTestSuite(
    settings: LockProviderTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createLockProvider,
        describe,
        beforeEach,
        excludeEventTests = false,
        excludeSerdeTests = false,
        retry = 0,
        delayBuffer = TimeSpan.fromMilliseconds(10),
    } = settings;

    let lockProvider: ILockProvider;
    let serde: ISerde;

    async function delay(time: ITimeSpan): Promise<void> {
        await Task.delay(TimeSpan.fromTimeSpan(time).addTimeSpan(delayBuffer));
    }

    const RETURN_VALUE = "RETURN_VALUE";
    describe("ILockProvider tests:", () => {
        beforeEach(async () => {
            const { lockProvider: lockProvider_, serde: serde_ } =
                await createLockProvider();
            lockProvider = lockProvider_;
            serde = serde_;
        });
        describe("Api tests:", () => {
            describe("method: runOrFail", () => {
                test("Should call acquireOrFail method", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockProvider.create(key, {
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
                    const lock = lockProvider.create(key, {
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
                    const lock = lockProvider.create(key, {
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
                    const lock = lockProvider.create(key, {
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
                    const lock = lockProvider.create(key, {
                        ttl,
                    });

                    const releaseSpy = vi.spyOn(lock, "release");

                    try {
                        await lock.runOrFail(() => {
                            return Promise.reject(new Error());
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(releaseSpy).toHaveBeenCalledTimes(1);
                });
                test("Should propagate thrown error", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockProvider.create(key, {
                        ttl,
                    });

                    class CustomError extends Error {}

                    const error = lock.runOrFail(() => {
                        return Promise.reject(new CustomError());
                    });

                    await expect(error).rejects.toBeInstanceOf(CustomError);
                });
                test("Should call handler function when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await lockProvider
                        .create(key, {
                            ttl,
                        })
                        .runOrFail(handlerFn);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should call handler function when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    await delay(ttl);

                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await lockProvider
                        .create(key, { ttl })
                        .runOrFail(handlerFn);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should call handler function when key is unexpireable and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await lock.runOrFail(handlerFn);
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should call handler function when key is unexpired and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await lock.runOrFail(handlerFn);
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should not call handler function when key is unexpireable and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    await lockProvider.create(key, { ttl }).acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await lockProvider
                            .create(key, { ttl })
                            .runOrFail(handlerFn);
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should not call handler function when key is unexpired and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await lockProvider
                            .create(key, { ttl })
                            .runOrFail(handlerFn);
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should return value when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const result = await lockProvider
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

                    await lockProvider.create(key, { ttl }).acquire();
                    await delay(ttl);

                    const result = await lockProvider
                        .create(key, { ttl })
                        .runOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should not throw error when key is unexpireable and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();
                    const result = await lock.runOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should not throw error when key is unexpired and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, {
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

                    await lockProvider.create(key, { ttl }).acquire();
                    const result = lockProvider
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

                    await lockProvider.create(key, { ttl }).acquire();
                    const result = lockProvider
                        .create(key, { ttl })
                        .runOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    await expect(result).rejects.toBeInstanceOf(
                        FailedAcquireLockError,
                    );
                });
            });
            describe("method: runBlockingOrFail", () => {
                test("Should call acquireBlockingOrFail method", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockProvider.create(key, {
                        ttl,
                    });

                    const acquireSpy = vi.spyOn(lock, "acquireBlockingOrFail");

                    await lock.runBlockingOrFail(
                        () => {
                            return Promise.resolve(RETURN_VALUE);
                        },
                        {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        },
                    );

                    expect(acquireSpy).toHaveBeenCalledTimes(1);
                });
                test("Should call acquireBlockingOrFail before release method", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockProvider.create(key, {
                        ttl,
                    });

                    const acquireSpy = vi.spyOn(lock, "acquireBlockingOrFail");
                    const releaseSpy = vi.spyOn(lock, "release");

                    await lock.runBlockingOrFail(
                        () => {
                            return Promise.resolve(RETURN_VALUE);
                        },
                        {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        },
                    );

                    expect(acquireSpy).toHaveBeenCalledBefore(releaseSpy);
                });
                test("Should call release method", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockProvider.create(key, {
                        ttl,
                    });

                    const releaseSpy = vi.spyOn(lock, "release");

                    await lock.runBlockingOrFail(
                        () => {
                            return Promise.resolve(RETURN_VALUE);
                        },
                        {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        },
                    );

                    expect(releaseSpy).toHaveBeenCalledTimes(1);
                });
                test("Should call release after acquireBlockingOrFail method", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockProvider.create(key, {
                        ttl,
                    });

                    const releaseSpy = vi.spyOn(lock, "release");
                    const acquireSpy = vi.spyOn(lock, "acquireBlockingOrFail");

                    await lock.runBlockingOrFail(
                        () => {
                            return Promise.resolve(RETURN_VALUE);
                        },
                        {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        },
                    );

                    expect(releaseSpy).toHaveBeenCalledAfter(acquireSpy);
                });
                test("Should call release when an error is thrown", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockProvider.create(key, {
                        ttl,
                    });

                    const releaseSpy = vi.spyOn(lock, "release");

                    try {
                        await lock.runBlockingOrFail(
                            () => {
                                return Promise.reject(new Error());
                            },
                            {
                                time: TimeSpan.fromMilliseconds(5),
                                interval: TimeSpan.fromMilliseconds(5),
                            },
                        );
                    } catch {
                        /* EMPTY */
                    }

                    expect(releaseSpy).toHaveBeenCalledTimes(1);
                });
                test("Should propagate thrown error", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockProvider.create(key, {
                        ttl,
                    });

                    class CustomError extends Error {}

                    const error = lock.runBlockingOrFail(
                        () => {
                            return Promise.reject(new CustomError());
                        },
                        {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        },
                    );

                    await expect(error).rejects.toBeInstanceOf(CustomError);
                });
                test("Should call handler function when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await lockProvider
                        .create(key, {
                            ttl,
                        })
                        .runBlockingOrFail(handlerFn, {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should call handler function when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    await delay(ttl);

                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await lockProvider
                        .create(key, { ttl })
                        .runBlockingOrFail(handlerFn, {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should call handler function when key is unexpireable and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await lock.runBlockingOrFail(handlerFn, {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should call handler function when key is unexpired and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await lock.runBlockingOrFail(handlerFn, {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should not call handler function when key is unexpireable and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    await lockProvider.create(key, { ttl }).acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await lockProvider
                            .create(key, { ttl })
                            .runBlockingOrFail(handlerFn, {
                                time: TimeSpan.fromMilliseconds(5),
                                interval: TimeSpan.fromMilliseconds(5),
                            });
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should not call handler function when key is unexpired and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await lockProvider
                            .create(key, { ttl })
                            .runBlockingOrFail(handlerFn, {
                                time: TimeSpan.fromMilliseconds(5),
                                interval: TimeSpan.fromMilliseconds(5),
                            });
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should return value when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const result = await lockProvider
                        .create(key, {
                            ttl,
                        })
                        .runBlockingOrFail(
                            () => {
                                return Promise.resolve(RETURN_VALUE);
                            },
                            {
                                time: TimeSpan.fromMilliseconds(5),
                                interval: TimeSpan.fromMilliseconds(5),
                            },
                        );

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should return value when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    await delay(ttl);

                    const result = await lockProvider
                        .create(key, { ttl })
                        .runBlockingOrFail(
                            () => {
                                return Promise.resolve(RETURN_VALUE);
                            },
                            {
                                time: TimeSpan.fromMilliseconds(5),
                                interval: TimeSpan.fromMilliseconds(5),
                            },
                        );

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should return value when key is unexpireable and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();
                    const result = await lock.runBlockingOrFail(
                        () => {
                            return Promise.resolve(RETURN_VALUE);
                        },
                        {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        },
                    );

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should return value when key is unexpired and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    const result = await lock.runBlockingOrFail(
                        () => {
                            return Promise.resolve(RETURN_VALUE);
                        },
                        {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        },
                    );

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should throw FailedAcquireLockError when key is unexpireable and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    await lockProvider.create(key, { ttl }).acquire();
                    const result = lockProvider
                        .create(key, { ttl })
                        .runBlockingOrFail(
                            () => {
                                return Promise.resolve(RETURN_VALUE);
                            },
                            {
                                time: TimeSpan.fromMilliseconds(5),
                                interval: TimeSpan.fromMilliseconds(5),
                            },
                        );

                    await expect(result).rejects.toBeInstanceOf(
                        FailedAcquireLockError,
                    );
                });
                test("Should throw FailedAcquireLockError when key is unexpired and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    const result = lockProvider
                        .create(key, { ttl })
                        .runBlockingOrFail(
                            () => {
                                return Promise.resolve(RETURN_VALUE);
                            },
                            {
                                time: TimeSpan.fromMilliseconds(5),
                                interval: TimeSpan.fromMilliseconds(5),
                            },
                        );

                    await expect(result).rejects.toBeInstanceOf(
                        FailedAcquireLockError,
                    );
                });
                test("Should retry acquire the lock", { retry }, async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, {
                        ttl,
                    });

                    await lock1.acquire();
                    const handlerFn = vi.fn(() => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.UNAVAILABLE,
                        handlerFn,
                    );
                    const lock2 = lockProvider.create(key, {
                        ttl,
                    });
                    try {
                        await lock2.runBlockingOrFail(
                            () => {
                                return Promise.resolve(RETURN_VALUE);
                            },
                            {
                                time: TimeSpan.fromMilliseconds(55),
                                interval: TimeSpan.fromMilliseconds(5),
                            },
                        );
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn.mock.calls.length).toBeGreaterThan(1);
                });
            });
            describe("method: acquire", () => {
                test("Should return true when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const result = await lockProvider
                        .create(key, {
                            ttl,
                        })
                        .acquire();

                    expect(result).toBe(true);
                });
                test("Should return true when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    await delay(ttl);

                    const result = await lockProvider
                        .create(key, { ttl })
                        .acquire();
                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpireable and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();
                    const result = await lock.acquire();

                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpired and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    const result = await lock.acquire();

                    expect(result).toBe(true);
                });
                test("Should return false when key is unexpireable and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    await lockProvider.create(key, { ttl }).acquire();
                    const result = await lockProvider
                        .create(key, { ttl })
                        .acquire();

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpired and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    const result = await lockProvider
                        .create(key, { ttl })
                        .acquire();

                    expect(result).toBe(false);
                });
            });
            describe("method: acquireOrFail", () => {
                test("Should not throw error when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const result = lockProvider
                        .create(key, {
                            ttl,
                        })
                        .acquireOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquireOrFail();
                    await delay(ttl);

                    const result = lockProvider
                        .create(key, { ttl })
                        .acquireOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is unexpireable and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquireOrFail();
                    const result = lock.acquireOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is unexpired and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquireOrFail();
                    const result = lock.acquireOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should throw FailedAcquireLockError when key is unexpireable and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    await lockProvider.create(key, { ttl }).acquireOrFail();
                    const result = lockProvider
                        .create(key, { ttl })
                        .acquireOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedAcquireLockError,
                    );
                });
                test("Should throw FailedAcquireLockError when key is unexpired and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquireOrFail();
                    const result = lockProvider
                        .create(key, { ttl })
                        .acquireOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedAcquireLockError,
                    );
                });
            });
            describe("method: acquireBlocking", () => {
                test("Should return true when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const result = await lockProvider
                        .create(key, {
                            ttl,
                        })
                        .acquireBlocking({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                    expect(result).toBe(true);
                });
                test("Should return true when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    await delay(ttl);

                    const result = await lockProvider
                        .create(key, { ttl })
                        .acquireBlocking({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });
                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpireable and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();
                    const result = await lock.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpired and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    const result = await lock.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(result).toBe(true);
                });
                test("Should return false when key is unexpireable and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    await lockProvider.create(key, { ttl }).acquire();
                    const result = await lockProvider
                        .create(key, { ttl })
                        .acquireBlocking({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpired and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    const result = await lockProvider
                        .create(key, { ttl })
                        .acquireBlocking({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                    expect(result).toBe(false);
                });
                test("Should retry acquire the lock", { retry }, async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, {
                        ttl,
                    });

                    await lock1.acquire();
                    const handlerFn = vi.fn(() => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.UNAVAILABLE,
                        handlerFn,
                    );
                    const lock2 = lockProvider.create(key, {
                        ttl,
                    });
                    await lock2.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(55),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(handlerFn.mock.calls.length).toBeGreaterThan(1);
                });
            });
            describe("method: acquireBlockingOrFail", () => {
                test("Should not throw error when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const result = lockProvider
                        .create(key, {
                            ttl,
                        })
                        .acquireBlockingOrFail({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    await delay(ttl);

                    const result = lockProvider
                        .create(key, { ttl })
                        .acquireBlockingOrFail({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is unexpireable and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();
                    const result = lock.acquireBlockingOrFail({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is unexpired and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    const result = lock.acquireBlockingOrFail({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should throw FailedAcquireLockError when key is unexpireable and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    await lockProvider.create(key, { ttl }).acquire();
                    const result = lockProvider
                        .create(key, { ttl })
                        .acquireBlockingOrFail({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                    await expect(result).rejects.toBeInstanceOf(
                        FailedAcquireLockError,
                    );
                });
                test("Should throw FailedAcquireLockError when key is unexpired and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    const result = lockProvider
                        .create(key, { ttl })
                        .acquireBlockingOrFail({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                    await expect(result).rejects.toBeInstanceOf(
                        FailedAcquireLockError,
                    );
                });
                test("Should retry acquire the lock", { retry }, async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, {
                        ttl,
                    });

                    await lock1.acquire();
                    const handlerFn = vi.fn(() => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.UNAVAILABLE,
                        handlerFn,
                    );
                    const lock2 = lockProvider.create(key, {
                        ttl,
                    });
                    try {
                        await lock2.acquireBlockingOrFail({
                            time: TimeSpan.fromMilliseconds(55),
                            interval: TimeSpan.fromMilliseconds(5),
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn.mock.calls.length).toBeGreaterThan(1);
                });
            });
            describe("method: release", () => {
                test("Should return false when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const result = await lockProvider
                        .create(key, {
                            ttl,
                        })
                        .release();

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpireable and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    await lockProvider.create(key, { ttl }).acquire();

                    const result = await lockProvider
                        .create(key, { ttl })
                        .release();

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpired and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await lockProvider.create(key, { ttl }).acquire();

                    const result = await lockProvider
                        .create(key, { ttl })
                        .release();

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await lockProvider.create(key, { ttl }).acquire();

                    const result = await lockProvider
                        .create(key, { ttl })
                        .release();
                    await delay(ttl);

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();
                    await delay(ttl);

                    const result = await lock.release();

                    expect(result).toBe(false);
                });
                test("Should return true when key is unexpireable and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();

                    const result = await lock.release();

                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpired and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();

                    const result = await lock.release();

                    expect(result).toBe(true);
                });
                test("Should not be reacquirable when key is unexpireable and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();

                    const lock2 = lockProvider.create(key, { ttl });
                    await lock2.release();
                    const result = await lock2.acquire();

                    expect(result).toBe(false);
                });
                test("Should not be reacquirable when key is unexpired and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();

                    const lock2 = lockProvider.create(key, { ttl });
                    await lock2.release();
                    const result = await lock2.acquire();

                    expect(result).toBe(false);
                });
                test("Should be reacquirable when key is unexpireable and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();
                    await lock1.release();

                    const lock2 = lockProvider.create(key, { ttl });
                    const result = await lock2.acquire();

                    expect(result).toBe(true);
                });
                test("Should be reacquirable when key is unexpired and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();
                    await lock1.release();

                    const lock2 = lockProvider.create(key, { ttl });
                    const result = await lock2.acquire();

                    expect(result).toBe(true);
                });
            });
            describe("method: releaseOrFail", () => {
                test("Should throw FailedReleaseLockError when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const result = lockProvider
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
                    await lockProvider.create(key, { ttl }).acquire();

                    const result = lockProvider
                        .create(key, { ttl })
                        .releaseOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseLockError,
                    );
                });
                test("Should throw FailedReleaseLockError when key is unexpired and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await lockProvider.create(key, { ttl }).acquire();

                    const result = lockProvider
                        .create(key, { ttl })
                        .releaseOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseLockError,
                    );
                });
                test("Should throw FailedReleaseLockError when key is expired and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await lockProvider.create(key, { ttl }).acquire();

                    const result = lockProvider
                        .create(key, { ttl })
                        .releaseOrFail();
                    await delay(ttl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseLockError,
                    );
                });
                test("Should throw FailedReleaseLockError when key is expired and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();
                    await delay(ttl);

                    const result = lock.releaseOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseLockError,
                    );
                });
                test("Should not throw error when key is unexpireable and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();

                    const result = lock.releaseOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key is unexpired and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();

                    const result = lock.releaseOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not be reacquirable when key is unexpireable and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();

                    const lock2 = lockProvider.create(key, { ttl });
                    try {
                        await lock2.releaseOrFail();
                    } catch {
                        /* EMPTY */
                    }
                    const result = await lock2.acquire();

                    expect(result).toBe(false);
                });
                test("Should not be reacquirable when key is unexpired and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();

                    const lock2 = lockProvider.create(key, { ttl });
                    try {
                        await lock2.releaseOrFail();
                    } catch {
                        /* EMPTY */
                    }
                    const result = await lock2.acquire();

                    expect(result).toBe(false);
                });
                test("Should be reacquirable when key is unexpireable and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();
                    await lock1.releaseOrFail();

                    const lock2 = lockProvider.create(key, { ttl });
                    const result = await lock2.acquire();

                    expect(result).toBe(true);
                });
                test("Should be reacquirable when key is unexpired and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();
                    await lock1.releaseOrFail();

                    const lock2 = lockProvider.create(key, { ttl });
                    const result = await lock2.acquire();

                    expect(result).toBe(true);
                });
            });
            describe("method: forceRelease", () => {
                test("Should return false when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const result = await lockProvider
                        .create(key, {
                            ttl,
                        })
                        .forceRelease();

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    await delay(ttl);

                    const result = await lock.forceRelease();
                    expect(result).toBe(false);
                });
                test("Should return true when key is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();

                    const result = await lock.forceRelease();
                    expect(result).toBe(true);
                });
                test("Should return true when key is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();

                    const result = await lock.forceRelease();
                    expect(result).toBe(true);
                });
                test("Should be reacquirable when key is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();
                    await lock.forceRelease();

                    const result = await lock.acquire();
                    expect(result).toBe(true);
                });
                test("Should be reacquirable when key is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, { ttl });
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
                    const result = await lockProvider
                        .create(key, {
                            ttl,
                        })
                        .refresh(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpireable and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockProvider.create(key, { ttl });
                    const result = await lock2.refresh(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpired and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockProvider.create(key, { ttl });
                    const result = await lock2.refresh(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();
                    await delay(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockProvider.create(key, { ttl });
                    const result = await lock2.refresh(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when key is expired and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    await delay(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = await lock.refresh(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when key is unexpireable and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = await lock.refresh(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return true when key is unexpired and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = await lock.refresh(newTtl);

                    expect(result).toBe(true);
                });
                test("Should not update expiration when key is unexpireable and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMilliseconds(50);
                    await lock1.refresh(newTtl);
                    await delay(newTtl);
                    const lock2 = lockProvider.create(key, { ttl });
                    const result = await lock2.acquire();

                    expect(result).toBe(false);
                });
                test("Should update expiration when key is unexpired and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    await lock1.refresh(newTtl);
                    await delay(newTtl.divide(2));

                    const lock2 = lockProvider.create(key, { ttl });
                    const result1 = await lock2.acquire();
                    expect(result1).toBe(false);

                    await delay(newTtl.divide(2));
                    const result2 = await lock2.acquire();
                    expect(result2).toBe(true);
                });
            });
            describe("method: refreshOrFail", () => {
                test("Should throw FailedRefreshLockError when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = lockProvider
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
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockProvider.create(key, { ttl });
                    const result = lock2.refreshOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshLockError,
                    );
                });
                test("Should throw FailedRefreshLockError when key is unexpired and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockProvider.create(key, { ttl });
                    const result = lock2.refreshOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshLockError,
                    );
                });
                test("Should throw FailedRefreshLockError when key is expired and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();
                    await delay(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockProvider.create(key, { ttl });
                    const result = lock2.refreshOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshLockError,
                    );
                });
                test("Should throw FailedRefreshLockError when key is expired and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    await delay(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = lock.refreshOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshLockError,
                    );
                });
                test("Should throw FailedRefreshLockError when key is unexpireable and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockProvider.create(key, { ttl });
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
                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const result = lock.refreshOrFail(newTtl);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not update expiration when key is unexpireable and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMilliseconds(50);
                    try {
                        await lock1.refreshOrFail(newTtl);
                    } catch {
                        /* EMPTY */
                    }
                    await delay(newTtl);
                    const lock2 = lockProvider.create(key, { ttl });
                    const result = await lock2.acquire();

                    expect(result).toBe(false);
                });
                test("Should update expiration when key is unexpired and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    await lock1.refreshOrFail(newTtl);
                    await delay(newTtl.divide(2));

                    const lock2 = lockProvider.create(key, { ttl });
                    const result1 = await lock2.acquire();
                    expect(result1).toBe(false);

                    await delay(newTtl.divide(2));
                    const result2 = await lock2.acquire();
                    expect(result2).toBe(true);
                });
            });
            describe("method: id", () => {
                test("Should return lock id of ILock instance", () => {
                    const key = "a";
                    const lockId = "1";

                    const lock = lockProvider.create(key, {
                        lockId,
                    });

                    expect(lock.id).toBe(lockId);
                });
                test("Should return lock id of ILock instance implicitly", () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, {
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

                    const lock = lockProvider.create(key, {
                        ttl,
                    });

                    expect(lock.ttl).toBeNull();
                });
                test("Should return TimeSpan when given TimeSpan", () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(100);

                    const lock = lockProvider.create(key, {
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

                    const lock = lockProvider.create(key, {
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

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    await delay(ttl);

                    const result = await lock.getState();

                    expect(result).toEqual({
                        type: LOCK_STATE.EXPIRED,
                    } satisfies ILockExpiredState);
                });
                test("Should return ILockExpiredState when key is released with forceRelease method", async () => {
                    const key = "a";

                    const ttl1 = null;
                    const lock1 = lockProvider.create(key, {
                        ttl: ttl1,
                    });
                    await lock1.acquire();

                    const ttl2 = null;
                    const lock2 = lockProvider.create(key, {
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
                    const lock1 = lockProvider.create(key, {
                        ttl: ttl1,
                    });
                    await lock1.acquire();

                    const ttl2 = null;
                    const lock2 = lockProvider.create(key, {
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
                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();

                    const state = await lock.getState();

                    expect(state).toEqual({
                        type: LOCK_STATE.ACQUIRED,
                        remainingTime: ttl,
                    } satisfies ILockAcquiredState);
                });
                test(
                    "Should return ILockAcquiredState when key is unexpired",
                    { retry },
                    async () => {
                        const key = "a";
                        const ttl = TimeSpan.fromMilliseconds(50);
                        const lock = lockProvider.create(key, {
                            ttl,
                        });
                        await lock.acquire();

                        const state = await lock.getState();

                        expect(state).toEqual({
                            type: LOCK_STATE.ACQUIRED,
                            remainingTime: ttl,
                        } satisfies ILockAcquiredState);
                    },
                );
                test("Should return ILockUnavailableState when key is acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockProvider.create(key, {
                        ttl,
                    });
                    await lock1.acquire();

                    const lock2 = lockProvider.create(key, {
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
        describe.skipIf(excludeEventTests)("Event tests:", () => {
            describe("method: acquire", () => {
                test("Should dispatch AcquiredLockEvent when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    const handlerFn = vi.fn((_event: AcquiredLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.ACQUIRED,
                        handlerFn,
                    );
                    await lock.acquire();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies AcquiredLockEvent),
                    );
                });
                test("Should dispatch AcquiredLockEvent when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    await delay(ttl);

                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn((_event: AcquiredLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.ACQUIRED,
                        handlerFn,
                    );
                    await lock.acquire();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies AcquiredLockEvent),
                    );
                });
                test("Should dispatch AcquiredLockEvent when key is unexpireable and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();
                    const handlerFn = vi.fn((_event: AcquiredLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.ACQUIRED,
                        handlerFn,
                    );
                    await lock.acquire();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies AcquiredLockEvent),
                    );
                });
                test("Should dispatch AcquiredLockEvent when key is unexpired and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    const handlerFn = vi.fn((_event: AcquiredLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.ACQUIRED,
                        handlerFn,
                    );
                    await lock.acquire();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies AcquiredLockEvent),
                    );
                });
                test("Should dispatch UnavailableLockEvent when key is unexpireable and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    await lockProvider.create(key, { ttl }).acquire();
                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    const handlerFn = vi.fn(
                        (_event: UnavailableLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.UNAVAILABLE,
                        handlerFn,
                    );
                    await lock.acquire();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies UnavailableLockEvent),
                    );
                });
                test("Should dispatch UnavailableLockEvent when key is unexpired and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: UnavailableLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.UNAVAILABLE,
                        handlerFn,
                    );
                    await lock.acquire();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies UnavailableLockEvent),
                    );
                });
            });
            describe("method: acquireOrFail", () => {
                test("Should dispatch AcquiredLockEvent when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    const handlerFn = vi.fn((_event: AcquiredLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.ACQUIRED,
                        handlerFn,
                    );
                    await lock.acquireOrFail();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies AcquiredLockEvent),
                    );
                });
                test("Should dispatch AcquiredLockEvent when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    await delay(ttl);

                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn((_event: AcquiredLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.ACQUIRED,
                        handlerFn,
                    );
                    await lock.acquireOrFail();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies AcquiredLockEvent),
                    );
                });
                test("Should dispatch AcquiredLockEvent when key is unexpireable and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();
                    const handlerFn = vi.fn((_event: AcquiredLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.ACQUIRED,
                        handlerFn,
                    );
                    await lock.acquireOrFail();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies AcquiredLockEvent),
                    );
                });
                test("Should dispatch AcquiredLockEvent when key is unexpired and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    const handlerFn = vi.fn((_event: AcquiredLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.ACQUIRED,
                        handlerFn,
                    );
                    await lock.acquireOrFail();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies AcquiredLockEvent),
                    );
                });
                test("Should dispatch UnavailableLockEvent when key is unexpireable and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    await lockProvider.create(key, { ttl }).acquire();
                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    const handlerFn = vi.fn(
                        (_event: UnavailableLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.UNAVAILABLE,
                        handlerFn,
                    );
                    try {
                        await lock.acquireOrFail();
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies UnavailableLockEvent),
                    );
                });
                test("Should dispatch UnavailableLockEvent when key is unexpired and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: UnavailableLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.UNAVAILABLE,
                        handlerFn,
                    );
                    try {
                        await lock.acquireOrFail();
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies UnavailableLockEvent),
                    );
                });
            });
            describe("method: acquireBlocking", () => {
                test("Should dispatch AcquiredLockEvent when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    const handlerFn = vi.fn((_event: AcquiredLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.ACQUIRED,
                        handlerFn,
                    );
                    await lock.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies AcquiredLockEvent),
                    );
                });
                test("Should dispatch AcquiredLockEvent when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    await delay(ttl);

                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn((_event: AcquiredLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.ACQUIRED,
                        handlerFn,
                    );
                    await lock.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies AcquiredLockEvent),
                    );
                });
                test("Should dispatch AcquiredLockEvent when key is unexpireable and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();
                    const handlerFn = vi.fn((_event: AcquiredLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.ACQUIRED,
                        handlerFn,
                    );
                    await lock.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies AcquiredLockEvent),
                    );
                });
                test("Should dispatch AcquiredLockEvent when key is unexpired and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    const handlerFn = vi.fn((_event: AcquiredLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.ACQUIRED,
                        handlerFn,
                    );
                    await lock.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies AcquiredLockEvent),
                    );
                });
                test("Should dispatch UnavailableLockEvent when key is unexpireable and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    await lockProvider.create(key, { ttl }).acquire();
                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    const handlerFn = vi.fn(
                        (_event: UnavailableLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.UNAVAILABLE,
                        handlerFn,
                    );
                    await lock.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(handlerFn).toHaveBeenCalled();
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies UnavailableLockEvent),
                    );
                });
                test("Should dispatch UnavailableLockEvent when key is unexpired and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: UnavailableLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.UNAVAILABLE,
                        handlerFn,
                    );
                    await lock.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(handlerFn).toHaveBeenCalled();
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies UnavailableLockEvent),
                    );
                });
            });
            describe("method: acquireBlockingOrFail", () => {
                test("Should dispatch AcquiredLockEvent when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    const handlerFn = vi.fn((_event: AcquiredLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.ACQUIRED,
                        handlerFn,
                    );
                    await lock.acquireBlockingOrFail({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies AcquiredLockEvent),
                    );
                });
                test("Should dispatch AcquiredLockEvent when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    await delay(ttl);

                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn((_event: AcquiredLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.ACQUIRED,
                        handlerFn,
                    );
                    await lock.acquireBlockingOrFail({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies AcquiredLockEvent),
                    );
                });
                test("Should dispatch AcquiredLockEvent when key is unexpireable and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();
                    const handlerFn = vi.fn((_event: AcquiredLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.ACQUIRED,
                        handlerFn,
                    );
                    await lock.acquireBlockingOrFail({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies AcquiredLockEvent),
                    );
                });
                test("Should dispatch AcquiredLockEvent when key is unexpired and acquired by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    const handlerFn = vi.fn((_event: AcquiredLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.ACQUIRED,
                        handlerFn,
                    );
                    await lock.acquireBlockingOrFail({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies AcquiredLockEvent),
                    );
                });
                test("Should dispatch UnavailableLockEvent when key is unexpireable and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;

                    await lockProvider.create(key, { ttl }).acquire();
                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    const handlerFn = vi.fn(
                        (_event: UnavailableLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.UNAVAILABLE,
                        handlerFn,
                    );
                    try {
                        await lock.acquireBlockingOrFail({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalled();
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies UnavailableLockEvent),
                    );
                });
                test("Should dispatch UnavailableLockEvent when key is unexpired and acquired by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    await lockProvider.create(key, { ttl }).acquire();
                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: UnavailableLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.UNAVAILABLE,
                        handlerFn,
                    );
                    try {
                        await lock.acquireBlockingOrFail({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalled();
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies UnavailableLockEvent),
                    );
                });
            });
            describe("method: forceRelease", () => {
                test("Should dispatch ForceReleasedLockEvent when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    const handlerFn = vi.fn(
                        (_event: ForceReleasedLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FORCE_RELEASED,
                        handlerFn,
                    );
                    await lock.forceRelease();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            hasReleased: false,
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies ForceReleasedLockEvent),
                    );
                });
                test("Should dispatch ForceReleasedLockEvent when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: ForceReleasedLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FORCE_RELEASED,
                        handlerFn,
                    );
                    await lock.acquire();
                    await delay(ttl);
                    await lock.forceRelease();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            hasReleased: false,
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies ForceReleasedLockEvent),
                    );
                });
                test("Should dispatch ForceReleasedLockEvent when key exists and is acquired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: ForceReleasedLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FORCE_RELEASED,
                        handlerFn,
                    );
                    await lock.acquire();
                    await lock.forceRelease();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            hasReleased: true,
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies ForceReleasedLockEvent),
                    );
                });
            });
            describe("method: release", () => {
                test("Should dispatch FailedReleaseLockEvent when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    const handlerFn = vi.fn(
                        (_event: FailedReleaseLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_RELEASE,
                        handlerFn,
                    );
                    await lock.release();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedReleaseLockEvent),
                    );
                });
                test("Should dispatch FailedReleaseLockEvent when key is unexpireable and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    await lockProvider.create(key, { ttl }).acquire();

                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: FailedReleaseLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_RELEASE,
                        handlerFn,
                    );
                    await lock.release();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedReleaseLockEvent),
                    );
                });
                test("Should dispatch FailedReleaseLockEvent when key is unexpired and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await lockProvider.create(key, { ttl }).acquire();

                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: FailedReleaseLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_RELEASE,
                        handlerFn,
                    );
                    await lock.release();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedReleaseLockEvent),
                    );
                });
                test("Should dispatch FailedReleaseLockEvent when key is expired and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await lockProvider.create(key, { ttl }).acquire();

                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: FailedReleaseLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_RELEASE,
                        handlerFn,
                    );
                    await lock.release();
                    await delay(ttl);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedReleaseLockEvent),
                    );
                });
                test("Should dispatch FailedReleaseLockEvent when key is expired and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: FailedReleaseLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_RELEASE,
                        handlerFn,
                    );
                    await lock.acquire();
                    await delay(ttl);

                    await lock.release();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedReleaseLockEvent),
                    );
                });
                test("Should dispatch ReleasedLockEvent when key is unexpireable and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn((_event: ReleasedLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.RELEASED,
                        handlerFn,
                    );
                    await lock.acquire();

                    await lock.release();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies ReleasedLockEvent),
                    );
                });
                test("Should dispatch ReleasedLockEvent when key is unexpired and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn((_event: ReleasedLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.RELEASED,
                        handlerFn,
                    );
                    await lock.acquire();

                    await lock.release();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies ReleasedLockEvent),
                    );
                });
            });
            describe("method: releaseOrFail", () => {
                test("Should dispatch FailedReleaseLockEvent when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    const handlerFn = vi.fn(
                        (_event: FailedReleaseLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_RELEASE,
                        handlerFn,
                    );
                    try {
                        await lock.releaseOrFail();
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedReleaseLockEvent),
                    );
                });
                test("Should dispatch FailedReleaseLockEvent when key is unexpireable and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    await lockProvider.create(key, { ttl }).acquire();

                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: FailedReleaseLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_RELEASE,
                        handlerFn,
                    );
                    try {
                        await lock.releaseOrFail();
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedReleaseLockEvent),
                    );
                });
                test("Should dispatch FailedReleaseLockEvent when key is unexpired and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await lockProvider.create(key, { ttl }).acquire();

                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: FailedReleaseLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_RELEASE,
                        handlerFn,
                    );
                    try {
                        await lock.releaseOrFail();
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedReleaseLockEvent),
                    );
                });
                test("Should dispatch FailedReleaseLockEvent when key is expired and released by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    await lockProvider.create(key, { ttl }).acquire();

                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: FailedReleaseLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_RELEASE,
                        handlerFn,
                    );
                    try {
                        await lock.release();
                    } catch {
                        /* EMPTY */
                    }
                    await delay(ttl);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedReleaseLockEvent),
                    );
                });
                test("Should dispatch FailedReleaseLockEvent when key is expired and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: FailedReleaseLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_RELEASE,
                        handlerFn,
                    );
                    await lock.acquire();
                    await delay(ttl);

                    try {
                        await lock.release();
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedReleaseLockEvent),
                    );
                });
                test("Should dispatch ReleasedLockEvent when key is unexpireable and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn((_event: ReleasedLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.RELEASED,
                        handlerFn,
                    );
                    await lock.acquire();

                    await lock.releaseOrFail();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies ReleasedLockEvent),
                    );
                });
                test("Should dispatch ReleasedLockEvent when key is unexpired and released by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn((_event: ReleasedLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.RELEASED,
                        handlerFn,
                    );
                    await lock.acquire();

                    await lock.releaseOrFail();

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies ReleasedLockEvent),
                    );
                });
            });
            describe("method: refresh", () => {
                test("Should dispatch FailedRefreshLockEvent when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    const handlerFn = vi.fn(
                        (_event: FailedRefreshLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_REFRESH,
                        handlerFn,
                    );
                    await lock.refresh(newTtl);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedRefreshLockEvent),
                    );
                });
                test("Should dispatch FailedRefreshLockEvent when key is unexpireable and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: FailedRefreshLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_REFRESH,
                        handlerFn,
                    );
                    await lock2.refresh(newTtl);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock2.key,
                                id: lock2.id,
                                ttl: lock2.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedRefreshLockEvent),
                    );
                });
                test("Should dispatch FailedRefreshLockEvent when key is unexpired and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: FailedRefreshLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_REFRESH,
                        handlerFn,
                    );
                    await lock2.refresh(newTtl);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock2.key,
                                id: lock2.id,
                                ttl: lock2.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedRefreshLockEvent),
                    );
                });
                test("Should dispatch FailedRefreshLockEvent when key is expired and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();
                    await delay(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: FailedRefreshLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_REFRESH,
                        handlerFn,
                    );
                    await lock2.refresh(newTtl);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock2.key,
                                id: lock2.id,
                                ttl: lock2.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedRefreshLockEvent),
                    );
                });
                test("Should dispatch FailedRefreshLockEvent when key is expired and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    await delay(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const handlerFn = vi.fn(
                        (_event: FailedRefreshLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_REFRESH,
                        handlerFn,
                    );
                    await lock.refresh(newTtl);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedRefreshLockEvent),
                    );
                });
                test("Should dispatch FailedRefreshLockEvent when key is unexpireable and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const handlerFn = vi.fn(
                        (_event: FailedRefreshLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_REFRESH,
                        handlerFn,
                    );
                    await lock.refresh(newTtl);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedRefreshLockEvent),
                    );
                });
                test("Should dispatch RefreshedLockEvent when key is unexpired and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const handlerFn = vi.fn((_event: RefreshedLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.REFRESHED,
                        handlerFn,
                    );
                    await lock.refresh(newTtl);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: newTtl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies RefreshedLockEvent),
                    );
                });
            });
            describe("method: refreshOrFail", () => {
                test("Should dispatch FailedRefreshLockEvent when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    const handlerFn = vi.fn(
                        (_event: FailedRefreshLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_REFRESH,
                        handlerFn,
                    );
                    try {
                        await lock.refreshOrFail(newTtl);
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedRefreshLockEvent),
                    );
                });
                test("Should dispatch FailedRefreshLockEvent when key is unexpireable and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: FailedRefreshLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_REFRESH,
                        handlerFn,
                    );
                    try {
                        await lock2.refreshOrFail(newTtl);
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock2.key,
                                id: lock2.id,
                                ttl: lock2.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedRefreshLockEvent),
                    );
                });
                test("Should dispatch FailedRefreshLockEvent when key is unexpired and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: FailedRefreshLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_REFRESH,
                        handlerFn,
                    );
                    try {
                        await lock2.refreshOrFail(newTtl);
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock2.key,
                                id: lock2.id,
                                ttl: lock2.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedRefreshLockEvent),
                    );
                });
                test("Should dispatch FailedRefreshLockEvent when key is expired and refreshed by different lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock1 = lockProvider.create(key, { ttl });
                    await lock1.acquire();
                    await delay(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const lock2 = lockProvider.create(key, { ttl });
                    const handlerFn = vi.fn(
                        (_event: FailedRefreshLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_REFRESH,
                        handlerFn,
                    );
                    try {
                        await lock2.refreshOrFail(newTtl);
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock2.key,
                                id: lock2.id,
                                ttl: lock2.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedRefreshLockEvent),
                    );
                });
                test("Should dispatch FailedRefreshLockEvent when key is expired and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockProvider.create(key, {
                        ttl,
                    });
                    await lock.acquire();
                    await delay(ttl);

                    const newTtl = TimeSpan.fromMinutes(1);
                    const handlerFn = vi.fn(
                        (_event: FailedRefreshLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_REFRESH,
                        handlerFn,
                    );
                    try {
                        await lock.refreshOrFail(newTtl);
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedRefreshLockEvent),
                    );
                });
                test("Should dispatch FailedRefreshLockEvent when key is unexpireable and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = null;
                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const handlerFn = vi.fn(
                        (_event: FailedRefreshLockEvent) => {},
                    );
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.FAILED_REFRESH,
                        handlerFn,
                    );
                    try {
                        await lock.refreshOrFail(newTtl);
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: lock.ttl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies FailedRefreshLockEvent),
                    );
                });
                test("Should dispatch RefreshedLockEvent when key is unexpired and refreshed by same lock-id", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockProvider.create(key, { ttl });
                    await lock.acquire();

                    const newTtl = TimeSpan.fromMinutes(1);
                    const handlerFn = vi.fn((_event: RefreshedLockEvent) => {});
                    await lockProvider.events.addListener(
                        LOCK_EVENTS.REFRESHED,
                        handlerFn,
                    );
                    await lock.refreshOrFail(newTtl);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(
                        expect.objectContaining({
                            lock: expect.objectContaining({
                                getState: expect.any(
                                    Function,
                                ) as ILockStateMethods["getState"],
                                key: lock.key,
                                id: lock.id,
                                ttl: newTtl,
                            } satisfies ILockStateMethods) as ILockStateMethods,
                        } satisfies RefreshedLockEvent),
                    );
                });
            });
        });
        describe.skipIf(excludeSerdeTests)("Serde tests:", () => {
            test("Should return ILockExpiredState when is derserialized and key doesnt exists", async () => {
                const key = "a";
                const ttl = TimeSpan.fromMilliseconds(50);

                const lock = lockProvider.create(key, {
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

                const lock = lockProvider.create(key, {
                    ttl,
                });
                await lock.acquire();
                await delay(ttl);

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
                const lock1 = lockProvider.create(key, {
                    ttl: ttl1,
                });
                await lock1.acquire();

                const ttl2 = null;
                const lock2 = lockProvider.create(key, {
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
                const lock1 = lockProvider.create(key, {
                    ttl: ttl1,
                });
                await lock1.acquire();

                const ttl2 = null;
                const lock2 = lockProvider.create(key, {
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
                const lock = lockProvider.create(key, {
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
            test(
                "Should return ILockAcquiredState when is derserialized and key is unexpired",
                { retry },
                async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const lock = lockProvider.create(key, {
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
                },
            );
            test("Should return ILockUnavailableState when is derserialized and key is acquired by different lock-id", async () => {
                const key = "a";
                const ttl = null;
                const lock1 = lockProvider.create(key, {
                    ttl,
                });
                await lock1.acquire();

                const lock2 = lockProvider.create(key, {
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
