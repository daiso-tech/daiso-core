import { LIFETIME, genericToken } from "eridu-tech/di/contracts";

interface IDatabase {
    query(sql: string, params: Array<unknown>): Promise<unknown>;
}

const IDATABASE = genericToken<IDatabase>("IDatabase");

class Database implements IDatabase {
    query(sql: string, params: Array<unknown>): Promise<unknown> {
        /* ... */
    }
}
// `IDATABASE` service requires no dependency
container.registerFactory({
    token: IDATABASE,
    deps: {}, // No dependencies
    factory: (deps) => new Database(),
    lifetime: LIFETIME.SINGLETON,
});
