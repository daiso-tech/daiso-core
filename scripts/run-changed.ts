import { execSync } from "node:child_process";

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

function getFiles(command: string): Array<string> {
    try {
        return execSync(command, {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "ignore"],
        })
            .split("\n")
            .map((f) => f.trim())
            .filter(Boolean);
    } catch {
        return [];
    }
}

function runTask(): void {
    // Get all files that differ from the target branch
    const changed = getFiles(`git diff --name-only ${CONFIG.baseBranch}`);

    // Get all new files not yet tracked by git
    const untracked = getFiles("git ls-files --others --exclude-standard");

    const extensionRegex = new RegExp(`\\.(${CONFIG.extensions.join("|")})$`);

    const targetFiles = Array.from(new Set([...changed, ...untracked])).filter(
        (file) => extensionRegex.test(file),
    );

    if (targetFiles.length === 0) {
        console.log(
            `✨ No changed files found for extensions: ${CONFIG.extensions.join(", ")}`,
        );
        return;
    }

    console.log(`🔍 Branch: ${CONFIG.baseBranch}`);
    console.log(
        `🚀 Running: "${String(CONFIG.command)}" on ${String(targetFiles.length)} file(s)`,
    );

    try {
        const filesArg = targetFiles.join(" ");
        // stdio: 'inherit' keeps the colored output of your tools (prettier/vitest)
        execSync(`${String(CONFIG.command)} ${filesArg}`, { stdio: "inherit" });
        console.log("✅ Done!");
    } catch {
        console.error("❌ Task failed.");
        // We don't need to log the error here as 'inherit' already showed the tool's output
        process.exit(1);
    }
}

runTask();
