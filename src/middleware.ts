import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * next-intl locale routing. Matcher covers:
 * - `/` (default locale redirect)
 * - `/en/...` and `/he/...` including `/[locale]/tools/:path*`
 * - other paths except api / static assets
 *
 * Note: with Cloudflare static export, middleware may not run for pre-rendered HTML.
 * SEO tool landings are also registered in `tools/[slug]/generateStaticParams`
 * so `/[locale]/tools/:slug` resolves when the dynamic segment handles the request.
 */
export default createMiddleware(routing);

export const config = {
  matcher: ["/", "/(en|he)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
