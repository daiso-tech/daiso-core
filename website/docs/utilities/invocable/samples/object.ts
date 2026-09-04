import type { IInvocableObject } from "eridu-tech/utilities";

class InvocableObject implements IInvocableObject<
    [arg1: number, arg2: number],
    number
> {
    invoke(arg1: number, arg2: number): number {
        throw new Error("Method not implemented.");
    }
}

const invocableObject: IInvocableObject<[arg1: number, arg2: number], number> =
    {
        invoke(arg1: number, arg2: number): number {
            throw new Error("Method not implemented.");
        },
    };
