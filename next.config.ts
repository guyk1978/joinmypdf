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
 * IMPORTANT:
 * `@cloudflare/next-on-pages` calls `npm run build` internally during `vercel build`.
 * If static export is enabled for generic production builds, Cloudflare receives
 * incompatible prerender config for app routes. Restrict static export to the
 * explicit `build:static` script only.
 */
const useStaticExport = process.env.npm_lifecycle_event === "build:static";

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
