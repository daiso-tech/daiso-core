import { ITimeSpan, TO_MILLISECONDS } from "eridu-tech/time-span/contracts";

export class Duration implements ITimeSpan {
    constructor(private readonly timeInMs: number) {}

    [TO_MILLISECONDS](): number {
        return this.timeInMs;
    }
}
