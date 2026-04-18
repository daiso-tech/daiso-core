/**
 * @module TimeSpan
 */

/**
 * Symbol key for TimeSpan conversion method.
 * Used to implement the `ITimeSpan` contract on duration/time objects.
 *
 * This symbol prevents naming conflicts by using a unique symbol as the property key.
 * Objects implementing ITimeSpan use this symbol to provide millisecond conversion.
 *
 * IMPORT_PATH: `"@daiso-tech/core/time-span/contracts"`
 * @group Contracts
 */
export const TO_MILLISECONDS = Symbol("TO_MILLISECONDS");

/**
 * Time span contract enabling interoperability with external duration/time libraries.
 * Provides a standard way to convert any duration representation to milliseconds.
 *
 * Allows this library to work with external time libraries without direct dependencies:
 * - Luxon Duration objects
 * - Dayjs Duration objects
 * - Custom time representation objects
 * - Standard JavaScript Date differences
 *
 * Implementers need only provide one method: convert their duration format to milliseconds.
 *
 * Usage:
 * 1. Implement ITimeSpan on your duration class by computing the TO_MILLISECONDS method
 * 2. Pass instances to any daiso-core function accepting ITimeSpan
 * 3. The library will call the method to get millisecond values for duration calculations
 *
 * IMPORT_PATH: `"@daiso-tech/core/time-span/contracts"`
 * @group Contracts
 */
export type ITimeSpan = {
    /**
     * Converts this time span to total milliseconds.
     * Used by the library for all duration-based calculations and comparisons.
     *
     * @returns Total time duration in milliseconds (must be >= 0)
     */
    [TO_MILLISECONDS](): number;
};
