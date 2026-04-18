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
    signal: AbortSignal = new AbortController().signal,
): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        if (signal.aborted) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(signal.reason);
            return;
        }

        const timeoutId = setTimeout(() => {
            signal.removeEventListener("abort", onAbort);
            resolve();
        }, TimeSpan.fromTimeSpan(time).toMilliseconds());

        function onAbort(): void {
            clearTimeout(timeoutId);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(signal.reason);
        }
        signal.addEventListener("abort", onAbort, {
            once: true,
        });
        setTimeout(() => {
            resolve();
        }, TimeSpan.fromTimeSpan(time).toMilliseconds());
    });
}
