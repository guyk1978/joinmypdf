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
 * - Cloudflare build script (`build:cloudflare`) — publishes `out/` (no next-on-pages)
 * - CI-forced static export (`NEXT_FORCE_STATIC_EXPORT=1`)
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
  transpilePackages: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  // Redirects apply for `next start` / non-export hosts. Static Cloudflare builds
  // ignore next.config redirects — see root `_redirects` (copied into public/out/.vercel via scripts/copy-redirects.mjs).
  ...(!shouldExportStatic
    ? {
        async redirects() {
          return [
            {
              source: "/tools",
              destination: "/en/tools",
              permanent: true,
            },
            {
              source: "/tools/:path*",
              destination: "/en/tools/:path*",
              permanent: true,
            },
            {
              source: "/:locale(en|he|ru)/article/:slug/embed",
              destination: "/:locale/blog/:slug",
              permanent: true,
            },
            {
              source: "/:locale(en|he|ru)/article/:slug",
              destination: "/:locale/blog/:slug",
              permanent: true,
            },
          ];
        },
      }
    : {}),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          // Allow same-origin + blob Workers (FFmpeg classWorkerURL + toBlobURL cores).
          { key: "Content-Security-Policy", value: "worker-src 'self' blob:;" },
        ],
      },
      {
        source: "/workers/:path*",
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/static/ffmpeg/:path*",
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:fs$/, nodeStub),
        new webpack.NormalModuleReplacementPlugin(/^fs$/, nodeStub),
        new webpack.NormalModuleReplacementPlugin(/^node:path$/, nodeStub),
        new webpack.NormalModuleReplacementPlugin(/^path$/, nodeStub),
        new webpack.NormalModuleReplacementPlugin(/^node:https$/, nodeStub),
      );
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
