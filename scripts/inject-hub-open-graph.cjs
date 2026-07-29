/**
 * Inject buildPageSocialMetadata into hub / site pages that use varied
 * canonical path expressions (not only PAGE_PATH).
 */
const fs = require("fs");
const path = require("path");

const TARGETS = [
  {
    file: "src/app/[locale]/home/page.tsx",
    titleExpr: 't("homeTitle")',
    descExpr: 't("homeDescription")',
    canonicalExpr: "`/${locale}/home`",
  },
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === "page.tsx") out.push(full);
  }
  return out;
}

function ensureImport(source) {
  if (source.includes("buildPageSocialMetadata")) return source;
  const marker = 'import type { Metadata } from "next";';
  if (source.includes(marker)) {
    return source.replace(
      marker,
      `${marker}\nimport { buildPageSocialMetadata } from "@/lib/og-images";`,
    );
  }
  return `import { buildPageSocialMetadata } from "@/lib/og-images";\n${source}`;
}

let changed = 0;

// Home
{
  const file = "src/app/[locale]/home/page.tsx";
  let c = fs.readFileSync(file, "utf8");
  if (!c.includes("openGraph") && !c.includes("buildPageSocialMetadata")) {
    c = ensureImport(c);
    c = c.replace(
      /return \{\s*title: t\("homeTitle"\),\s*description: t\("homeDescription"\),\s*alternates: \{/,
      `const title = t("homeTitle");
  const description = t("homeDescription");
  const canonicalPath = \`/\${locale}/home\`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {`,
    );
    fs.writeFileSync(file, c);
    changed += 1;
    console.log("home");
  }
}

// Hub-style pages: metaTitle/metaDescription + canonical: `/${locale}${SOMETHING}`
const app = "src/app/[locale]";
for (const file of walk(app)) {
  let c = fs.readFileSync(file, "utf8");
  if (c.includes("openGraph") || c.includes("buildPageSocialMetadata") || c.includes("buildLocalizedToolMetadata")) {
    continue;
  }
  if (/export \{[^}]*generateMetadata/.test(c) && c.length < 600) continue;
  if (!c.includes("generateMetadata") || !c.includes("metaTitle")) continue;

  const re =
    /return \{\s*title:\s*t\("metaTitle"\),\s*description:\s*t\("metaDescription"\),\s*alternates:\s*\{\s*canonical:\s*(`[^`]+`|[^\n,]+),/;

  const m = c.match(re);
  if (!m) continue;

  const canonicalExpr = m[1].trim();
  c = ensureImport(c);
  c = c.replace(
    re,
    `const title = t("metaTitle");
  const description = t("metaDescription");
  const canonicalPath = ${canonicalExpr};
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,`,
  );
  fs.writeFileSync(file, c);
  changed += 1;
  console.log("hub", file);
}

console.log("changed", changed);
