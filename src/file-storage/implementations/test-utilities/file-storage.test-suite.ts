/**
 * @module FileStorage
 */

import {
    type beforeEach,
    type ExpectStatic,
    type SuiteAPI,
    type TestAPI,
} from "vitest";

import { type IFileStorage } from "@/file-storage/contracts/_module.js";
import { type ISerde } from "@/serde/contracts/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/test-utilities"`
 * @group TestUtilities
 */
export type FileStorageTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createFileStorage: () => Promisable<{
        fileStorage: IFileStorage;
        serde: ISerde;
    }>;
    /**
     * @default false
     */
    excludeEventTests?: boolean;
};

/**
 * The `fileStorageTestSuite` function simplifies the process of testing your custom implementation of {@link IFileStorage | `IFileStorage`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/test-utilities"`
 * @group TestUtilities
 */
export function fileStorageTestSuite(
    settings: FileStorageTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createFileStorage,
        describe,
        beforeEach,
        excludeEventTests = false,
    } = settings;
    let fileStorage: IFileStorage;
    beforeEach(async () => {
        fileStorage = await createFileStorage();
    });

    describe("Api tests:", () => {
        test.todo("Write tests!!!");
    });
    describe.skipIf(excludeEventTests)("Event tests:", () => {
        test.todo("Write tests!!!");
    });
}
