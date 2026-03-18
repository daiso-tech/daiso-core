/**
 * @module TimeSpan
 */

import { parse, format } from "@lukeed/ms";

import { type ISerializable } from "@/serde/contracts/_module.js";
import {
    TO_MILLISECONDS,
    type ITimeSpan,
} from "@/time-span/contracts/_module.js";
import { UnexpectedError, type IComparable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/time-span"`
 * @group Implementations
 */
export type SerializedTimeSpan = {
    version: "1";
    timeInMs: number;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/time-span"`
 * @group Implementations
 */
export type TimeSpanFromDateRangeSettings = {
    /**
     * @default
     * ```ts
     * new Date()
     * ```
     */
    start?: Date;

    /**
     * @default
     * ```ts
     * new Date()
     * ```
     */
    end?: Date;
};

/**
 * The `TimeSpan` class is used for representing time interval.
 * `TimeSpan` class cannot be negative, if you pass negative number it will be converted to 0.
 *
 * IMPORT_PATH: `"@daiso-tech/core/time-span"`
 * @group Implementations
 */
export class TimeSpan
    implements
        ITimeSpan,
        ISerializable<SerializedTimeSpan>,
        IComparable<ITimeSpan>
{
    private static secondInMilliseconds = 1000;
    private static minuteInMilliseconds = 60 * TimeSpan.secondInMilliseconds;
    private static hourInMilliseconds = 60 * TimeSpan.minuteInMilliseconds;
    private static dayInMilliseconds = 24 * TimeSpan.hourInMilliseconds;

    static deserialize(serializedValue: SerializedTimeSpan): TimeSpan {
        return new TimeSpan(serializedValue.timeInMs);
    }

    private constructor(private readonly milliseconds: number = 0) {
        this.milliseconds = Math.max(0, this.milliseconds);
    }

    equals(value: ITimeSpan): boolean {
        return value[TO_MILLISECONDS]() === this.toMilliseconds();
    }

    gt(value: ITimeSpan): boolean {
        return value[TO_MILLISECONDS]() < this.toMilliseconds();
    }

    gte(value: ITimeSpan): boolean {
        return value[TO_MILLISECONDS]() <= this.toMilliseconds();
    }

    lt(value: ITimeSpan): boolean {
        return value[TO_MILLISECONDS]() > this.toMilliseconds();
    }

    lte(value: ITimeSpan): boolean {
        return value[TO_MILLISECONDS]() >= this.toMilliseconds();
    }

    serialize(): SerializedTimeSpan {
        return {
            version: "1",
            timeInMs: this.toMilliseconds(),
        };
    }

    /**
     * Converts it to readable string
     */
    toString(): string {
        return format(this.milliseconds);
    }

    static fromMilliseconds(milliseconds: number): TimeSpan {
        return new TimeSpan().addMilliseconds(milliseconds);
    }

    static fromSeconds(seconds: number): TimeSpan {
        return new TimeSpan().addSeconds(seconds);
    }

    static fromMinutes(minutes: number): TimeSpan {
        return new TimeSpan().addMinutes(minutes);
    }

    static fromHours(hours: number): TimeSpan {
        return new TimeSpan().addHours(hours);
    }

    static fromDays(days: number): TimeSpan {
        return new TimeSpan().addDays(days);
    }

    static fromTimeSpan(timeSpan: ITimeSpan): TimeSpan {
        return new TimeSpan().addTimeSpan(timeSpan);
    }

    static fromDateRange({
        start = new Date(),
        end = new Date(),
    }: TimeSpanFromDateRangeSettings): TimeSpan {
        return new TimeSpan().addMilliseconds(end.getTime() - start.getTime());
    }

    /**
     * Create a `TimeSpan` from `string`
     *
     * @example
     * ```ts
     * // Will be 5000 milliseconds.
     * TimeSpan.fromStr("5s").toMilliseconds()
     * ```
     *
     * Under the hood, this method leverages [@lukeed/ms](https://www.npmjs.com/package/@lukeed/ms) package to convert various time formats into milliseconds.
     * Refer to its documentation for a complete list of supported time formats and units.
     */
    static fromStr(timeAsStr: string): TimeSpan {
        const timeInMs = parse(timeAsStr);
        if (timeInMs === undefined) {
            throw new UnexpectedError(
                "Passed in invalid string format to TimeSpan.fromStr",
            );
        }
        return new TimeSpan().addMilliseconds(timeInMs);
    }

    addMilliseconds(milliseconds: number): TimeSpan {
        return new TimeSpan(this.toMilliseconds() + milliseconds);
    }

    addSeconds(seconds: number): TimeSpan {
        return this.addMilliseconds(TimeSpan.secondInMilliseconds * seconds);
    }

    addMinutes(minutes: number): TimeSpan {
        return this.addMilliseconds(TimeSpan.minuteInMilliseconds * minutes);
    }

    addHours(hours: number): TimeSpan {
        return this.addMilliseconds(TimeSpan.hourInMilliseconds * hours);
    }

    addDays(days: number): TimeSpan {
        return this.addMilliseconds(TimeSpan.dayInMilliseconds * days);
    }

    addTimeSpan(timeSpan: ITimeSpan): TimeSpan {
        return this.addMilliseconds(timeSpan[TO_MILLISECONDS]());
    }

    subtractMilliseconds(milliseconds: number): TimeSpan {
        return new TimeSpan(this.toMilliseconds() - milliseconds);
    }

    subtractSeconds(seconds: number): TimeSpan {
        return this.subtractMilliseconds(
            TimeSpan.secondInMilliseconds * seconds,
        );
    }

    subtractMinutes(minutes: number): TimeSpan {
        return this.subtractMilliseconds(
            TimeSpan.minuteInMilliseconds * minutes,
        );
    }

    subtractHours(hours: number): TimeSpan {
        return this.subtractMilliseconds(TimeSpan.hourInMilliseconds * hours);
    }

    subtractDays(days: number): TimeSpan {
        return this.subtractMilliseconds(TimeSpan.dayInMilliseconds * days);
    }

    subtractTimeSpan(timeSpan: ITimeSpan): TimeSpan {
        return this.subtractMilliseconds(timeSpan[TO_MILLISECONDS]());
    }

    multiply(value: number): TimeSpan {
        return new TimeSpan(Math.round(value * this.toMilliseconds()));
    }

    divide(value: number): TimeSpan {
        return new TimeSpan(Math.round(this.toMilliseconds() / value));
    }

    [TO_MILLISECONDS](): number {
        return this.milliseconds;
    }

    toMilliseconds(): number {
        return this[TO_MILLISECONDS]();
    }

    toSeconds(): number {
        return Math.floor(this.milliseconds / TimeSpan.secondInMilliseconds);
    }

    toMinutes(): number {
        return Math.floor(this.milliseconds / TimeSpan.minuteInMilliseconds);
    }

    toHours(): number {
        return Math.floor(this.milliseconds / TimeSpan.hourInMilliseconds);
    }

    toDays(): number {
        return Math.floor(this.milliseconds / TimeSpan.dayInMilliseconds);
    }

    /**
     * Will return endDate relative to a given `startDate` argument.
     *
     * @default
     * ```ts
     * new Date()
     * ```
     */
    toEndDate(startDate = new Date()): Date {
        return new Date(startDate.getTime() + this.toMilliseconds());
    }

    /**
     * Will return startDate relative to a given `endDate` argument.
     *
     * @default
     * ```ts
     * new Date()
     * ```
     */
    toStartDate(endDate = new Date()): Date {
        return new Date(endDate.getTime() - this.toMilliseconds());
    }
}
