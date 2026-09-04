import { genericToken } from "eridu-tech/di/contracts";

interface IDatabase {
    query(sql: string, params: Array<unknown>): Promise<unknown>;
}

// token created with genericToken where
// `"Database service"` is the description and `IDatabase` is the phantom type.
const IDATABASE = genericToken<IDatabase>("Database service");
