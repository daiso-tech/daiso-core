/**
 * @module Semaphore
 */
import {
    type TestAPI,
    type SuiteAPI,
    type ExpectStatic,
    type beforeEach,
    vi,
} from "vitest";

import {
    type ISemaphoreProvider,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ISemaphore,
    LimitReachedSemaphoreError,
    SEMAPHORE_EVENTS,
    FailedReleaseSemaphoreError,
    FailedRefreshSemaphoreError,
    type AcquiredSemaphoreEvent,
    type LimitReachedSemaphoreEvent,
    type ISemaphoreStateMethods,
    type FailedReleaseSemaphoreEvent,
    type ReleasedSemaphoreEvent,
    type FailedRefreshSemaphoreEvent,
    type RefreshedSemaphoreEvent,
    type AllForceReleasedSemaphoreEvent,
    SEMAPHORE_STATE,
    type ISemaphoreExpiredState,
    type ISemaphoreUnacquiredState,
    type ISemaphoreLimitReachedState,
    type ISemaphoreAcquiredState,
} from "@/semaphore/contracts/_module.js";
import { type ISerde } from "@/serde/contracts/_module.js";
import { Task } from "@/task/implementations/_module.js";
import { TO_MILLISECONDS } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/test-utilities"`
 * @group Utilities
 */
export type SemaphoreProviderTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createSemaphoreProvider: () => Promisable<{
        semaphoreProvider: ISemaphoreProvider;
        serde: ISerde;
    }>;

    /**
     * @default true
     */
    includeSerdeTests?: boolean;

    /**
     * @default true
     */
    includeEventTests?: boolean;
};

