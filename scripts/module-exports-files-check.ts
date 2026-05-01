// check-exports.ts
// This script finds all _module-exports.ts files in src/ and checks that each is listed in package.json exports. Throws error if any are missing.

import * as fs from "node:fs/promises";
import * as path from "node:path";

async function findModuleExportsFiles(dir: string): Promise<Array<string>> {
    let results: Array<string> = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(await findModuleExportsFiles(fullPath));
        } else if (entry.isFile() && entry.name === "_module-exports.ts") {
            results.push(fullPath);
        }
    }
    return results;
}

// These types are defined for clarity and type safety
export type PackageExportsType = Partial<
    Record<
        string,
        {
            import?: string;
        }
    >
>;

export type PackageType = {
    exports?: PackageExportsType;
};

// eslint-disable-next-line sonarjs/cyclomatic-complexity
async function main() {
    try {
        // Use import.meta.url to get the directory of this script (ESM compatible, cross-platform)
        let scriptPath = new URL(import.meta.url).pathname;
        if (process.platform === "win32" && scriptPath.startsWith("/")) {
            scriptPath = scriptPath.slice(1);
        }
        const __dirname = path.dirname(scriptPath);
        const srcDir = path.resolve(__dirname, "../src");
        const pkgPath = path.resolve(__dirname, "../package.json");

        const moduleExportFiles = await findModuleExportsFiles(srcDir);

        const pkg = JSON.parse(
            await fs.readFile(pkgPath, "utf-8"),
        ) as PackageType;
        const exportsField: PackageExportsType = pkg.exports || {};

        // Build a set of all export paths (relative to dist, without extension)
        const exportedFiles = new Set<string>();
        for (const key in exportsField) {
            const entry = exportsField[key];
            if (entry === undefined) {
                continue;
            }
            if (entry.import === undefined) {
                continue;
            }
            const rel = entry.import
                .replace(/^\.\/dist\//, "")
                .replace(/\.(js|d\.ts)$/, "")
                .replace(/\\/g, "/");
            exportedFiles.add(rel);
        }

        // For each _module-exports.ts, check if it's exported
        const missingFiles: Array<string> = [];
        for (const file of moduleExportFiles) {
            const rel = path
                .relative(srcDir, file)
                .replace(/\\/g, "/")
                .replace(/\.ts$/, "");
            if (exportedFiles.has(rel)) {
                continue;
            }
            missingFiles.push(rel);
        }

        if (missingFiles.length > 0) {
            console.error(
                "❌ The following _module-exports.ts files are missing from package.json exports:",
            );
            for (const file of missingFiles) {
                console.error(`  - ./src/${file}.ts`);
            }
            process.exit(1);
        }
        console.log("✅ All _module-exports.ts files are properly exported!");
    } catch {
        process.exit(1);
    }
}

await main();
