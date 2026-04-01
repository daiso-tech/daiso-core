/**
 * @module Utilities
 */

import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/time-span.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Utilities
 */
export async function delay(
    time: ITimeSpan,
    signal = new AbortController().signal,
): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        signal.addEventListener(
            "abort",
            () => {
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                reject(signal.reason);
            },
            {
                once: true,
            },
        );
        setTimeout(() => {
            resolve();
        }, TimeSpan.fromTimeSpan(time).toMilliseconds());
    });
}
