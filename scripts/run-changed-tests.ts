import { execSync } from "node:child_process";

/**
 * Helper to extract named arguments like --branch <value>
 */
function getArg(name: string): string | undefined {
    const index = process.argv.indexOf(name);
    if (index > -1 && process.argv[index + 1] !== undefined) {
        return process.argv[index + 1];
    }
    return undefined;
}

function runSmartTests(): void {
    // Look specifically for the value after --branch
    const baseBranch = getArg("--branch");

    // Validation: Now checks if the flag or its value is missing
    if (baseBranch === undefined) {
        console.error("❌ Error: No base branch provided.");
        console.error(
            "Usage: npx tsx scripts/run-changed-tests.ts --branch <branch-name>",
        );
        process.exit(1);
    }

    const lockFile = "package-lock.json";

    try {
        // baseBranch is now "origin/main", making this: git diff --name-only origin/main
        const changedFiles = execSync(`git diff --name-only ${baseBranch}`, {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "ignore"], // Keeps the output clean
        });

        if (changedFiles.includes(lockFile)) {
            console.log(`📦 ${lockFile} changed. Running full suite...`);
            executeCommand("npm run test");
        } else {
            console.log(`🧪 Running tests for changed files only...`);
            executeCommand("npm run _test:changed");
        }
    } catch {
        console.error("❌ Task failed.");
        console.error(
            `\nError: Git could not find or compare against "${baseBranch}".`,
        );
        process.exit(1);
    }
}

function executeCommand(command: string): void {
    try {
        execSync(command, { stdio: "inherit" });
    } catch {
        // Exit code is handled by the tool itself via 'inherit'
        process.exit(1);
    }
}

runSmartTests();
