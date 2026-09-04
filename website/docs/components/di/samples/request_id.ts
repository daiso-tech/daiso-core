import { genericToken } from "eridu-tech/di/contracts";

// A context token for the current request id
export const REQUEST_ID = genericToken<string>("RequestId");
