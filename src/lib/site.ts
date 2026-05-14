export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://joinmypdf.com";

export function absoluteUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${p}`;
}
