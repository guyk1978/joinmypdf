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
 * Static export is disabled on Cloudflare Pages (`CF_PAGES=1`) so `/api/*` can run on Workers.
 */
const isCloudflarePages = process.env.CF_PAGES === "1";
const useStaticExport =
  !isCloudflarePages && process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  ...(useStaticExport ? { output: "export" } : {}),
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
