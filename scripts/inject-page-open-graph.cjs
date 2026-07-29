/**
 * Inject buildPageSocialMetadata into generateMetadata returns that lack openGraph.
 */
const fs = require("fs");
const path = require("path");

const APP = path.join(__dirname, "..", "src", "app");

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
  if (source.includes('from "@/lib/og-images"')) {
    return source.replace(
      /import \{([^}]+)\} from ["']@\/lib\/og-images["'];/,
      (m, inner) => {
        if (inner.includes("buildPageSocialMetadata")) return m;
        return `import {${inner.replace(/\s+$/, "")}, buildPageSocialMetadata } from "@/lib/og-images";`;
      },
    );
  }
  // Insert after first import block line that uses next/metadata or next-intl
  const marker = 'import type { Metadata } from "next";';
  if (source.includes(marker)) {
    return source.replace(
      marker,
      `${marker}\nimport { buildPageSocialMetadata } from "@/lib/og-images";`,
    );
  }
  return `import { buildPageSocialMetadata } from "@/lib/og-images";\n${source}`;
}

/**
 * Pattern A — dedicated tools with PAGE_PATH:
 *   return {
 *     title: t("metaTitle"),
 *     description: t("metaDescription"),
 *     alternates: { canonical: `/${locale}${PAGE_PATH}`, ...
 */
function injectDedicated(source) {
  if (source.includes("openGraph") || source.includes("buildPageSocialMetadata(")) {
    return null;
  }
  if (!source.includes("PAGE_PATH") || !source.includes("generateMetadata")) {
    return null;
  }

  const re =
    /(export async function generateMetadata\([\s\S]*?\)[^{]*\{\s*const \{ locale \} = await params;\s*const t = await getTranslations\([^;]+;\s*)return \{\s*title:\s*t\("metaTitle"\),\s*description:\s*t\("metaDescription"\),\s*alternates:\s*\{/;

  if (!re.test(source)) return null;

  let next = ensureImport(source);
  next = next.replace(
    re,
    `$1const title = t("metaTitle");
  const description = t("metaDescription");
  const canonicalPath = \`/\${locale}\${PAGE_PATH}\`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {`,
  );

  // Fix canonical inside alternates if it used template — leave as-is (still correct).
  return next;
}

/**
 * Pattern B — SEO hand pages with PAGE_PATH (same as A often).
 * Pattern C — generateSeoToolLandingMetadata in lib (handled separately).
 */
function injectSeoLib(source, filePath) {
  if (!filePath.endsWith(`${path.sep}seo-tool-landings.ts`)) return null;
  if (source.includes("buildPageSocialMetadata")) return null;

  let next = source;
  if (!next.includes('from "@/lib/og-images"')) {
    next = next.replace(
      'import type { Metadata } from "next";',
      'import type { Metadata } from "next";\nimport { buildPageSocialMetadata } from "@/lib/og-images";',
    );
  }

  const old = `  return {
    title: t(\`\${slug}.metaTitle\`),
    description: t(\`\${slug}.metaDescription\`),
    alternates: {
      canonical: \`/\${locale}\${path}\`,
      languages: Object.fromEntries(routing.locales.map((item) => [item, \`/\${item}\${path}\`])),
    },
  };`;

  const neu = `  const title = t(\`\${slug}.metaTitle\`);
  const description = t(\`\${slug}.metaDescription\`);
  const canonicalPath = \`/\${locale}\${path}\`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(routing.locales.map((item) => [item, \`/\${item}\${path}\`])),
    },
  };`;

  if (!next.includes(old)) {
    // try without escaped backticks in file
    const altOld = `  return {
    title: t(\`\${slug}.metaTitle\`),
    description: t(\`\${slug}.metaDescription\`),
    alternates: {
      canonical: \`/\${locale}\${path}\`,
      languages: Object.fromEntries(routing.locales.map((item) => [item, \`/\${item}\${path}\`])),
    },
  };`;
    if (!next.includes("title: t(`${slug}.metaTitle`)")) return null;
    next = next.replace(
      /return \{\s*title: t\(`\$\{slug\}\.metaTitle`\),\s*description: t\(`\$\{slug\}\.metaDescription`\),\s*alternates: \{\s*canonical: `\/\$\{locale\}\$\{path\}`,\s*languages: Object\.fromEntries\(routing\.locales\.map\(\(item\) => \[item, `\/\$\{item\}\$\{path\}`\]\)\),\s*\},\s*\};/,
      `const title = t(\`\${slug}.metaTitle\`);
  const description = t(\`\${slug}.metaDescription\`);
  const canonicalPath = \`/\${locale}\${path}\`;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(routing.locales.map((item) => [item, \`/\${item}\${path}\`])),
    },
  };`,
    );
    return next;
  }

  return next.replace(old, neu);
}

const pages = walk(APP);
let changed = 0;
let skipped = 0;
const samples = [];

for (const file of pages) {
  const source = fs.readFileSync(file, "utf8");
  // Skip pure re-exports
  if (/export \{[^}]*generateMetadata/.test(source) && source.length < 600) {
    skipped += 1;
    continue;
  }
  if (source.includes("openGraph") || source.includes("buildLocalizedToolMetadata")) {
    skipped += 1;
    continue;
  }

  const next = injectDedicated(source);
  if (!next || next === source) {
    skipped += 1;
    continue;
  }
  fs.writeFileSync(file, next);
  changed += 1;
  if (samples.length < 15) samples.push(path.relative(process.cwd(), file));
}

// SEO landings helper
const seoLib = path.join(__dirname, "..", "src", "lib", "seo-tool-landings.ts");
{
  const source = fs.readFileSync(seoLib, "utf8");
  const next = injectSeoLib(source, seoLib);
  if (next && next !== source) {
    fs.writeFileSync(seoLib, next);
    changed += 1;
    samples.push("src/lib/seo-tool-landings.ts");
  }
}

console.log(JSON.stringify({ changed, skipped, samples }, null, 2));
