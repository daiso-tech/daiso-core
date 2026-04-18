/**
 * @module Utilities
 */

/**
 * Represents a prepared SQLite statement that can be executed with parameters.
 * Provides three execution modes: fetching all results, running a mutation,
 * or lazily iterating results one row at a time.
 *
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type ISqliteStatement = {
    /**
     * Whether this statement is a read-only query (SELECT).
     */
    readonly reader: boolean;

    /**
     * Executes the statement and returns all result rows as an array.
     * @param parameters - Positional bind parameters for the SQL statement.
     * @returns An array of row objects, or an empty array if no rows match.
     */
    all(parameters: ReadonlyArray<unknown>): Array<unknown>;

    /**
     * Executes a mutation statement (INSERT, UPDATE, DELETE) and returns metadata.
     * @param parameters - Positional bind parameters for the SQL statement.
     * @returns An object with the number of rows affected and the last inserted row ID.
     */
    run(parameters: ReadonlyArray<unknown>): {
        /**
         * Number of rows affected by the statement.
         */
        changes: number | bigint;
        /**
         * Row ID of the last inserted row. `0` if no row was inserted.
         */
        lastInsertRowid: number | bigint;
    };

    /**
     * Executes the statement and returns a lazy iterator over result rows.
     * Useful for large result sets where loading all rows into memory at once is undesirable.
     * @param parameters - Positional bind parameters for the SQL statement.
     * @returns A lazy iterator that yields one row at a time.
     */
    iterate(parameters: ReadonlyArray<unknown>): IterableIterator<unknown>;
};

/**
 * Minimal abstraction over a SQLite database connection.
 * Allows preparing and executing SQL statements.
 *
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type ISqliteDatabase = {
    /**
     * Closes the database connection and releases all associated resources.
     * After calling this method the database instance must not be used again.
     */
    close(): void;

    /**
     * Compiles the given SQL string into a reusable prepared statement.
     * @param sql - The SQL query or command to prepare.
     * @returns A prepared {@link ISqliteStatement | `ISqliteStatement`} ready for execution.
     */
    prepare(sql: string): ISqliteStatement;
};
