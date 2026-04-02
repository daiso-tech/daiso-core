/**
 * @module Utilities
 */

import { type WaitUntil } from "@/utilities/types/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Utilities
 */
export const defaultWaitUntil: WaitUntil = (promise) => {
    promise.then(
        () => {},
        (error: unknown) => {
            console.log("Unhandled promise rejection:", error);
        },
    );
};
