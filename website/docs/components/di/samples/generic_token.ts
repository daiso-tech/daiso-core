import { genericToken } from "eridu-tech/di/contracts";
import { IDatabase } from "./idatabase";

// token created with genericToken where
// `"Database service"` is the description and `IDatabase` is the phantom type.
export const IDATABASE = genericToken<IDatabase>("Database service");
