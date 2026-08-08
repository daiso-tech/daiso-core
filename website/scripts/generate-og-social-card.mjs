/**
 * Generates the site-wide social card (static/img/og-social-card.png) using
 * the same branded generator as the per-page preview images.
 *
 * The generator is TypeScript and loaded by Docusaurus via jiti, so we reuse
 * jiti here to import it from plain Node.
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as path from "node:path";
import * as fs from "node:fs";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const jiti = require("jiti")(import.meta.url, {
    interopDefault: true,
    requireCache: false,
});

const { ogGenerator } = jiti(path.join(here, "..", "utilities", "og-generator.ts"));
const { PACKAGE_NAME, PACKAGE_VERSION } = jiti(
    path.join(here, "..", "utilities", "package-json-data.ts"),
);

const buffer = await ogGenerator({
    metadata: {
        title: `${PACKAGE_NAME} ${PACKAGE_VERSION}`,
        description:
            "Write business logic once. Replace infrastructure anytime. The adapter-first backend toolkit for TypeScript with interchangeable components — cache, locks, file storage, event bus, and more.",
        routePath: "/",
        contentTitle: PACKAGE_NAME,
    },
    assetsDir: "og-assets",
});

const outDir = path.join(here, "..", "static", "img");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "og-social-card.png");
fs.writeFileSync(outPath, buffer);

console.log(`Wrote ${path.relative(process.cwd(), outPath)} (${buffer.length} bytes)`);
