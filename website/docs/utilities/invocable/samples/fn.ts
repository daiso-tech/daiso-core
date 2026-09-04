import type { InvocableFn } from "eridu-tech/utilities";

// Using InvocableFn
type AddFunction = InvocableFn<[arg1: number, arg2: number], number>;

// Equivalent to:
type TraditionalFunction = (arg1: number, arg2: number) => number;
