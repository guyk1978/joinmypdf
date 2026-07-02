import path from "path";
import webpack from "webpack";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nodeStub = path.join(process.cwd(), "src/lib/node-stub.ts");

/**
 * `/` is the Next.js SaaS homepage (`src/app/page.tsx`).
 * The programmatic SEO tool directory is static at `tools/index.html` → `/tools/`
 * (merged into `out/` via scripts/merge-static-export.mjs). Do not add a root `index.html`.
 *
 * Enable static export for:
 * - explicit local static builds (`build:static`)
 * - Cloudflare build script (`build:cloudflare`)
 * - CI-forced static export (`NEXT_FORCE_STATIC_EXPORT=1`) used by next-on-pages
 * - Cloudflare Pages builds (`CF_PAGES=1`) when present
 */
const isCloudflarePages = process.env.CF_PAGES === "1";
const forceStaticExport = process.env.NEXT_FORCE_STATIC_EXPORT === "1";
const lifecycleEvent = process.env.npm_lifecycle_event;
const shouldExportStatic =
  forceStaticExport ||
  isCloudflarePages ||
  lifecycleEvent === "build:static" ||
  lifecycleEvent === "build:cloudflare";

const nextConfig: NextConfig = {
  ...(shouldExportStatic ? { output: "export" } : {}),
  trailingSlash: false,
  images: { unoptimized: true },
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:fs$/, nodeStub),
        new webpack.NormalModuleReplacementPlugin(/^node:https$/, nodeStub),
      );
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
