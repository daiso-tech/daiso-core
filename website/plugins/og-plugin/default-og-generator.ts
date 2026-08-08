/**
 * Fallback Open Graph generator used when no custom generator is supplied.
 * Renders a clean, centered card with @vercel/og — no brand assets required.
 */
import { ImageResponse } from "@vercel/og";
import {
    h,
    OG_WIDTH,
    OG_HEIGHT,
    COLORS,
    loadPoppinsFonts,
    getSectionLabel,
    adaptiveTitleSize,
    cleanTitle,
    decodeHtmlEntities,
    backgroundLayers,
} from "../../utilities/og-image.js";
import type { OgGeneratorParams } from "./types.js";

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
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    padding: 72,
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
    marginBottom: 36,
} as const;

const titleStyle = {
    fontWeight: 700,
    lineHeight: 1.18,
    letterSpacing: -0.4,
    color: COLORS.text,
    textAlign: "center",
    maxWidth: 920,
    overflow: "hidden",
} as const;

const descStyle = {
    marginTop: 28,
    fontSize: 27,
    fontWeight: 400,
    lineHeight: 1.55,
    color: COLORS.textMuted,
    textAlign: "center",
    maxWidth: 860,
} as const;

export async function defaultOgGenerator(params: OgGeneratorParams): Promise<Buffer> {
    const { metadata } = params;
    const routePath = metadata?.routePath || "/";
    const title = cleanTitle(metadata?.title || metadata?.contentTitle || "Eridu Tech");
    const description = decodeHtmlEntities(metadata?.description || "")
        .replace(/\s+/g, " ")
        .trim();
    const section = getSectionLabel(routePath);
    const titleSize = adaptiveTitleSize(title);

    const element = h(
        "div",
        { style: rootStyle },
        ...backgroundLayers(),
        h(
            "div",
            { style: contentStyle },
            h("div", { style: pillStyle }, section.toUpperCase()),
            h(
                "div",
                {
                    style: {
                        ...titleStyle,
                        fontSize: titleSize,
                        maxHeight: Math.round(titleSize * 1.18 * 3),
                    },
                },
                title,
            ),
            description ? h("div", { style: descStyle }, description) : null,
        ),
    );

    const response = new ImageResponse(element, {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        fonts: loadPoppinsFonts(),
    });
    return Buffer.from(await response.arrayBuffer());
}
