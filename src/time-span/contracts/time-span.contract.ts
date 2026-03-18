/**
 * @module TimeSpan
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/time-span/contracts"`
 * @group Contracts
 */
export const TO_MILLISECONDS = Symbol("TO_MILLISECONDS");

/**
 * The `ITimeSpan` contract enables interoperability with external time libraries (e.g., `Luxon`, `Dayjs`).
 * To integrate, simply implement `ITimeSpan` on the duration objects of those libraries.
 *
 * IMPORT_PATH: `"@daiso-tech/core/time-span/contracts"`
 * @group Contracts
 */
export type ITimeSpan = {
    [TO_MILLISECONDS](): number;
};