/**
 * The `semaphoreProviderTestSuite` function simplifies the process of testing your custom implementation of {@link ISemaphore | `ISemaphore`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/test-utilities"`
 * @group Utilities
 * @example
 * ```ts
 * import { describe, expect, test, beforeEach } from "vitest";
 * import { MemorySemaphoreAdapter } from "@daiso-tech/core/semaphore/memory-semaphore-adapter";
 * import { SemaphoreProvider } from "@daiso-tech/core/semaphore";
 * import { EventBus } from "@daiso-tech/core/event-bus";
 * import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
 * import { semaphoreProviderTestSuite } from "@daiso-tech/core/semaphore/test-utilities";
 * import { Serde } from "@daiso-tech/core/serde";
 * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
 * import type { ISemaphoreData } from "@daiso-tech/core/semaphore/contracts";
 *
 * describe("class: SemaphoreProvider", () => {
 *     semaphoreProviderTestSuite({
 *         createSemaphoreProvider: () => {
 *             const serde = new Serde(new SuperJsonSerdeAdapter());
 *             const semaphoreProvider = new SemaphoreProvider({
 *                 serde,
 *                 adapter: new MemorySemaphoreAdapter(),
 *             });
 *             return { semaphoreProvider, serde };
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
export function semaphoreProviderTestSuite(
    settings: SemaphoreProviderTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createSemaphoreProvider,
        describe,
        beforeEach,
        includeEventTests = true,
        includeSerdeTests = true,
    } = settings;
    let semaphoreProvider: ISemaphoreProvider;
    let serde: ISerde;

    async function delay(time: TimeSpan): Promise<void> {
        await Task.delay(time.addMilliseconds(10));
    }

    const RETURN_VALUE = "RETURN_VALUE";
    describe("ISemaphoreProvider tests:", () => {
        beforeEach(async () => {
            const { semaphoreProvider: semaphoreProvider_, serde: serde_ } =
                await createSemaphoreProvider();
            semaphoreProvider = semaphoreProvider_;
            serde = serde_;
        });
        describe("Api tests:", () => {
            describe("method: runOrFail", () => {
                test("Should call acquireOrFail method", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;
                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    const acquireOrFailSpy = vi.spyOn(
                        semaphore,
                        "acquireOrFail",
                    );

                    await semaphore.runOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(acquireOrFailSpy).toHaveBeenCalledTimes(1);
                });
                test("Should call acquireOrFail before release method", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;
                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    const acquireOrFailSpy = vi.spyOn(
                        semaphore,
                        "acquireOrFail",
                    );
                    const releaseSpy = vi.spyOn(semaphore, "release");

                    await semaphore.runOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(acquireOrFailSpy).toHaveBeenCalledBefore(releaseSpy);
                });
                test("Should call release method", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;
                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    const releaseSpy = vi.spyOn(semaphore, "release");

                    await semaphore.runOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(releaseSpy).toHaveBeenCalledTimes(1);
                });
                test("Should call release after acquireOrFail method", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;
                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    const releaseSpy = vi.spyOn(semaphore, "release");
                    const acquireOrFailSpy = vi.spyOn(
                        semaphore,
                        "acquireOrFail",
                    );

                    await semaphore.runOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    expect(releaseSpy).toHaveBeenCalledAfter(acquireOrFailSpy);
                });
                test("Should call release when an error is thrown", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;
                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    const releaseSpy = vi.spyOn(semaphore, "release");

                    try {
                        await semaphore.runOrFail(() => {
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
                    const limit = 1;
                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    class CustomError extends Error {}

                    const error = semaphore.runOrFail(() => {
                        return Promise.reject(new CustomError());
                    });

                    await expect(error).rejects.toBeInstanceOf(CustomError);
                });
                test("Should call handler function when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;

                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runOrFail(handlerFn);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should call handler function when slot is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquire();
                    await delay(ttl);

                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runOrFail(handlerFn);

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should not call handler function when slot is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await semaphore.runOrFail(handlerFn);
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should not call handler function when slot is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await semaphore.runOrFail(handlerFn);
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should not call handler function when slot is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;

                    await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await semaphoreProvider
                            .create(key, {
                                ttl,
                                limit,
                            })
                            .runOrFail(handlerFn);
                    } catch {
                        /* EMPTY */
                    }
                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should not call handler function when slot is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await semaphoreProvider
                            .create(key, {
                                ttl,
                                limit,
                            })
                            .runOrFail(handlerFn);
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should return value when key doesnt exists", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;

                    const result = await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should return value when slot is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquire();
                    await delay(ttl);

                    const result = await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    expect(result).toBe(RETURN_VALUE);
                });
                test("Should throw LimitReachedSemaphoreError when slot is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;

                    const lock = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await lock.acquire();
                    const result = lock.runOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    await expect(result).rejects.toBeInstanceOf(
                        LimitReachedSemaphoreError,
                    );
                });
                test("Should throw LimitReachedSemaphoreError when slot is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    const lock = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await lock.acquire();
                    const result = lock.runOrFail(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });

                    await expect(result).rejects.toBeInstanceOf(
                        LimitReachedSemaphoreError,
                    );
                });
                test("Should throw LimitReachedSemaphoreError when slot is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;

                    await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquire();
                    const result = semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    await expect(result).rejects.toBeInstanceOf(
                        LimitReachedSemaphoreError,
                    );
                });
                test("Should throw LimitReachedSemaphoreError when slot is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquire();
                    const result = semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runOrFail(() => {
                            return Promise.resolve(RETURN_VALUE);
                        });

                    await expect(result).rejects.toBeInstanceOf(
                        LimitReachedSemaphoreError,
                    );
                });
            });
            describe("method: runBlockingOrFail", () => {
                test("Should call acquire method", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;
                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    const acquireSpy = vi.spyOn(semaphore, "acquire");

                    await semaphore.runBlockingOrFail(
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
                test("Should call acquire before release method", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;
                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    const acquireSpy = vi.spyOn(semaphore, "acquire");
                    const releaseSpy = vi.spyOn(semaphore, "release");

                    await semaphore.runBlockingOrFail(
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
                    const limit = 1;
                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    const releaseSpy = vi.spyOn(semaphore, "release");

                    await semaphore.runBlockingOrFail(
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
                test("Should call release after acquire method", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;
                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    const releaseSpy = vi.spyOn(semaphore, "release");
                    const acquireSpy = vi.spyOn(semaphore, "acquire");

                    await semaphore.runBlockingOrFail(
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
                    const limit = 1;
                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    const releaseSpy = vi.spyOn(semaphore, "release");

                    try {
                        await semaphore.runBlockingOrFail(
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
                    const limit = 1;
                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    class CustomError extends Error {}

                    const error = semaphore.runBlockingOrFail(
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
                    const limit = 1;

                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runBlockingOrFail(handlerFn, {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should call handler function when slot is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquire();
                    await delay(ttl);

                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .runBlockingOrFail(handlerFn, {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                    expect(handlerFn).toHaveBeenCalledTimes(1);
                });
                test("Should not call handler function when slot is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await semaphore.runBlockingOrFail(handlerFn, {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should not call handler function when slot is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await semaphore.runBlockingOrFail(handlerFn, {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should not call handler function when slot is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;

                    await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await semaphoreProvider
                            .create(key, {
                                ttl,
                                limit,
                            })
                            .runBlockingOrFail(handlerFn, {
                                time: TimeSpan.fromMilliseconds(5),
                                interval: TimeSpan.fromMilliseconds(5),
                            });
                    } catch {
                        /* EMPTY */
                    }

                    expect(handlerFn).not.toHaveBeenCalled();
                });
                test("Should not call handler function when slot is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquire();
                    const handlerFn = vi.fn(() => {
                        return Promise.resolve(RETURN_VALUE);
                    });
                    try {
                        await semaphoreProvider
                            .create(key, {
                                ttl,
                                limit,
                            })
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
                    const limit = 1;

                    const result = await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
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
                test("Should return value when slot is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquire();
                    await delay(ttl);

                    const result = await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
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
                test("Should throw LimitReachedSemaphoreError when slot is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;

                    const lock = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await lock.acquire();
                    const result = lock.runBlockingOrFail(
                        () => {
                            return Promise.resolve(RETURN_VALUE);
                        },
                        {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        },
                    );

                    await expect(result).rejects.toBeInstanceOf(
                        LimitReachedSemaphoreError,
                    );
                });
                test("Should throw LimitReachedSemaphoreError when slot is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    const lock = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await lock.acquire();
                    const result = lock.runBlockingOrFail(
                        () => {
                            return Promise.resolve(RETURN_VALUE);
                        },
                        {
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        },
                    );

                    await expect(result).rejects.toBeInstanceOf(
                        LimitReachedSemaphoreError,
                    );
                });
                test("Should throw LimitReachedSemaphoreError when slot is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 1;

                    await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquire();
                    const result = semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
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

                    await expect(result).rejects.toBeInstanceOf(
                        LimitReachedSemaphoreError,
                    );
                });
                test("Should throw LimitReachedSemaphoreError when slot is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;

                    await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .acquire();
                    const result = semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
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

                    await expect(result).rejects.toBeInstanceOf(
                        LimitReachedSemaphoreError,
                    );
                });
                test("Should retry acquire the lock", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;
                    const lock1 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    await lock1.acquire();
                    let index = 0;
                    await semaphoreProvider.events.addListener(
                        SEMAPHORE_EVENTS.LIMIT_REACHED,
                        (_event) => {
                            index++;
                        },
                    );
                    const lock2 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
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

                    expect(index).toBeGreaterThan(1);
                });
            });
            describe("method: acquire", () => {
                test("Should return true when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const result = await semaphoreProvider
                        .create(key, {
                            limit,
                            ttl,
                        })
                        .acquire();

                    expect(result).toBe(true);
                });
                test("Should return true when key exists and slot is expired", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore.acquire();
                    await delay(ttl);

                    const result = await semaphore.acquire();

                    expect(result).toBe(true);
                });
                test("Should return true when limit is not reached", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    const result = await semaphore2.acquire();

                    expect(result).toBe(true);
                });
                test("Should return false when limit is reached", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore2.acquire();

                    const semaphore3 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    const result = await semaphore3.acquire();

                    expect(result).toBe(false);
                });
                test("Should return true when one slot is expired", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl: ttl1,
                    });
                    await semaphore1.acquire();
                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl: ttl2,
                    });
                    await semaphore2.acquire();
                    await delay(ttl2);

                    const ttl3 = null;
                    const semaphore3 = semaphoreProvider.create(key, {
                        ttl: ttl3,
                        limit,
                    });
                    const result = await semaphore3.acquire();

                    expect(result).toBe(true);
                });
                test("Should return true when slot exists, is unexpireable and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore.acquire();
                    const result = await semaphore.acquire();

                    expect(result).toBe(true);
                });
                test("Should return true when slot exists, is unexpired and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore.acquire();
                    const result = await semaphore.acquire();

                    expect(result).toBe(true);
                });
                test("Should not acquire a slot when slot exists, is unexpireable and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    await semaphore1.acquire();

                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    const result = await semaphore2.acquire();

                    expect(result).toBe(true);
                });
                test("Should not acquire a slot when slot exists, is unexpired and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    await semaphore1.acquire();

                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await semaphore2.acquire();

                    expect(result).toBe(true);
                });
                test("Should not update limit when slot count is more than 0", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    const newLimit = 3;
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit: newLimit,
                        ttl,
                    });
                    await semaphore2.acquire();
                    const semaphore3 = semaphoreProvider.create(key, {
                        limit: newLimit,
                        ttl,
                    });
                    const result1 = await semaphore3.acquire();
                    expect(result1).toBe(false);

                    const state = await semaphore3.getState();
                    expect((state as ISemaphoreLimitReachedState).limit).toBe(
                        limit,
                    );
                });
            });
            describe("method: acquireOrFail", () => {
                test("Should not throw error when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const result = semaphoreProvider
                        .create(key, {
                            limit,
                            ttl,
                        })
                        .acquireOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key exists and slot is expired", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore.acquire();
                    await delay(ttl);

                    const result = semaphore.acquireOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when limit is not reached", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    const result = semaphore2.acquireOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should throw LimitReachedSemaphoreError when limit is reached", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore2.acquire();

                    const semaphore3 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    const result = semaphore3.acquireOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        LimitReachedSemaphoreError,
                    );
                });
                test("Should not throw error when one slot is expired", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl: ttl1,
                    });
                    await semaphore1.acquire();
                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl: ttl2,
                    });
                    await semaphore2.acquire();
                    await delay(ttl2);

                    const ttl3 = null;
                    const semaphore3 = semaphoreProvider.create(key, {
                        ttl: ttl3,
                        limit,
                    });
                    const result = semaphore3.acquireOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when slot exists, is unexpireable and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore.acquire();
                    const result = semaphore.acquireOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when slot exists, is unexpired and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore.acquire();
                    const result = semaphore.acquireOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not acquire a slot when slot exists, is unexpireable and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    await semaphore1.acquire();

                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    const result = semaphore2.acquireOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not acquire a slot when slot exists, is unexpired and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    await semaphore1.acquire();

                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    const result = semaphore2.acquireOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not update limit when slot count is more than 0", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    const newLimit = 3;
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit: newLimit,
                        ttl,
                    });
                    await semaphore2.acquire();
                    const semaphore3 = semaphoreProvider.create(key, {
                        limit: newLimit,
                        ttl,
                    });
                    const result1 = semaphore3.acquireOrFail();
                    await expect(result1).rejects.toBeInstanceOf(
                        LimitReachedSemaphoreError,
                    );

                    const state = await semaphore3.getState();
                    expect((state as ISemaphoreLimitReachedState).limit).toBe(
                        limit,
                    );
                });
            });
            describe("method: acquireBlocking", () => {
                test("Should return true when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const result = await semaphoreProvider
                        .create(key, {
                            limit,
                            ttl,
                        })
                        .acquireBlocking({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                    expect(result).toBe(true);
                });
                test("Should return true when key exists and slot is expired", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore.acquire();
                    await delay(ttl);

                    const result = await semaphore.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(result).toBe(true);
                });
                test("Should return true when limit is not reached", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    const result = await semaphore2.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(result).toBe(true);
                });
                test("Should return false when limit is reached", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore2.acquire();

                    const semaphore3 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    const result = await semaphore3.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(result).toBe(false);
                });
                test("Should return true when one slot is expired", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl: ttl1,
                    });
                    await semaphore1.acquire();
                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl: ttl2,
                    });
                    await semaphore2.acquire();
                    await delay(ttl2);

                    const ttl3 = null;
                    const semaphore3 = semaphoreProvider.create(key, {
                        ttl: ttl3,
                        limit,
                    });
                    const result = await semaphore3.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(result).toBe(true);
                });
                test("Should return true when slot exists, is unexpireable and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore.acquire();
                    const result = await semaphore.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(result).toBe(true);
                });
                test("Should return true when slot exists, is unexpired and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore.acquire();
                    const result = await semaphore.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(result).toBe(true);
                });
                test("Should not acquire a slot when slot exists, is unexpireable and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    await semaphore1.acquire();

                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    const result = await semaphore2.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(result).toBe(true);
                });
                test("Should not acquire a slot when slot exists, is unexpired and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    await semaphore1.acquire();

                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    const result = await semaphore2.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(result).toBe(true);
                });
                test("Should not update limit when slot count is more than 0", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    const newLimit = 3;
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit: newLimit,
                        ttl,
                    });
                    await semaphore2.acquire();
                    const semaphore3 = semaphoreProvider.create(key, {
                        limit: newLimit,
                        ttl,
                    });
                    const result1 = await semaphore3.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });
                    expect(result1).toBe(false);

                    const state = await semaphore3.getState();
                    expect((state as ISemaphoreLimitReachedState).limit).toBe(
                        limit,
                    );
                });
                test("Should retry acquire the semaphore", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;
                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    await semaphore1.acquire();
                    let index = 0;
                    await semaphoreProvider.events.addListener(
                        SEMAPHORE_EVENTS.LIMIT_REACHED,
                        (_event) => {
                            index++;
                        },
                    );
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore2.acquireBlocking({
                        time: TimeSpan.fromMilliseconds(55),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    expect(index).toBeGreaterThan(1);
                });
            });
            describe("method: acquireBlockingOrFail", () => {
                test("Should not throw error when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const result = semaphoreProvider
                        .create(key, {
                            limit,
                            ttl,
                        })
                        .acquireBlockingOrFail({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when key exists and slot is expired", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore.acquire();
                    await delay(ttl);

                    const result = semaphore.acquireBlockingOrFail({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when limit is not reached", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    const result = semaphore2.acquireBlockingOrFail({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should throw LimitReachedSemaphoreError when limit is reached", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore2.acquire();

                    const semaphore3 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    const result = semaphore3.acquireBlockingOrFail({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    await expect(result).rejects.toBeInstanceOf(
                        LimitReachedSemaphoreError,
                    );
                });
                test("Should not throw error when one slot is expired", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl: ttl1,
                    });
                    await semaphore1.acquire();
                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl: ttl2,
                    });
                    await semaphore2.acquire();
                    await delay(ttl2);

                    const ttl3 = null;
                    const semaphore3 = semaphoreProvider.create(key, {
                        ttl: ttl3,
                        limit,
                    });
                    const result = semaphore3.acquireBlockingOrFail({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when slot exists, is unexpireable and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore.acquire();
                    const result = semaphore.acquireBlockingOrFail({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when slot exists, is unexpired and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore.acquire();
                    const result = semaphore.acquireBlockingOrFail({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not acquire a slot when slot exists, is unexpireable and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    await semaphore1.acquire();

                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    const result = semaphore2.acquireBlockingOrFail({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not acquire a slot when slot exists, is unexpired and acquired multiple times", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    await semaphore1.acquire();

                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    const result = semaphore2.acquireBlockingOrFail({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not update limit when slot count is more than 0", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    const newLimit = 3;
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit: newLimit,
                        ttl,
                    });
                    await semaphore2.acquire();
                    const semaphore3 = semaphoreProvider.create(key, {
                        limit: newLimit,
                        ttl,
                    });
                    const result1 = semaphore3.acquireBlockingOrFail({
                        time: TimeSpan.fromMilliseconds(5),
                        interval: TimeSpan.fromMilliseconds(5),
                    });
                    await expect(result1).rejects.toBeInstanceOf(
                        LimitReachedSemaphoreError,
                    );

                    const state = await semaphore3.getState();
                    expect((state as ISemaphoreLimitReachedState).limit).toBe(
                        limit,
                    );
                });
                test("Should retry acquire the semaphore", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 1;
                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    await semaphore1.acquire();
                    let index = 0;
                    await semaphoreProvider.events.addListener(
                        SEMAPHORE_EVENTS.LIMIT_REACHED,
                        (_event) => {
                            index++;
                        },
                    );
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    try {
                        await semaphore2.acquireBlockingOrFail({
                            time: TimeSpan.fromMilliseconds(55),
                            interval: TimeSpan.fromMilliseconds(5),
                        });
                    } catch {
                        /* EMPTY */
                    }

                    expect(index).toBeGreaterThan(1);
                });
            });
            describe("method: release", () => {
                test("Should return false when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;
                    await semaphoreProvider
                        .create(key, {
                            limit,
                            ttl,
                        })
                        .acquire();

                    const noneExistingKey = "c";
                    const result = await semaphoreProvider
                        .create(noneExistingKey, {
                            limit,
                            ttl,
                        })
                        .release();

                    expect(result).toBe(false);
                });
                test("Should return false when slot doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;
                    await semaphoreProvider
                        .create(key, {
                            limit,
                            ttl,
                        })
                        .acquire();

                    const noneExistingSlotId = "1";
                    const result = await semaphoreProvider
                        .create(key, {
                            limit,
                            ttl,
                            slotId: noneExistingSlotId,
                        })
                        .release();

                    expect(result).toBe(false);
                });
                test("Should return false when slot is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore1.acquire();
                    await delay(ttl);

                    const result = await semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .release();

                    expect(result).toBe(false);
                });
                test("Should return false when slot exists, is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    await delay(ttl);
                    const result = await semaphore.release();

                    expect(result).toBe(false);
                });
                test("Should return true when slot exists, is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    const result = await semaphore.release();

                    expect(result).toBe(true);
                });
                test("Should return true when slot exists, is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    const result = await semaphore.release();

                    expect(result).toBe(true);
                });
                test("Should update limit when slot count is 0", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore1.acquire();
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore2.acquire();
                    await semaphore1.release();
                    await semaphore2.release();

                    const newLimit = 3;
                    const semaphore3 = semaphoreProvider.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    await semaphore3.acquire();
                    const semaphore4 = semaphoreProvider.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    await semaphore4.acquire();

                    const semaphore5 = semaphoreProvider.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    const result1 = await semaphore5.acquire();
                    expect(result1).toBe(true);

                    const state = await semaphore5.getState();
                    expect((state as ISemaphoreLimitReachedState).limit).toBe(
                        newLimit,
                    );

                    const semaphore6 = semaphoreProvider.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    const result3 = await semaphore6.acquire();
                    expect(result3).toBe(false);
                });
                test("Should decrement slot count when one slot is released", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore1.acquire();
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore2.acquire();
                    await semaphore1.release();
                    await semaphore2.release();

                    const semaphore3 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    const result1 = await semaphore3.acquire();
                    expect(result1).toBe(true);
                    const semaphore4 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    const result2 = await semaphore4.acquire();
                    expect(result2).toBe(true);
                });
            });
            describe("method: releaseOrFail", () => {
                test("Should throw FailedReleaseSemaphoreError when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;
                    await semaphoreProvider
                        .create(key, {
                            limit,
                            ttl,
                        })
                        .acquire();

                    const noneExistingKey = "c";
                    const result = semaphoreProvider
                        .create(noneExistingKey, {
                            limit,
                            ttl,
                        })
                        .releaseOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseSemaphoreError,
                    );
                });
                test("Should throw FailedReleaseSemaphoreError when slot doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;
                    await semaphoreProvider
                        .create(key, {
                            limit,
                            ttl,
                        })
                        .acquire();

                    const noneExistingSlotId = "1";
                    const result = semaphoreProvider
                        .create(key, {
                            limit,
                            ttl,
                            slotId: noneExistingSlotId,
                        })
                        .releaseOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseSemaphoreError,
                    );
                });
                test("Should throw FailedReleaseSemaphoreError when slot is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore1.acquire();
                    await delay(ttl);

                    const result = semaphoreProvider
                        .create(key, {
                            ttl,
                            limit,
                        })
                        .releaseOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseSemaphoreError,
                    );
                });
                test("Should throw FailedReleaseSemaphoreError when slot exists, is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    await delay(ttl);
                    const result = semaphore.releaseOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedReleaseSemaphoreError,
                    );
                });
                test("Should not throw error when slot exists, is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    const result = semaphore.releaseOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not throw error when slot exists, is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    const result = semaphore.releaseOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should update limit when slot count is 0", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore1.acquire();
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore2.acquire();
                    await semaphore1.release();
                    await semaphore2.releaseOrFail();

                    const newLimit = 3;
                    const semaphore3 = semaphoreProvider.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    await semaphore3.acquire();
                    const semaphore4 = semaphoreProvider.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    await semaphore4.acquire();

                    const semaphore5 = semaphoreProvider.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    const result1 = await semaphore5.acquire();
                    expect(result1).toBe(true);

                    const state = await semaphore5.getState();
                    expect((state as ISemaphoreLimitReachedState).limit).toBe(
                        newLimit,
                    );

                    const semaphore6 = semaphoreProvider.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    const result3 = await semaphore6.acquire();
                    expect(result3).toBe(false);
                });
                test("Should decrement slot count when one slot is released", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore1.acquire();
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore2.acquire();
                    await semaphore1.release();
                    await semaphore2.releaseOrFail();

                    const semaphore3 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    const result1 = await semaphore3.acquire();
                    expect(result1).toBe(true);
                    const semaphore4 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    const result2 = await semaphore4.acquire();
                    expect(result2).toBe(true);
                });
            });
            describe("method: forceReleaseAll", () => {
                test("Should return false when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();

                    const noneExistingKey = "c";
                    const semaphore2 = semaphoreProvider.create(
                        noneExistingKey,
                        {
                            limit,
                            ttl,
                        },
                    );
                    const result = await semaphore2.forceReleaseAll();

                    expect(result).toBe(false);
                });
                test("Should return false when slot is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore.acquire();
                    await delay(ttl);

                    const result = await semaphore.forceReleaseAll();

                    expect(result).toBe(false);
                });
                test("Should return false when no slots are acquired", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore2.acquire();
                    await semaphore1.release();
                    await semaphore2.release();

                    const result = await semaphore1.forceReleaseAll();

                    expect(result).toBe(false);
                });
                test("Should return true when at least 1 slot is acquired", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore.acquire();

                    const result = await semaphore.forceReleaseAll();

                    expect(result).toBe(true);
                });
                test("Should make all slots reacquirable", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl: ttl1,
                    });
                    await semaphore1.acquire();
                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl: ttl2,
                    });
                    await semaphore2.acquire();

                    await semaphore2.forceReleaseAll();

                    const ttl3 = null;
                    const semaphore3 = semaphoreProvider.create(key, {
                        ttl: ttl3,
                        limit,
                    });
                    const result1 = await semaphore3.acquire();
                    expect(result1).toBe(true);
                    const ttl4 = null;
                    const semaphore4 = semaphoreProvider.create(key, {
                        ttl: ttl4,
                        limit,
                    });
                    const result2 = await semaphore4.acquire();
                    expect(result2).toBe(true);
                });
                test("Should update limit when slot count is 0", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore1.acquire();
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore2.acquire();
                    await semaphore1.forceReleaseAll();

                    const newLimit = 3;
                    const semaphore3 = semaphoreProvider.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    await semaphore3.acquire();
                    const semaphore4 = semaphoreProvider.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    await semaphore4.acquire();

                    const semaphore5 = semaphoreProvider.create(key, {
                        ttl,
                        limit: newLimit,
                    });
                    const result1 = await semaphore5.acquire();
                    expect(result1).toBe(true);

                    const state = await semaphore5.getState();
                    expect((state as ISemaphoreLimitReachedState).limit).toBe(
                        newLimit,
                    );

                    const semaphore6 = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    const result3 = await semaphore6.acquire();
                    expect(result3).toBe(false);
                });
            });
            describe("method: refresh", () => {
                test("Should return false when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const noneExistingKey = "c";
                    const semaphore2 = semaphoreProvider.create(
                        noneExistingKey,
                        {
                            ttl: newTtl,
                            limit,
                        },
                    );
                    const result = await semaphore2.refresh();

                    expect(result).toBe(false);
                });
                test("Should return false when slot doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const noneExistingSlotId = "1";
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl: newTtl,
                        limit,
                        slotId: noneExistingSlotId,
                    });
                    const result = await semaphore2.refresh();

                    expect(result).toBe(false);
                });
                test("Should return false when slot is expired", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    await delay(ttl);

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = await semaphore.refresh(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when slot exists, is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    await delay(ttl);
                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = await semaphore.refresh(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return false when slot exists, is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = await semaphore.refresh(newTtl);

                    expect(result).toBe(false);
                });
                test("Should return true when slot exists, is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = await semaphore.refresh(newTtl);

                    expect(result).toBe(true);
                });
                test("Should not update expiration when slot exists, is unexpireable", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await semaphore1.acquire();

                    const ttl2 = null;
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await semaphore2.acquire();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    await semaphore2.refresh(newTtl);
                    await delay(newTtl);

                    const semaphore3 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    const result1 = await semaphore3.acquire();
                    expect(result1).toBe(false);
                });
                test("Should update expiration when slot exists, is unexpired", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await semaphore1.acquire();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl: ttl2,
                    });
                    await semaphore2.acquire();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    await semaphore2.refresh(newTtl);
                    await delay(newTtl.divide(2));

                    const semaphore3 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    const result1 = await semaphore3.acquire();
                    expect(result1).toBe(false);

                    await delay(newTtl.divide(2));
                    const result2 = await semaphore3.acquire();
                    expect(result2).toBe(true);
                });
            });
            describe("method: refreshOrFail", () => {
                test("Should throw FailedRefreshSemaphoreError when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const noneExistingKey = "c";
                    const semaphore2 = semaphoreProvider.create(
                        noneExistingKey,
                        {
                            ttl: newTtl,
                            limit,
                        },
                    );
                    const result = semaphore2.refreshOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshSemaphoreError,
                    );
                });
                test("Should throw FailedRefreshSemaphoreError when slot doesnt exists", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    await semaphore1.acquire();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const noneExistingSlotId = "1";
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl: newTtl,
                        limit,
                        slotId: noneExistingSlotId,
                    });
                    const result = semaphore2.refreshOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshSemaphoreError,
                    );
                });
                test("Should throw FailedRefreshSemaphoreError when slot is expired", async () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    await delay(ttl);

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = semaphore.refreshOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshSemaphoreError,
                    );
                });
                test("Should throw FailedRefreshSemaphoreError when slot exists, is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    await delay(ttl);
                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = semaphore.refreshOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshSemaphoreError,
                    );
                });
                test("Should throw FailedRefreshSemaphoreError when slot exists, is unexpireable", async () => {
                    const key = "a";
                    const ttl = null;
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = semaphore.refreshOrFail(newTtl);

                    await expect(result).rejects.toBeInstanceOf(
                        FailedRefreshSemaphoreError,
                    );
                });
                test("Should not throw error when slot exists, is unexpired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    const newTtl = TimeSpan.fromMilliseconds(100);
                    const result = semaphore.refreshOrFail(newTtl);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should not update expiration when slot exists, is unexpireable", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await semaphore1.acquire();

                    const ttl2 = null;
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await semaphore2.acquire();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    try {
                        await semaphore2.refreshOrFail(newTtl);
                    } catch {
                        /* EMPTY */
                    }
                    await delay(newTtl);

                    const semaphore3 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    const result1 = await semaphore3.acquire();
                    expect(result1).toBe(false);
                });
                test("Should update expiration when slot exists, is unexpired", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await semaphore1.acquire();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const semaphore2 = semaphoreProvider.create(key, {
                        limit,
                        ttl: ttl2,
                    });
                    await semaphore2.acquire();

                    const newTtl = TimeSpan.fromMilliseconds(100);
                    await semaphore2.refreshOrFail(newTtl);
                    await delay(newTtl.divide(2));

                    const semaphore3 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    const result1 = await semaphore3.acquire();
                    expect(result1).toBe(false);

                    await delay(newTtl.divide(2));
                    const result2 = await semaphore3.acquire();
                    expect(result2).toBe(true);
                });
            });
            describe("method: getId", () => {
                test("Should return semaphore id of ISemaphore instance when given explicitly", () => {
                    const key = "a";
                    const limit = 2;
                    const slotId = "1";

                    const semaphore = semaphoreProvider.create(key, {
                        slotId,
                        limit,
                    });

                    expect(semaphore.id).toBe(slotId);
                });
                test("Should return semaphore id of ISemaphore instance when given explicitly", () => {
                    const key = "a";
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                    });

                    expect(semaphore.id).toBeTypeOf("string");
                    expect(semaphore.id.length).toBeGreaterThan(0);
                });
            });
            describe("method: getTtl", () => {
                test("Should return null when given null ttl", () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = null;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    expect(semaphore.ttl).toBeNull();
                });
                test("Should return TimeSpan when given TimeSpan", () => {
                    const key = "a";
                    const limit = 2;
                    const ttl = TimeSpan.fromMilliseconds(100);

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });

                    expect(semaphore.ttl).toBeInstanceOf(TimeSpan);
                    expect(semaphore.ttl?.[TO_MILLISECONDS]()).toBe(
                        ttl.toMilliseconds(),
                    );
                });
            });
            describe("method: getState", () => {
                test("Should return ISemaphoreExpiredState when key doesnt exists", async () => {
                    const key = "a";
                    const limit = 3;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });

                    const result = await semaphore.getState();

                    expect(result).toEqual({
                        type: SEMAPHORE_STATE.EXPIRED,
                    } satisfies ISemaphoreExpiredState);
                });
                test("Should return ISemaphoreExpiredState when key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    await semaphore.acquire();
                    await delay(ttl);

                    const result = await semaphore.getState();

                    expect(result).toEqual({
                        type: SEMAPHORE_STATE.EXPIRED,
                    } satisfies ISemaphoreExpiredState);
                });
                test("Should return ISemaphoreExpiredState when all slots are released with forceReleaseAll method", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await semaphore1.acquire();

                    const ttl2 = null;
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await semaphore2.acquire();

                    await semaphore2.forceReleaseAll();

                    const result = await semaphore1.getState();

                    expect(result).toEqual({
                        type: SEMAPHORE_STATE.EXPIRED,
                    } satisfies ISemaphoreExpiredState);
                });
                test("Should return ISemaphoreExpiredState when all slots are released with release method", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl: ttl1,
                    });
                    await semaphore1.acquire();

                    const ttl2 = null;
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await semaphore2.acquire();

                    await semaphore1.release();
                    await semaphore2.release();

                    const result = await semaphore2.getState();

                    expect(result).toEqual({
                        type: SEMAPHORE_STATE.EXPIRED,
                    } satisfies ISemaphoreExpiredState);
                });
                test("Should return ISemaphoreUnacquiredState when slot is unacquired", async () => {
                    const key = "a";
                    const limit = 3;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await semaphore1.acquire();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });

                    const state = await semaphore2.getState();

                    expect(state).toEqual({
                        type: SEMAPHORE_STATE.UNACQUIRED,
                        limit,
                        freeSlotsCount: limit - 1,
                        acquiredSlotsCount: 1,
                        acquiredSlots: [semaphore1.id],
                    } satisfies ISemaphoreUnacquiredState);
                });
                test("Should return ISemaphoreUnacquiredState when slot is expired", async () => {
                    const key = "a";
                    const limit = 3;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await semaphore1.acquire();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await semaphore2.acquire();
                    await delay(ttl2);

                    const state = await semaphore2.getState();

                    expect(state).toEqual({
                        type: SEMAPHORE_STATE.UNACQUIRED,
                        limit,
                        freeSlotsCount: limit - 1,
                        acquiredSlotsCount: 1,
                        acquiredSlots: [semaphore1.id],
                    } satisfies ISemaphoreUnacquiredState);
                });
                test("Should return ISemaphoreAcquiredState when slot is unexpired", async () => {
                    const key = "a";
                    const limit = 3;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await semaphore1.acquire();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await semaphore2.acquire();

                    const state = await semaphore2.getState();

                    expect(state).toEqual({
                        type: SEMAPHORE_STATE.ACQUIRED,
                        limit,
                        freeSlotsCount: limit - 2,
                        acquiredSlotsCount: 2,
                        acquiredSlots: [semaphore1.id, semaphore2.id],
                        remainingTime: ttl2,
                    } satisfies ISemaphoreAcquiredState);
                });
                test("Should return ISemaphoreLimitReachedState when limit is reached", async () => {
                    const key = "a";
                    const limit = 1;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await semaphore1.acquire();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    await delay(ttl2);

                    const state = await semaphore2.getState();

                    expect(state).toEqual({
                        type: SEMAPHORE_STATE.LIMIT_REACHED,
                        limit,
                        acquiredSlots: [semaphore1.id],
                    } satisfies ISemaphoreLimitReachedState);
                });
            });
        });
        if (includeEventTests) {
            describe("Event tests:", () => {
                describe("method: acquire", () => {
                    test("Should dispatch AcquiredSemaphoreEvent when key doesnt exists", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;

                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );

                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore.acquire();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when key exists and slot is expired", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = TimeSpan.fromMilliseconds(50);

                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore.acquire();
                        await delay(ttl);

                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        await semaphore.acquire();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when limit is not reached", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;

                        const semaphore1 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore1.acquire();
                        const semaphore2 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        await semaphore2.acquire();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore2.key,
                                    ttl: semaphore2.ttl,
                                    slotId: semaphore2.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch LimitReachedSemaphoreEvent when limit is reached", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;

                        const semaphore1 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore1.acquire();
                        const semaphore2 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore2.acquire();

                        const handlerFn = vi.fn(
                            (_event: LimitReachedSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.LIMIT_REACHED,
                            handlerFn,
                        );
                        const semaphore3 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore3.acquire();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore3.key,
                                    ttl: semaphore3.ttl,
                                    slotId: semaphore3.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies LimitReachedSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when one slot is expired", async () => {
                        const key = "a";
                        const limit = 2;

                        const ttl1 = null;
                        const semaphore1 = semaphoreProvider.create(key, {
                            limit,
                            ttl: ttl1,
                        });
                        await semaphore1.acquire();
                        const ttl2 = TimeSpan.fromMilliseconds(50);
                        const semaphore2 = semaphoreProvider.create(key, {
                            limit,
                            ttl: ttl2,
                        });
                        await semaphore2.acquire();
                        await delay(ttl2);

                        const ttl3 = null;
                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        const semaphore3 = semaphoreProvider.create(key, {
                            limit,
                            ttl: ttl3,
                        });
                        await semaphore3.acquire();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore3.key,
                                    ttl: semaphore3.ttl,
                                    slotId: semaphore3.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when slot exists, is unexpireable and acquired multiple times", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;

                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore.acquire();
                        await semaphore.acquire();

                        expect(handlerFn).toHaveBeenCalledTimes(2);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when slot exists, is unexpired and acquired multiple times", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = TimeSpan.fromMilliseconds(50);

                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore.acquire();
                        await semaphore.acquire();

                        expect(handlerFn).toHaveBeenCalledTimes(2);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                });
                describe("method: acquireOrFail", () => {
                    test("Should dispatch AcquiredSemaphoreEvent when key doesnt exists", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;

                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );

                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore.acquireOrFail();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when key exists and slot is expired", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = TimeSpan.fromMilliseconds(50);

                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore.acquire();
                        await delay(ttl);

                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        await semaphore.acquireOrFail();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when limit is not reached", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;

                        const semaphore1 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore1.acquire();
                        const semaphore2 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        await semaphore2.acquireOrFail();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore2.key,
                                    ttl: semaphore2.ttl,
                                    slotId: semaphore2.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch LimitReachedSemaphoreEvent when limit is reached", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;

                        const semaphore1 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore1.acquire();
                        const semaphore2 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore2.acquire();

                        const handlerFn = vi.fn(
                            (_event: LimitReachedSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.LIMIT_REACHED,
                            handlerFn,
                        );
                        const semaphore3 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        try {
                            await semaphore3.acquireOrFail();
                        } catch {
                            /* EMPTY */
                        }

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore3.key,
                                    ttl: semaphore3.ttl,
                                    slotId: semaphore3.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies LimitReachedSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when one slot is expired", async () => {
                        const key = "a";
                        const limit = 2;

                        const ttl1 = null;
                        const semaphore1 = semaphoreProvider.create(key, {
                            limit,
                            ttl: ttl1,
                        });
                        await semaphore1.acquire();
                        const ttl2 = TimeSpan.fromMilliseconds(50);
                        const semaphore2 = semaphoreProvider.create(key, {
                            limit,
                            ttl: ttl2,
                        });
                        await semaphore2.acquire();
                        await delay(ttl2);

                        const ttl3 = null;
                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        const semaphore3 = semaphoreProvider.create(key, {
                            limit,
                            ttl: ttl3,
                        });
                        await semaphore3.acquireOrFail();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore3.key,
                                    ttl: semaphore3.ttl,
                                    slotId: semaphore3.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when slot exists, is unexpireable and acquired multiple times", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;

                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore.acquire();
                        await semaphore.acquireOrFail();

                        expect(handlerFn).toHaveBeenCalledTimes(2);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when slot exists, is unexpired and acquired multiple times", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = TimeSpan.fromMilliseconds(50);

                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore.acquire();
                        await semaphore.acquireOrFail();

                        expect(handlerFn).toHaveBeenCalledTimes(2);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                });
                describe("method: acquireBlocking", () => {
                    test("Should dispatch AcquiredSemaphoreEvent when key doesnt exists", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;

                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );

                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore.acquireBlocking({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when key exists and slot is expired", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = TimeSpan.fromMilliseconds(50);

                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore.acquire();
                        await delay(ttl);

                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        await semaphore.acquireBlocking({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when limit is not reached", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;

                        const semaphore1 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore1.acquire();
                        const semaphore2 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        await semaphore2.acquireBlocking({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore2.key,
                                    ttl: semaphore2.ttl,
                                    slotId: semaphore2.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch LimitReachedSemaphoreEvent when limit is reached", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;

                        const semaphore1 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore1.acquire();
                        const semaphore2 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore2.acquire();

                        const handlerFn = vi.fn(
                            (_event: LimitReachedSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.LIMIT_REACHED,
                            handlerFn,
                        );
                        const semaphore3 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore3.acquireBlocking({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore3.key,
                                    ttl: semaphore3.ttl,
                                    slotId: semaphore3.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies LimitReachedSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when one slot is expired", async () => {
                        const key = "a";
                        const limit = 2;

                        const ttl1 = null;
                        const semaphore1 = semaphoreProvider.create(key, {
                            limit,
                            ttl: ttl1,
                        });
                        await semaphore1.acquire();
                        const ttl2 = TimeSpan.fromMilliseconds(50);
                        const semaphore2 = semaphoreProvider.create(key, {
                            limit,
                            ttl: ttl2,
                        });
                        await semaphore2.acquire();
                        await delay(ttl2);

                        const ttl3 = null;
                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        const semaphore3 = semaphoreProvider.create(key, {
                            limit,
                            ttl: ttl3,
                        });
                        await semaphore3.acquireBlocking({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore3.key,
                                    ttl: semaphore3.ttl,
                                    slotId: semaphore3.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when slot exists, is unexpireable and acquired multiple times", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;

                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore.acquire();
                        await semaphore.acquireBlocking({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                        expect(handlerFn).toHaveBeenCalledTimes(2);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when slot exists, is unexpired and acquired multiple times", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = TimeSpan.fromMilliseconds(50);

                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore.acquire();
                        await semaphore.acquireBlocking({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                        expect(handlerFn).toHaveBeenCalledTimes(2);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                });
                describe("method: acquireBlockingOrFail", () => {
                    test("Should dispatch AcquiredSemaphoreEvent when key doesnt exists", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;

                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );

                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore.acquireBlockingOrFail({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when key exists and slot is expired", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = TimeSpan.fromMilliseconds(50);

                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore.acquire();
                        await delay(ttl);

                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        await semaphore.acquireBlockingOrFail({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when limit is not reached", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;

                        const semaphore1 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore1.acquire();
                        const semaphore2 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        await semaphore2.acquireBlockingOrFail({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore2.key,
                                    ttl: semaphore2.ttl,
                                    slotId: semaphore2.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch LimitReachedSemaphoreEvent when limit is reached", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;

                        const semaphore1 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore1.acquire();
                        const semaphore2 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore2.acquire();

                        const handlerFn = vi.fn(
                            (_event: LimitReachedSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.LIMIT_REACHED,
                            handlerFn,
                        );
                        const semaphore3 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        try {
                            await semaphore3.acquireBlockingOrFail({
                                time: TimeSpan.fromMilliseconds(5),
                                interval: TimeSpan.fromMilliseconds(5),
                            });
                        } catch {
                            /* EMPTY */
                        }

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore3.key,
                                    ttl: semaphore3.ttl,
                                    slotId: semaphore3.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies LimitReachedSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when one slot is expired", async () => {
                        const key = "a";
                        const limit = 2;

                        const ttl1 = null;
                        const semaphore1 = semaphoreProvider.create(key, {
                            limit,
                            ttl: ttl1,
                        });
                        await semaphore1.acquire();
                        const ttl2 = TimeSpan.fromMilliseconds(50);
                        const semaphore2 = semaphoreProvider.create(key, {
                            limit,
                            ttl: ttl2,
                        });
                        await semaphore2.acquire();
                        await delay(ttl2);

                        const ttl3 = null;
                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        const semaphore3 = semaphoreProvider.create(key, {
                            limit,
                            ttl: ttl3,
                        });
                        await semaphore3.acquireBlockingOrFail({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore3.key,
                                    ttl: semaphore3.ttl,
                                    slotId: semaphore3.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when slot exists, is unexpireable and acquired multiple times", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;

                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore.acquire();
                        await semaphore.acquireBlockingOrFail({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                        expect(handlerFn).toHaveBeenCalledTimes(2);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AcquiredSemaphoreEvent when slot exists, is unexpired and acquired multiple times", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = TimeSpan.fromMilliseconds(50);

                        const handlerFn = vi.fn(
                            (_event: AcquiredSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ACQUIRED,
                            handlerFn,
                        );
                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore.acquire();
                        await semaphore.acquireBlockingOrFail({
                            time: TimeSpan.fromMilliseconds(5),
                            interval: TimeSpan.fromMilliseconds(5),
                        });

                        expect(handlerFn).toHaveBeenCalledTimes(2);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AcquiredSemaphoreEvent),
                        );
                    });
                });
                describe("method: release", () => {
                    test("Should dispatch FailedReleaseSemaphoreEvent when key doesnt exists", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;
                        await semaphoreProvider
                            .create(key, {
                                limit,
                                ttl,
                            })
                            .acquire();

                        const noneExistingKey = "c";
                        const semaphore = semaphoreProvider.create(
                            noneExistingKey,
                            {
                                limit,
                                ttl,
                            },
                        );

                        const handlerFn = vi.fn(
                            (_event: FailedReleaseSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_RELEASE,
                            handlerFn,
                        );
                        await semaphore.release();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedReleaseSemaphoreEvent),
                        );
                    });
                    test("Should dispatch FailedReleaseSemaphoreEvent when slot doesnt exists", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;
                        await semaphoreProvider
                            .create(key, {
                                limit,
                                ttl,
                            })
                            .acquire();

                        const noneExistingSlotId = "1";
                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                            slotId: noneExistingSlotId,
                        });

                        const handlerFn = vi.fn(
                            (_event: FailedReleaseSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_RELEASE,
                            handlerFn,
                        );
                        await semaphore.release();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedReleaseSemaphoreEvent),
                        );
                    });
                    test("Should dispatch FailedReleaseSemaphoreEvent when slot is expired", async () => {
                        const key = "a";
                        const ttl = TimeSpan.fromMilliseconds(50);
                        const limit = 2;

                        const semaphore1 = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        await semaphore1.acquire();
                        await delay(ttl);

                        const semaphore = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        const handlerFn = vi.fn(
                            (_event: FailedReleaseSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_RELEASE,
                            handlerFn,
                        );
                        await semaphore.release();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedReleaseSemaphoreEvent),
                        );
                    });
                    test("Should dispatch FailedReleaseSemaphoreEvent when slot exists, is expired", async () => {
                        const key = "a";
                        const ttl = TimeSpan.fromMilliseconds(50);
                        const limit = 2;

                        const semaphore = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        await semaphore.acquire();
                        await delay(ttl);

                        const handlerFn = vi.fn(
                            (_event: FailedReleaseSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_RELEASE,
                            handlerFn,
                        );
                        await semaphore.release();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedReleaseSemaphoreEvent),
                        );
                    });
                    test("Should dispatch ReleasedSemaphoreEvent when slot exists, is unexpired", async () => {
                        const key = "a";
                        const ttl = TimeSpan.fromMilliseconds(50);
                        const limit = 2;

                        const semaphore = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        await semaphore.acquire();

                        const handlerFn = vi.fn(
                            (_event: ReleasedSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.RELEASED,
                            handlerFn,
                        );
                        await semaphore.release();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies ReleasedSemaphoreEvent),
                        );
                    });
                    test("Should dispatch ReleasedSemaphoreEvent when slot exists, is unexpireable", async () => {
                        const key = "a";
                        const ttl = null;
                        const limit = 2;

                        const semaphore = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        await semaphore.acquire();

                        const handlerFn = vi.fn(
                            (_event: ReleasedSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.RELEASED,
                            handlerFn,
                        );
                        await semaphore.release();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies ReleasedSemaphoreEvent),
                        );
                    });
                });
                describe("method: releaseOrFail", () => {
                    test("Should dispatch FailedReleaseSemaphoreEvent when key doesnt exists", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;
                        await semaphoreProvider
                            .create(key, {
                                limit,
                                ttl,
                            })
                            .acquire();

                        const noneExistingKey = "c";
                        const semaphore = semaphoreProvider.create(
                            noneExistingKey,
                            {
                                limit,
                                ttl,
                            },
                        );

                        const handlerFn = vi.fn(
                            (_event: FailedReleaseSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_RELEASE,
                            handlerFn,
                        );
                        try {
                            await semaphore.releaseOrFail();
                        } catch {
                            /* EMPTY */
                        }

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedReleaseSemaphoreEvent),
                        );
                    });
                    test("Should dispatch FailedReleaseSemaphoreEvent when slot doesnt exists", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;
                        await semaphoreProvider
                            .create(key, {
                                limit,
                                ttl,
                            })
                            .acquire();

                        const noneExistingSlotId = "1";
                        const semaphore = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                            slotId: noneExistingSlotId,
                        });

                        const handlerFn = vi.fn(
                            (_event: FailedReleaseSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_RELEASE,
                            handlerFn,
                        );
                        try {
                            await semaphore.releaseOrFail();
                        } catch {
                            /* EMPTY */
                        }

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedReleaseSemaphoreEvent),
                        );
                    });
                    test("Should dispatch FailedReleaseSemaphoreEvent when slot is expired", async () => {
                        const key = "a";
                        const ttl = TimeSpan.fromMilliseconds(50);
                        const limit = 2;

                        const semaphore1 = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        await semaphore1.acquire();
                        await delay(ttl);

                        const semaphore = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        const handlerFn = vi.fn(
                            (_event: FailedReleaseSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_RELEASE,
                            handlerFn,
                        );
                        try {
                            await semaphore.releaseOrFail();
                        } catch {
                            /* EMPTY */
                        }

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedReleaseSemaphoreEvent),
                        );
                    });
                    test("Should dispatch FailedReleaseSemaphoreEvent when slot exists, is expired", async () => {
                        const key = "a";
                        const ttl = TimeSpan.fromMilliseconds(50);
                        const limit = 2;

                        const semaphore = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        await semaphore.acquire();
                        await delay(ttl);

                        const handlerFn = vi.fn(
                            (_event: FailedReleaseSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_RELEASE,
                            handlerFn,
                        );
                        try {
                            await semaphore.releaseOrFail();
                        } catch {
                            /* EMPTY */
                        }

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedReleaseSemaphoreEvent),
                        );
                    });
                    test("Should dispatch ReleasedSemaphoreEvent when slot exists, is unexpired", async () => {
                        const key = "a";
                        const ttl = TimeSpan.fromMilliseconds(50);
                        const limit = 2;

                        const semaphore = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        await semaphore.acquire();

                        const handlerFn = vi.fn(
                            (_event: ReleasedSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.RELEASED,
                            handlerFn,
                        );
                        await semaphore.releaseOrFail();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies ReleasedSemaphoreEvent),
                        );
                    });
                    test("Should dispatch ReleasedSemaphoreEvent when slot exists, is unexpireable", async () => {
                        const key = "a";
                        const ttl = null;
                        const limit = 2;

                        const semaphore = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        await semaphore.acquire();

                        const handlerFn = vi.fn(
                            (_event: ReleasedSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.RELEASED,
                            handlerFn,
                        );
                        await semaphore.releaseOrFail();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies ReleasedSemaphoreEvent),
                        );
                    });
                });
                describe("method: forceReleaseAll", () => {
                    test("Should dispatch AllForceReleasedSemaphoreEvent when key doesnt exists", async () => {
                        const key = "a";
                        const limit = 3;

                        const ttl1 = null;
                        const semaphore1 = semaphoreProvider.create(key, {
                            ttl: ttl1,
                            limit,
                        });
                        await semaphore1.acquire();

                        const ttl2 = TimeSpan.fromMilliseconds(50);
                        const semaphore2 = semaphoreProvider.create(key, {
                            ttl: ttl2,
                            limit,
                        });
                        await semaphore2.acquire();
                        await delay(ttl2);

                        await semaphore1.release();

                        const ttl3 = null;
                        const semaphore3 = semaphoreProvider.create(key, {
                            ttl: ttl3,
                            limit,
                        });

                        const handlerFn = vi.fn(
                            (_event: AllForceReleasedSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ALL_FORCE_RELEASED,
                            handlerFn,
                        );

                        await semaphore3.forceReleaseAll();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                hasReleased: false,
                                semaphore: expect.objectContaining({
                                    key: semaphore3.key,
                                    ttl: semaphore3.ttl,
                                    slotId: semaphore3.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AllForceReleasedSemaphoreEvent),
                        );
                    });
                    test("Should dispatch AllForceReleasedSemaphoreEvent when key exists and has acquired slots", async () => {
                        const key = "a";
                        const limit = 2;

                        const ttl1 = null;
                        const semaphore1 = semaphoreProvider.create(key, {
                            ttl: ttl1,
                            limit,
                        });
                        await semaphore1.acquire();

                        const ttl2 = TimeSpan.fromMilliseconds(50);
                        const semaphore2 = semaphoreProvider.create(key, {
                            ttl: ttl2,
                            limit,
                        });
                        await semaphore2.acquire();

                        const handlerFn = vi.fn(
                            (_event: AllForceReleasedSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.ALL_FORCE_RELEASED,
                            handlerFn,
                        );

                        await semaphore1.forceReleaseAll();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                hasReleased: true,
                                semaphore: expect.objectContaining({
                                    key: semaphore1.key,
                                    ttl: semaphore1.ttl,
                                    slotId: semaphore1.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies AllForceReleasedSemaphoreEvent),
                        );
                    });
                });
                describe("method: refresh", () => {
                    test("Should dispatch FailedRefreshSemaphoreEvent when key doesnt exists", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;
                        const semaphore1 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore1.acquire();

                        const newTtl = TimeSpan.fromMilliseconds(100);
                        const noneExistingKey = "c";
                        const semaphore2 = semaphoreProvider.create(
                            noneExistingKey,
                            {
                                ttl: newTtl,
                                limit,
                            },
                        );

                        const handlerFn = vi.fn(
                            (_event: FailedRefreshSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_REFRESH,
                            handlerFn,
                        );
                        await semaphore2.refresh();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore2.key,
                                    ttl: semaphore2.ttl,
                                    slotId: semaphore2.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedRefreshSemaphoreEvent),
                        );
                    });
                    test("Should dispatch FailedRefreshSemaphoreEvent when slot doesnt exists", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;
                        const semaphore1 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore1.acquire();

                        const newTtl = TimeSpan.fromMilliseconds(100);
                        const noneExistingSlotId = "1";
                        const semaphore2 = semaphoreProvider.create(key, {
                            ttl: newTtl,
                            limit,
                            slotId: noneExistingSlotId,
                        });

                        const handlerFn = vi.fn(
                            (_event: FailedRefreshSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_REFRESH,
                            handlerFn,
                        );
                        await semaphore2.refresh();

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore2.key,
                                    ttl: semaphore2.ttl,
                                    slotId: semaphore2.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedRefreshSemaphoreEvent),
                        );
                    });
                    test("Should dispatch FailedRefreshSemaphoreEvent when slot is expired", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = TimeSpan.fromMilliseconds(50);
                        const semaphore = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        await semaphore.acquire();
                        await delay(ttl);

                        const handlerFn = vi.fn(
                            (_event: FailedRefreshSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_REFRESH,
                            handlerFn,
                        );
                        const newTtl = TimeSpan.fromMilliseconds(100);
                        await semaphore.refresh(newTtl);

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedRefreshSemaphoreEvent),
                        );
                    });
                    test("Should dispatch FailedRefreshSemaphoreEvent when slot exists, is expired", async () => {
                        const key = "a";
                        const ttl = TimeSpan.fromMilliseconds(50);
                        const limit = 2;

                        const semaphore = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        await semaphore.acquire();
                        await delay(ttl);

                        const handlerFn = vi.fn(
                            (_event: FailedRefreshSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_REFRESH,
                            handlerFn,
                        );
                        const newTtl = TimeSpan.fromMilliseconds(100);
                        await semaphore.refresh(newTtl);

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedRefreshSemaphoreEvent),
                        );
                    });
                    test("Should dispatch FailedRefreshSemaphoreEvent when slot exists, is unexpireable", async () => {
                        const key = "a";
                        const ttl = null;
                        const limit = 2;

                        const semaphore = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        await semaphore.acquire();

                        const handlerFn = vi.fn(
                            (_event: FailedRefreshSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_REFRESH,
                            handlerFn,
                        );
                        const newTtl = TimeSpan.fromMilliseconds(100);
                        await semaphore.refresh(newTtl);

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedRefreshSemaphoreEvent),
                        );
                    });
                    test("Should dispatch RefreshedSemaphoreEvent when slot exists, is unexpired", async () => {
                        const key = "a";
                        const ttl = TimeSpan.fromMilliseconds(50);
                        const limit = 2;

                        const semaphore = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        await semaphore.acquire();

                        const handlerFn = vi.fn(
                            (_event: RefreshedSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.REFRESHED,
                            handlerFn,
                        );
                        const newTtl = TimeSpan.fromMilliseconds(100);
                        await semaphore.refresh(newTtl);

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: newTtl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies RefreshedSemaphoreEvent),
                        );
                    });
                });
                describe("method: refreshOrFail", () => {
                    test("Should dispatch FailedRefreshSemaphoreEvent when key doesnt exists", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;
                        const semaphore1 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore1.acquire();

                        const newTtl = TimeSpan.fromMilliseconds(100);
                        const noneExistingKey = "c";
                        const semaphore2 = semaphoreProvider.create(
                            noneExistingKey,
                            {
                                ttl: newTtl,
                                limit,
                            },
                        );

                        const handlerFn = vi.fn(
                            (_event: FailedRefreshSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_REFRESH,
                            handlerFn,
                        );
                        try {
                            await semaphore2.refreshOrFail(newTtl);
                        } catch {
                            /* EMPTY */
                        }

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore2.key,
                                    ttl: semaphore2.ttl,
                                    slotId: semaphore2.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedRefreshSemaphoreEvent),
                        );
                    });
                    test("Should dispatch FailedRefreshSemaphoreEvent when slot doesnt exists", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = null;
                        const semaphore1 = semaphoreProvider.create(key, {
                            limit,
                            ttl,
                        });
                        await semaphore1.acquire();

                        const newTtl = TimeSpan.fromMilliseconds(100);
                        const noneExistingSlotId = "1";
                        const semaphore2 = semaphoreProvider.create(key, {
                            ttl: newTtl,
                            limit,
                            slotId: noneExistingSlotId,
                        });

                        const handlerFn = vi.fn(
                            (_event: FailedRefreshSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_REFRESH,
                            handlerFn,
                        );
                        try {
                            await semaphore2.refreshOrFail(newTtl);
                        } catch {
                            /* EMPTY */
                        }

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore2.key,
                                    ttl: semaphore2.ttl,
                                    slotId: semaphore2.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedRefreshSemaphoreEvent),
                        );
                    });
                    test("Should dispatch FailedRefreshSemaphoreEvent when slot is expired", async () => {
                        const key = "a";
                        const limit = 2;
                        const ttl = TimeSpan.fromMilliseconds(50);
                        const semaphore = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        await semaphore.acquire();
                        await delay(ttl);

                        const handlerFn = vi.fn(
                            (_event: FailedRefreshSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_REFRESH,
                            handlerFn,
                        );
                        const newTtl = TimeSpan.fromMilliseconds(100);
                        try {
                            await semaphore.refreshOrFail(newTtl);
                        } catch {
                            /* EMPTY */
                        }

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedRefreshSemaphoreEvent),
                        );
                    });
                    test("Should dispatch FailedRefreshSemaphoreEvent when slot exists, is expired", async () => {
                        const key = "a";
                        const ttl = TimeSpan.fromMilliseconds(50);
                        const limit = 2;

                        const semaphore = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        await semaphore.acquire();
                        await delay(ttl);

                        const handlerFn = vi.fn(
                            (_event: FailedRefreshSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_REFRESH,
                            handlerFn,
                        );
                        const newTtl = TimeSpan.fromMilliseconds(100);
                        try {
                            await semaphore.refreshOrFail(newTtl);
                        } catch {
                            /* EMPTY */
                        }

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedRefreshSemaphoreEvent),
                        );
                    });
                    test("Should dispatch FailedRefreshSemaphoreEvent when slot exists, is unexpireable", async () => {
                        const key = "a";
                        const ttl = null;
                        const limit = 2;

                        const semaphore = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        await semaphore.acquire();

                        const handlerFn = vi.fn(
                            (_event: FailedRefreshSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.FAILED_REFRESH,
                            handlerFn,
                        );
                        const newTtl = TimeSpan.fromMilliseconds(100);
                        try {
                            await semaphore.refreshOrFail(newTtl);
                        } catch {
                            /* EMPTY */
                        }

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: semaphore.ttl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies FailedRefreshSemaphoreEvent),
                        );
                    });
                    test("Should dispatch RefreshedSemaphoreEvent when slot exists, is unexpired", async () => {
                        const key = "a";
                        const ttl = TimeSpan.fromMilliseconds(50);
                        const limit = 2;

                        const semaphore = semaphoreProvider.create(key, {
                            ttl,
                            limit,
                        });
                        await semaphore.acquire();

                        const handlerFn = vi.fn(
                            (_event: RefreshedSemaphoreEvent) => {},
                        );
                        await semaphoreProvider.events.addListener(
                            SEMAPHORE_EVENTS.REFRESHED,
                            handlerFn,
                        );
                        const newTtl = TimeSpan.fromMilliseconds(100);
                        await semaphore.refreshOrFail(newTtl);

                        expect(handlerFn).toHaveBeenCalledTimes(1);
                        expect(handlerFn).toHaveBeenCalledWith(
                            expect.objectContaining({
                                semaphore: expect.objectContaining({
                                    key: semaphore.key,
                                    ttl: newTtl,
                                    slotId: semaphore.id,
                                    getState: expect.any(
                                        Function,
                                    ) as ISemaphoreStateMethods["getState"],
                                }) as ISemaphoreStateMethods,
                            } satisfies RefreshedSemaphoreEvent),
                        );
                    });
                });
            });
        }
        if (includeSerdeTests) {
            describe("Serde tests:", () => {
                test("Should return ISemaphoreExpiredState when is derserialized and key doesnt exists", async () => {
                    const key = "a";
                    const limit = 3;
                    const ttl = TimeSpan.fromMilliseconds(50);

                    const semaphore = semaphoreProvider.create(key, {
                        limit,
                        ttl,
                    });
                    const deserializedSemaphore = serde.deserialize<ISemaphore>(
                        serde.serialize(semaphore),
                    );

                    const result = await deserializedSemaphore.getState();

                    expect(result).toEqual({
                        type: SEMAPHORE_STATE.EXPIRED,
                    } satisfies ISemaphoreExpiredState);
                });
                test("Should return ISemaphoreExpiredState when is derserialized and key is expired", async () => {
                    const key = "a";
                    const ttl = TimeSpan.fromMilliseconds(50);
                    const limit = 2;

                    const semaphore = semaphoreProvider.create(key, {
                        ttl,
                        limit,
                    });
                    const deserializedSemaphore = serde.deserialize<ISemaphore>(
                        serde.serialize(semaphore),
                    );
                    await deserializedSemaphore.acquire();
                    await delay(ttl);

                    const result = await semaphore.getState();

                    expect(result).toEqual({
                        type: SEMAPHORE_STATE.EXPIRED,
                    } satisfies ISemaphoreExpiredState);
                });
                test("Should return ISemaphoreExpiredState when is derserialized and all slots are released with forceReleaseAll method", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await semaphore1.acquire();

                    const ttl2 = null;
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    const deserializedSemaphore2 =
                        serde.deserialize<ISemaphore>(
                            serde.serialize(semaphore2),
                        );
                    await deserializedSemaphore2.acquire();

                    await deserializedSemaphore2.forceReleaseAll();

                    const result = await semaphore1.getState();

                    expect(result).toEqual({
                        type: SEMAPHORE_STATE.EXPIRED,
                    } satisfies ISemaphoreExpiredState);
                });
                test("Should return ISemaphoreExpiredState when is derserialized and all slots are released with release method", async () => {
                    const key = "a";
                    const limit = 2;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        limit,
                        ttl: ttl1,
                    });
                    await semaphore1.acquire();

                    const ttl2 = null;
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    const deserialziedSemaphore2 =
                        serde.deserialize<ISemaphore>(
                            serde.serialize(semaphore2),
                        );
                    await deserialziedSemaphore2.acquire();

                    await semaphore1.release();
                    await deserialziedSemaphore2.release();

                    const result = await deserialziedSemaphore2.getState();

                    expect(result).toEqual({
                        type: SEMAPHORE_STATE.EXPIRED,
                    } satisfies ISemaphoreExpiredState);
                });
                test("Should return ISemaphoreUnacquiredState when is derserialized and slot is unacquired", async () => {
                    const key = "a";
                    const limit = 3;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await semaphore1.acquire();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    const deserialziedSemaphore2 =
                        serde.deserialize<ISemaphore>(
                            serde.serialize(semaphore2),
                        );

                    const state = await deserialziedSemaphore2.getState();

                    expect(state).toEqual({
                        type: SEMAPHORE_STATE.UNACQUIRED,
                        limit,
                        freeSlotsCount: limit - 1,
                        acquiredSlotsCount: 1,
                        acquiredSlots: [semaphore1.id],
                    } satisfies ISemaphoreUnacquiredState);
                });
                test("Should return ISemaphoreUnacquiredState when is derserialized and slot is expired", async () => {
                    const key = "a";
                    const limit = 3;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await semaphore1.acquire();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    const deserializedSemaphore2 =
                        serde.deserialize<ISemaphore>(
                            serde.serialize(semaphore2),
                        );
                    await deserializedSemaphore2.acquire();
                    await delay(ttl2);

                    const state = await deserializedSemaphore2.getState();

                    expect(state).toEqual({
                        type: SEMAPHORE_STATE.UNACQUIRED,
                        limit,
                        freeSlotsCount: limit - 1,
                        acquiredSlotsCount: 1,
                        acquiredSlots: [semaphore1.id],
                    } satisfies ISemaphoreUnacquiredState);
                });
                test("Should return ISemaphoreAcquiredState when is derserialized and slot is unexpired", async () => {
                    const key = "a";
                    const limit = 3;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await semaphore1.acquire();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    const deserializedSemaphore2 =
                        serde.deserialize<ISemaphore>(
                            serde.serialize(semaphore2),
                        );
                    await deserializedSemaphore2.acquire();

                    const state = await deserializedSemaphore2.getState();

                    expect(state).toEqual({
                        type: SEMAPHORE_STATE.ACQUIRED,
                        limit,
                        freeSlotsCount: limit - 2,
                        acquiredSlotsCount: 2,
                        acquiredSlots: [semaphore1.id, semaphore2.id],
                        remainingTime: ttl2,
                    } satisfies ISemaphoreAcquiredState);
                });
                test("Should return ISemaphoreLimitReachedState when is derserialized and limit is reached", async () => {
                    const key = "a";
                    const limit = 1;

                    const ttl1 = null;
                    const semaphore1 = semaphoreProvider.create(key, {
                        ttl: ttl1,
                        limit,
                    });
                    await semaphore1.acquire();

                    const ttl2 = TimeSpan.fromMilliseconds(50);
                    const semaphore2 = semaphoreProvider.create(key, {
                        ttl: ttl2,
                        limit,
                    });
                    const deserializedSemaphore2 =
                        serde.deserialize<ISemaphore>(
                            serde.serialize(semaphore2),
                        );
                    await delay(ttl2);

                    const state = await deserializedSemaphore2.getState();

                    expect(state).toEqual({
                        type: SEMAPHORE_STATE.LIMIT_REACHED,
                        limit,
                        acquiredSlots: [semaphore1.id],
                    } satisfies ISemaphoreLimitReachedState);
                });
            });
        }
    });
}
