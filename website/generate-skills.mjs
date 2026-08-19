/**
 * Generate AI-agent skills (SKILL.md) from the library's TypeScript source
 * without emitting any TypeDoc HTML output.
 *
 * Reads options from ./typedoc.json, then uses the @skillit/typedoc plugin's
 * converter hook (EVENT_RESOLVE_END) to render and write skill files. Because
 * we only call `app.convert()` — never `app.generateDocs()` — no HTML docs are
 * produced.
 */
import { readFileSync, readdirSync, rmSync, mkdirSync, renameSync, createWriteStream } from "node:fs";
import { resolve, dirname, join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { Application, TSConfigReader } from "typedoc";
import { load } from "@skillit/typedoc";
import { ZipArchive } from "archiver";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const config = JSON.parse(readFileSync(resolve(here, "typedoc.json"), "utf8"));

// --- Expand entry points and apply exclude patterns ---
const toRegExp = (pattern) => {
    const escaped = pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*\*/g, "\u0000")
        .replace(/\*/g, "[^/]*")
        .replace(/\u0000/g, ".*");
    return new RegExp(`^${escaped}$`);
};

const excludes = (config.exclude ?? []).map((p) =>
    toRegExp(p.replace(/^\.\.\//, "").replace(/\\/g, "/")),
);

const walk = (dir) => {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walk(full));
        } else if (entry.isFile() && extname(entry.name) === ".ts") {
            results.push(full);
        }
    }
    return results;
};

const entryPoints = [];
for (const pattern of config.entryPoints ?? []) {
    const doubleStar = pattern.indexOf("**");
    const base = doubleStar === -1 ? dirname(pattern) : pattern.slice(0, doubleStar);
    const baseDir = resolve(here, base);
    for (const file of walk(baseDir)) {
        const rel = relative(repoRoot, file).replace(/\\/g, "/");
        if (!excludes.some((re) => re.test(rel))) {
            // TypeDoc treats entry points as glob patterns, which require
            // POSIX separators — backslashes are interpreted as escapes.
            entryPoints.push(file.replace(/\\/g, "/"));
        }
    }
}

// --- Bootstrap TypeDoc (converter only — no HTML renderer) ---
const app = await Application.bootstrap(
    {
        entryPoints,
        tsconfig: resolve(here, config.tsconfig ?? "../tsconfig.json"),
        skipErrorChecking: true,
    },
    // Only the TSConfigReader — do not pick up a repo-level typedoc.json.
    [new TSConfigReader()],
);

const zipOutDir = resolve(here, config.skillsZipOutDir ?? "static");
const zipName = config.skillsZipName ?? "eridu-tech-skills";
const tempDir = resolve(here, ".tmp-skills");
rmSync(tempDir, { recursive: true, force: true }); // clean stale temp output

// Register the @skillit/typedoc plugin and apply our options.
load(app);
app.options.setValue("skillsOutDir", tempDir);
if (config.skillsLicense !== undefined) {
    app.options.setValue("skillsLicense", config.skillsLicense);
}
if (config.skillsMaxTokens !== undefined) {
    app.options.setValue("skillsMaxTokens", config.skillsMaxTokens);
}

// Converter-only run: writes SKILL.md + references into tempDir (no HTML).
await app.convert();

// --- Package everything into a single zip under static/ ---
const zipPath = join(zipOutDir, `${zipName}.zip`);
rmSync(zipPath, { force: true }); // drop stale zip (do NOT wipe other static assets)
rmSync(resolve(here, "static/skills"), { recursive: true, force: true }); // drop old loose output layout
mkdirSync(zipOutDir, { recursive: true });

// Rename the inner package folder (e.g. "eridu-tech") to the configured zip name
const innerDir = readdirSync(tempDir, { withFileTypes: true }).find((e) => e.isDirectory());
if (innerDir && innerDir.name !== zipName) {
    renameSync(join(tempDir, innerDir.name), join(tempDir, zipName));
}

const output = createWriteStream(zipPath);
const archive = new ZipArchive({ zlib: { level: 9 } });
await new Promise((resolvePromise, rejectPromise) => {
    output.on("close", resolvePromise);
    output.on("error", rejectPromise);
    archive.on("error", rejectPromise);
    archive.pipe(output);
    archive.directory(tempDir, false); // contents at zip root (no wrapper folder)
    void archive.finalize().catch(rejectPromise);
});
rmSync(tempDir, { recursive: true, force: true }); // remove temp output

console.log(`[skills] Packaged ${zipName} -> ${zipPath}`);
