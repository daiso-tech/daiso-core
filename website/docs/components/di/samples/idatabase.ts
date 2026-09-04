export interface IDatabase {
    query(sql: string, params: Array<unknown>): Promise<unknown>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}
