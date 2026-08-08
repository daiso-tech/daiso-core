/**
 * Shared building blocks for Open Graph image generation with @vercel/og.
 *
 * NOTE: No JSX is used on purpose. Docusaurus loads these modules with jiti,
 * which does not transform JSX, so every element is built with
 * React.createElement through the tiny `h` helper.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import React from "react";

/** Shorthand for React.createElement. */
export const h = React.createElement;

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export const COLORS = {
    bgDeep: "#07130d",
    bgDark: "#0d2216",
    bgMid: "#133320",
    primary: "#2e8555",
    primaryLight: "#3cad6e",
    accent: "#3ecc5f",
    teal: "#25c2a0",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.78)",
    textFaint: "rgba(255,255,255,0.55)",
    badgeBg: "rgba(62,204,95,0.12)",
    badgeBorder: "rgba(62,204,95,0.4)",
    badgeText: "#a6e8b8",
} as const;

// ---------------------------------------------------------------------------
// Fonts (Poppins, bundled in og-assets/fonts)
// ---------------------------------------------------------------------------

type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

type FontSpec = {
    name: string;
    data: ArrayBuffer;
    weight: FontWeight;
    style: "normal";
};

let cachedFonts: FontSpec[] | null = null;

function toArrayBuffer(buf: Buffer): ArrayBuffer {
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

function findAssetRoot(): string {
    const candidates = [
        path.join(process.cwd(), "og-assets"),
        path.join(process.cwd(), "website", "og-assets"),
    ];
    for (const dir of candidates) {
        if (fs.existsSync(path.join(dir, "fonts", "Poppins-Regular.ttf"))) {
            return dir;
        }
    }
    throw new Error(
        "OG generator: could not locate og-assets/fonts (Poppins). Build from the website/ directory.",
    );
}

export function loadPoppinsFonts(): FontSpec[] {
    if (cachedFonts) return cachedFonts;
    const fontsDir = path.join(findAssetRoot(), "fonts");
    const weights = [
        ["Poppins-Regular.ttf", 400],
        ["Poppins-Medium.ttf", 500],
        ["Poppins-SemiBold.ttf", 600],
        ["Poppins-Bold.ttf", 700],
    ] as const;
    cachedFonts = weights.map(([file, weight]) => ({
        name: "Poppins",
        data: toArrayBuffer(fs.readFileSync(path.join(fontsDir, file))),
        weight,
        style: "normal",
    }));
    return cachedFonts;
}

// ---------------------------------------------------------------------------
// Brand logo (rasterized from the real SVG)
// ---------------------------------------------------------------------------

let cachedLogoDataUri: string | null = null;

function getLogoDataUri(): string {
    if (!cachedLogoDataUri) {
        const candidates = [
            path.join(process.cwd(), "static", "img", "logo.svg"),
            path.join(process.cwd(), "website", "static", "img", "logo.svg"),
        ];
        const logoPath = candidates.find((p) => fs.existsSync(p));
        if (!logoPath) {
            throw new Error("OG generator: could not locate static/img/logo.svg");
        }
        const svg = fs.readFileSync(logoPath, "utf8");
        cachedLogoDataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    }
    return cachedLogoDataUri;
}

export function LogoMark({ size = 48 }: { size?: number }) {
    return h(
        "div",
        {
            style: {
                width: size,
                height: size,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
            },
        },
        h("img", {
            src: getLogoDataUri(),
            width: size - 8,
            height: size - 8,
        }),
    );
}

// ---------------------------------------------------------------------------
// Text + section helpers
// ---------------------------------------------------------------------------

export function cleanTitle(title: string): string {
    const lastPipe = title.lastIndexOf("|");
    return (lastPipe !== -1 ? title.slice(0, lastPipe) : title).trim();
}

export function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&apos;/g, "'");
}

export function getSectionLabel(routePath: string): string {
    if (routePath === "/") return "Home";
    if (routePath.startsWith("/docs")) return "Documentation";
    if (routePath.startsWith("/blog")) return "Blog";
    return "Eridu Tech";
}

export function adaptiveTitleSize(title: string): number {
    if (title.length <= 26) return 68;
    if (title.length <= 42) return 60;
    if (title.length <= 60) return 52;
    return 46;
}

// ---------------------------------------------------------------------------
// Background layers (gradient + soft glows)
// ---------------------------------------------------------------------------

export function backgroundLayers(): ReturnType<typeof h>[] {
    return [
        h("div", {
            style: {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #07130d 0%, #0d2216 48%, #133320 100%)",
            },
        }),
        h("div", {
            style: {
                position: "absolute",
                top: -160,
                right: -140,
                width: 640,
                height: 640,
                borderRadius: 320,
                background:
                    "radial-gradient(circle, rgba(62,204,95,0.20) 0%, rgba(62,204,95,0) 68%)",
            },
        }),
        h("div", {
            style: {
                position: "absolute",
                bottom: -200,
                left: -160,
                width: 600,
                height: 600,
                borderRadius: 300,
                background:
                    "radial-gradient(circle, rgba(37,194,160,0.16) 0%, rgba(37,194,160,0) 68%)",
            },
        }),
    ];
}
