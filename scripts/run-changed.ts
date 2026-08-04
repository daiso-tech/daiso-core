import { existsSync } from "node:fs";

import { execaSync, parseCommandString } from "execa";

/**
 * Minimal helper to parse CLI arguments like --key value
 */
function getArg(name: string): string | undefined {
    const index = process.argv.indexOf(name);
    if (index > -1 && process.argv[index + 1] !== undefined) {
        return process.argv[index + 1];
    }
    return undefined;
}

const scriptCmd = getArg("--script");
const extensions = getArg("--extension");
const baseBranch = getArg("--branch");

if (
    scriptCmd === undefined ||
    extensions === undefined ||
    baseBranch === undefined
) {
    console.error("❌ Missing required arguments!");
    console.log(
        'Usage: tsx run-changed.ts --script "..." --extension "..." --branch "..."',
    );
    console.log(
        'Example: tsx run-changed.ts --script "npx prettier --write" --extension "json,md" --branch "master"',
    );
    process.exit(1);
}

const CONFIG = {
    command: scriptCmd,
    extensions: extensions
        .split(",")
        .map((ext) => ext.trim().replace(/^\./, "")), // cleans " .ts" to "ts"
    baseBranch,
};

function getFiles(args: Array<string>): Array<string> {
    try {
        // execaSync spawns git directly with an argument array (no shell), so
        // branch names and paths are never interpolated into a shell command.
        return execaSync("git", args, {
            stdio: ["pipe", "pipe", "ignore"],
        })
            .stdout.split("\0")
            .filter((file) => file.length > 0);
    } catch {
        // Match the original behavior: a failed git call (e.g. an unknown
        // branch) yields no files instead of aborting the whole script.
        return [];
    }
}

function runTask(): void {
    // Get all files that differ from the target branch.
    // --diff-filter=d excludes deleted files: they no longer exist on disk, so
    // passing them to tools like ESLint/Prettier/TypeScript would fail.
    const changed = getFiles([
        "diff",
        "--name-only",
        "--diff-filter=d",
        "-z",
        CONFIG.baseBranch,
    ]);

    // Get all new files not yet tracked by git
    const untracked = getFiles([
        "ls-files",
        "--others",
        "--exclude-standard",
        "-z",
    ]);

    const extensionRegex = new RegExp(`\\.(${CONFIG.extensions.join("|")})$`);

    const targetFiles = Array.from(new Set([...changed, ...untracked]))
        .filter((file) => extensionRegex.test(file))
        // Only forward files that still exist on disk. This is a safety net on
        // top of --diff-filter=d so file-based tools never receive a path that
        // cannot be opened.
        .filter((file) => existsSync(file));

    if (targetFiles.length === 0) {
        console.log(
            `✨ No changed files found for extensions: ${CONFIG.extensions.join(", ")}`,
        );
        return;
    }

    console.log(`🔍 Branch: ${CONFIG.baseBranch}`);
    console.log(
        `🚀 Running: "${CONFIG.command}" on ${String(targetFiles.length)} file(s)`,
    );

    // Split the user command ("npx prettier --write") into a fixed executable
    // and its arguments with execa's parser, so the changed files can be
    // appended as individual arguments instead of being concatenated into a
    // shell command string.
    const [executable, ...commandArgs] = parseCommandString(CONFIG.command);

    if (executable === undefined || executable === "") {
        console.error("❌ Empty command.");
        process.exit(1);
    }

    try {
        // stdio: 'inherit' keeps the colored output of your tools (prettier/vitest)
        // execa spawns the tool directly with an argument array (no shell):
        // each target file is its own argument, so whitespace in paths is
        // preserved and shell metacharacters can never execute commands.
        // On Windows, execa also runs .cmd/.bat shims (e.g. npx) safely.
        execaSync(executable, [...commandArgs, "--", ...targetFiles], {
            stdio: "inherit",
        });
        console.log("✅ Done!");
    } catch {
        // We don't need to log the error here as 'inherit' already showed the
        // tool's output.
        console.error("❌ Task failed.");
        process.exit(1);
    }
}

runTask();
