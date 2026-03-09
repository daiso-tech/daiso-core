/**
 * @module Utilities
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type ISqliteStatement = {
    readonly reader: boolean;
    all(parameters: ReadonlyArray<unknown>): Array<unknown>;
    run(parameters: ReadonlyArray<unknown>): {
        changes: number | bigint;
        lastInsertRowid: number | bigint;
    };
    iterate(parameters: ReadonlyArray<unknown>): IterableIterator<unknown>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type ISqliteDatabase = {
    close(): void;
    prepare(sql: string): ISqliteStatement;
};
