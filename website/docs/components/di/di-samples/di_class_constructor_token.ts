class Database implements IDatabase {
    query(sql: string, params: Array<unknown>): Promise<unknown> {
        /* ... */
    }
}

// Database's class constructor used as token.
const DATABASE = Database;
