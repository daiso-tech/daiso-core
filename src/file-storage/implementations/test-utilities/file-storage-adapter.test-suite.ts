/**
 * @module FileStorage
 */

import {
    type beforeEach,
    type ExpectStatic,
    type SuiteAPI,
    type TestAPI,
} from "vitest";

import { type IFileStorageAdapter } from "@/file-storage/contracts/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/test-utilities"`
 * @group TestUtilities
 */
export type FileStorageAdapterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<IFileStorageAdapter>;
    /**
     * @default false
     */
    excludeEventTests?: boolean;
};

/**
 * The `fileStorageAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link IFileStorageAdapter | `IFileStorageAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/test-utilities"`
 * @group TestUtilities
 */
export function fileStorageAdapterTestSuite(
    settings: FileStorageAdapterTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach,
        excludeEventTests = false,
    } = settings;
    let adapter: IFileStorageAdapter;
    beforeEach(async () => {
        adapter = await createAdapter();
    });

    describe("Api tests:", () => {
        test.todo("Write tests!!!");
    });
    describe.skipIf(excludeEventTests)("Event tests:", () => {
        test.todo("Write tests!!!");
    });
}
