import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        exclude: [
            "./.changeset/**",
            "./.github/**",
            "./.vscode/**",
            "./dist/**",
            "./docs/**",
            "./node_modules/**",
            "./website/**",
            "./.eslintignore",
            "./.eslintrc.json",
            "./.gitattributes",
            "./.gitignore",
            "./.prettierignore",
            "./.prettierrc.json",
            "./.CHANGELOG.md",
            "./LICENSE.md",
            "./README.md",
            "./tsconfig.base.json",
            "./tsconfig.build.json",
            "./tsconfig.json",
            "./typedoc.json",
        ],
    },
    plugins: [
        tsconfigPaths({
            ignoreConfigErrors: true,
        }),
    ],
});
