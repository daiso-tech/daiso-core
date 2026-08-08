# OG Image Generator Plugin

This Docusaurus plugin generates a professional Open Graph image for **every**
page of the site at build time and injects the matching `og:image` /
`twitter:image` meta tags into the rendered HTML.

Rendering uses [`@vercel/og`](https://vercel.com/docs/functions/og-image-generation/og-image-api)
(Satori + resvg), which gives us full CSS flexbox layouts, gradients, custom
fonts, and crisp vector-rendered output — no native dependencies.

## How it works

During `postBuild`:

1. Each rendered `*.html` file is parsed for its `<title>` and meta
   `description`.
2. The configured generator renders a 1200×630 PNG into `build/preview_images/`.
3. `og:image`, `twitter:image` and `twitter:card` meta tags are injected into
   the page `<head>`.

## Configuration

The plugin is enabled in `docusaurus.config.ts`:

```ts
plugins: [
    [
        require.resolve("./plugins/og-plugin/index.ts"),
        {
            // Optional: a custom branded generator. Defaults to a clean
            // @vercel/og card (default-og-generator.ts).
            ogGenerator,
            // Directory (relative to the website root) holding OG assets
            // such as fonts. Defaults to "og-assets".
            assetsDir: "og-assets",
        },
    ],
],
```

The site's branded generator lives in `utilities/og-generator.ts` and shares
helpers from `utilities/og-image.ts` (fonts, logo, colors, layout primitives).

## Assets

- `og-assets/fonts/*.ttf` — Poppins (Regular, Medium, SemiBold, Bold) used by
  the generators. They are loaded at build time and never shipped to the
  browser.

## Site-wide social card

The default `themeConfig.image` social card (`static/img/og-social-card.png`)
is generated from the same branded generator:

```sh
npm run og:social-card
```
