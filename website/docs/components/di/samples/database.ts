import { IDatabase } from "./idatabase";

export class Database implements IDatabase {
    query(sql: string, params: Array<unknown>): Promise<unknown> {
        /* ... */
        return Promise.resolve();
    }

    async connect(): Promise<void> {
        console.log("db connected");
    }

    async disconnect(): Promise<void> {
        console.log("db disconnected");
    }
}
