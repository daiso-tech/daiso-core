/**
 * @module Utilities
 */

import { type WaitUntil } from "@/utilities/types/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/utilities"`
 * @group Utilities
 */
export const defaultWaitUntil: WaitUntil = (promise) => {
    promise.then(
        () => {},
        (error: unknown) => {
            console.error("Unhandled promise rejection:", error);
        },
    );
};
