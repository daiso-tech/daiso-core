import { genericToken } from "eridu-tech/di/contracts";

export interface IDatabase {
    query(sql: string, params: Array<unknown>): Promise<unknown>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}

export const IDATABASE = genericToken<IDatabase>("IDatabase");

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
