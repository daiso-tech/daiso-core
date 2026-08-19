/**
 * Branded Open Graph image generator for the eridu-tech website.
 *
 * Renders a 1200x630 social card with @vercel/og: dark green gradient
 * background, soft glows, the real brand logo, an adaptive title, the page
 * description, and a footer with the package version and module count.
 */
import { ImageResponse } from "@vercel/og";
import {
    h,
    OG_WIDTH,
    OG_HEIGHT,
    COLORS,
    loadPoppinsFonts,
    LogoMark,
    getSectionLabel,
    adaptiveTitleSize,
    cleanTitle,
    decodeHtmlEntities,
    backgroundLayers,
} from "./og-image.js";
import {
    PACKAGE_NAME,
    PACKAGE_VERSION,
    COMPONENT_COUNT,
} from "./package-json-data.js";

interface OgMetadata {
    title?: string;
    description?: string;
    routePath: string;
    category?: string;
    contentTitle?: string;
    [key: string]: any;
}

interface OgGeneratorParams {
    metadata: OgMetadata;
    assetsDir: string;
}

// --- Layout styles ---------------------------------------------------------

const rootStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    position: "relative",
    overflow: "hidden",
    fontFamily: "Poppins",
    color: COLORS.text,
} as const;

const contentStyle = {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
    height: "100%",
    paddingTop: 64,
    paddingBottom: 54,
    paddingLeft: 84,
    paddingRight: 84,
} as const;

const headerStyle = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
} as const;

const brandStyle = { display: "flex", flexDirection: "row", alignItems: "center" } as const;

const wordmarkStyle = {
    fontSize: 30,
    fontWeight: 700,
    letterSpacing: 0.5,
    color: COLORS.text,
    marginLeft: 16,
} as const;

const pillStyle = {
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: 2.5,
    color: "rgba(255,255,255,0.9)",
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
} as const;

const heroStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    maxWidth: 820,
    marginTop: 58,
    marginBottom: 58,
} as const;

const accentBarStyle = {
    width: 72,
    height: 7,
    borderRadius: 4,
    background: "linear-gradient(90deg, #3ecc5f 0%, #25c2a0 100%)",
    marginBottom: 26,
} as const;

const titleBaseStyle = {
    fontWeight: 700,
    lineHeight: 1.16,
    letterSpacing: -0.4,
    color: COLORS.text,
    textShadow: "0 2px 24px rgba(0,0,0,0.35)",
    overflow: "hidden",
} as const;

const descStyle = {
    marginTop: 26,
    fontSize: 27,
    fontWeight: 400,
    lineHeight: 1.55,
    color: COLORS.textMuted,
    maxWidth: 820,
} as const;

const taglineFallbackStyle = {
    marginTop: 26,
    fontSize: 27,
    fontWeight: 400,
    color: COLORS.textFaint,
} as const;

const footerStyle = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
} as const;

const taglineStyle = {
    fontSize: 19,
    fontWeight: 500,
    color: COLORS.textFaint,
} as const;

const badgesStyle = { display: "flex", flexDirection: "row", alignItems: "center" } as const;

const badgeStyle = {
    fontSize: 18,
    fontWeight: 600,
    color: COLORS.badgeText,
    paddingTop: 9,
    paddingBottom: 9,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 999,
    background: COLORS.badgeBg,
    border: `1px solid ${COLORS.badgeBorder}`,
    marginLeft: 12,
} as const;

// --- Decorative module grid (top-right corner) -----------------------------

function buildModuleSquares(): ReturnType<typeof h> {
    const rows: ReturnType<typeof h>[] = [];
    for (let row = 0; row < 4; row++) {
        const cells: ReturnType<typeof h>[] = [];
        for (let col = 0; col < 2; col++) {
            const filled = (row + col) % 2 === 0;
            cells.push(
                h("div", {
                    style: {
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        border: `2px solid rgba(62,204,95,${filled ? 0.5 : 0.32})`,
                        background: filled ? "rgba(62,204,95,0.22)" : "transparent",
                        marginRight: col === 0 ? 16 : 0,
                        marginBottom: row < 3 ? 16 : 0,
                    },
                }),
            );
        }
        rows.push(h("div", { style: { display: "flex" } }, ...cells));
    }
    return h(
        "div",
        {
            style: {
                position: "absolute",
                top: 82,
                right: 84,
                display: "flex",
                flexDirection: "column",
            },
        },
        ...rows,
    );
}

// --- Generator -------------------------------------------------------------

export async function ogGenerator(params: OgGeneratorParams): Promise<Buffer> {
    const { metadata } = params;
    const routePath = metadata?.routePath || "/";
    const title = cleanTitle(metadata?.title || metadata?.contentTitle || PACKAGE_NAME);
    const description = decodeHtmlEntities(metadata?.description || "")
        .replace(/\s+/g, " ")
        .trim();

    const section = getSectionLabel(routePath);
    const titleSize = adaptiveTitleSize(title);

    const element = h(
        "div",
        { style: rootStyle },
        ...backgroundLayers(),
        buildModuleSquares(),
        h(
            "div",
            { style: contentStyle },
            // Header: brand + section pill
            h(
                "div",
                { style: headerStyle },
                h(
                    "div",
                    { style: brandStyle },
                    LogoMark({ size: 52 }),
                    h("div", { style: wordmarkStyle }, PACKAGE_NAME),
                ),
                h("div", { style: pillStyle }, section.toUpperCase()),
            ),
            // Hero: accent bar + title + description
            h(
                "div",
                { style: heroStyle },
                h("div", { style: accentBarStyle }),
                h(
                    "div",
                    {
                        style: {
                            ...titleBaseStyle,
                            fontSize: titleSize,
                            maxHeight: Math.round(titleSize * 1.16 * 3),
                        },
                    },
                    title,
                ),
                description
                    ? h("div", { style: descStyle }, description)
                    : h(
                          "div",
                          { style: taglineFallbackStyle },
                          "Write business logic once. Replace infrastructure anytime.",
                      ),
            ),
            // Footer: tagline + version/module badges
            h(
                "div",
                { style: footerStyle },
                h("div", { style: taglineStyle }, "Adapter-first backend toolkit for TypeScript"),
                h(
                    "div",
                    { style: badgesStyle },
                    h("div", { style: badgeStyle }, `v${PACKAGE_VERSION}`),
                    h("div", { style: badgeStyle }, `${COMPONENT_COUNT} modules`),
                ),
            ),
        ),
    );

    const response = new ImageResponse(element, {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        fonts: loadPoppinsFonts(),
    });
    return Buffer.from(await response.arrayBuffer());
}
