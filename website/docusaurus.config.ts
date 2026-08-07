/**
 * The code is taken from [signalwire docs](https://github.com/signalwire/docs/blob/main/website/config/ogImages/signalwireOgGenerator.ts)
 */

import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
// @ts-ignore
import docusaurusPluginLlmsTxt, {
    type PluginOptions,
} from "@signalwire/docusaurus-plugin-llms-txt";
import { ogGenerator } from "./utilities/og-generator";
import { PACKAGE_NAME, PACKAGE_VERSION } from "./utilities/package-json-data";

const title = `${PACKAGE_NAME} ${PACKAGE_VERSION}`;
const config: Config = {
    title: title,
    tagline:
        "Write business logic once. Replace infrastructure anytime. The adapter-first backend toolkit for TypeScript.",
    favicon: "img/favicon.ico",

    // Set the production url of your site here
    url: "https://www.eridu-tech.dev/",

    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: "/",

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: "yousif-khalil-abdulkarim", // Usually your GitHub org/user name.
    projectName: PACKAGE_NAME, // Usually your repo name.

    onBrokenLinks: "throw",
    markdown: {
        hooks: {
            onBrokenMarkdownLinks: "throw",
        },
    },

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },

    plugins: [
        [
            docusaurusPluginLlmsTxt,
            {
                siteTitle: PACKAGE_NAME,
                siteDescription: `Mastering ${PACKAGE_NAME}: Comprehensive Guides for the Backend Server Component Library`,
                enableDescriptions: true,
                content: {
                    relativePaths: true,
                    includeDocs: true,
                    includeVersionedDocs: false,
                    includeBlog: false,
                    includePages: false,
                    includeGeneratedIndex: false,
                    enableLlmsFullTxt: true,
                },
            } satisfies PluginOptions,
        ],
        [
            require.resolve("./plugins/og-plugin/index.ts"),
            {
                canvasGenerator: ogGenerator,
            },
        ],
    ],

    presets: [
        [
            "classic",
            {
                docs: {
                    sidebarPath: "./sidebars.ts",
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        "https://github.com/eridu-tech/eridu-tech-core/tree/main/website/",
                },
                blog: {
                    showReadingTime: true,
                    feedOptions: {
                        type: ["rss", "atom"],
                        xslt: true,
                    },
                    onInlineTags: "warn",
                    onInlineAuthors: "warn",
                    onUntruncatedBlogPosts: "warn",
                },
                theme: {
                    customCss: "./src/css/custom.css",
                },
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        algolia:
            process.env["ALGOLIA_ID"] &&
            process.env["ALGOLIA_KEY"] &&
            process.env["ALGOLIA_INDEX"]
                ? {
                      appId: process.env["ALGOLIA_ID"],
                      apiKey: process.env["ALGOLIA_KEY"],
                      indexName: process.env["ALGOLIA_INDEX"],
                  }
                : undefined,
        // Replace with your project's social card
        image: "img/docusaurus-social-card.jpg",
        navbar: {
            title: PACKAGE_NAME,
            logo: {
                alt: `${PACKAGE_NAME} Logo`,
                src: "img/logo.svg",
            },
            items: [
                {
                    type: "docSidebar",
                    sidebarId: "docs",
                    position: "left",
                    label: "Docs",
                },
                {
                    to: "/blog",
                    label: "Blog",
                    position: "left",
                },
                {
                    label: "API docs",
                    href: "https://eridu-tech.github.io/eridu-tech/modules.html",
                    position: "left",
                },
                {
                    href: "https://github.com/eridu-tech/eridu-tech-core/",
                    label: "GitHub",
                    position: "right",
                },
                {
                    href: "https://www.npmjs.com/package/eridu-tech",
                    label: "NPM",
                    position: "right",
                },
            ],
        },
        footer: {
            style: "dark",
            copyright: `© ${String(new Date().getFullYear())} ${PACKAGE_NAME}. Built with Docusaurus.`,
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
        metadata: [
            {
                name: "Descriptions",
                content:
                    "Write business logic once. Replace infrastructure anytime. The adapter-first backend toolkit for TypeScript with interchangeable components — cache, locks, file storage, event bus, and more.",
            },
            { name: "robots", content: "index, follow" },
        ],
    } satisfies Preset.ThemeConfig,
};

export default config;
