/**
 * Safely strip ARTICLE_SECTIONS / article / visible FaqSection from dedicated tool pages.
 * Keeps FAQ JSON-LD via getLocalizedToolFaqs (reads registry documentation).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const toolsRoot = path.join(root, "src", "app", "[locale]", "tools");

const PAGE_FILES = [
  "image-watermark/page.tsx",
  "image-grid-splitter/page.tsx",
  "image-metadata-wiper/page.tsx",
  "image-dpi-converter/page.tsx",
  "image-blur-redact/page.tsx",
  "rotate-image/page.tsx",
  "favicon-generator/page.tsx",
  "color-palette-extractor/page.tsx",
  "color-converter/page.tsx",
  "global-timezone-converter/page.tsx",
  "storage-data-converter/page.tsx",
  "base-converter/page.tsx",
  "readability-analyzer/page.tsx",
  "text-sanitizer/page.tsx",
  "url-parameter-stripper/page.tsx",
  "json-csv-explorer/page.tsx",
  "network-tools/my-ip/page.tsx",
  "svg-optimizer/page.tsx",
  "image-converter/page.tsx",
  "lorem-ipsum-generator/page.tsx",
  "text-diff/page.tsx",
  "text-workspace/page.tsx",
  "ssl-decoder/page.tsx",
  "pdf-editor/page.tsx",
  "video-compressor/page.tsx",
  "video-converter/page.tsx",
  "video-resizer/page.tsx",
  "video-rotator/page.tsx",
  "video-speed/page.tsx",
  "video-to-gif/page.tsx",
  "video-trimmer/page.tsx",
  "video-to-mp3/page.tsx",
  "video-muter/page.tsx",
  "video-metadata-cleaner/page.tsx",
];

function removeSingleLineImport(source, modulePath) {
  const lines = source.split(/\r?\n/);
  const next = lines.filter((line) => {
    const trimmed = line.trim();
    return !(trimmed.startsWith("import ") && trimmed.includes(`"${modulePath}"`));
  });
  return next.join("\n");
}

function ensureImport(source, statement) {
  if (source.includes(statement)) return source;
  const lines = source.split(/\r?\n/);
  let lastImport = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].startsWith("import ")) lastImport = i;
  }
  if (lastImport === -1) return `${statement}\n${source}`;
  lines.splice(lastImport + 1, 0, statement);
  return lines.join("\n");
}

function ensureNamedImport(source, modulePath, name) {
  const re = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*"${modulePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}";`);
  const match = source.match(re);
  if (!match) {
    return ensureImport(source, `import { ${name} } from "${modulePath}";`);
  }
  const names = match[1].split(",").map((part) => part.trim()).filter(Boolean);
  if (names.includes(name)) return source;
  names.push(name);
  return source.replace(re, `import { ${names.join(", ")} } from "${modulePath}";`);
}

function cleanupPage(source) {
  let next = source;

  next = next.replace(/\r?\nconst ARTICLE_SECTIONS = \[[\s\S]*?\] as const;\r?\n/, "\n");
  next = next.replace(/\r?\n\s*<article[\s\S]*?<\/article>\r?\n/, "\n");
  next = next.replace(
    /\r?\n\s*\{faqs\.length \? \(\r?\n\s*<div[\s\S]*?<FaqSection[\s\S]*?<\/div>\r?\n\s*\) : null\}\r?\n/g,
    "\n",
  );
  next = next.replace(/\r?\n\s*<div className="border-b border-\[#262626\] py-10">\r?\n\s*<FaqSection[\s\S]*?<\/div>\r?\n/g, "\n");
  next = next.replace(/\r?\n\s*<FaqSection[\s\S]*?\/>\r?\n/g, "\n");

  if (!next.includes("<FaqSection")) {
    next = removeSingleLineImport(next, "@/components/layout/FaqSection");
  }

  // Ensure FAQ JSON-LD remains, fed by registry documentation.
  if (!next.includes("getLocalizedToolFaqs")) {
    next = ensureImport(next, 'import { getLocalizedToolFaqs } from "@/lib/i18n-tool-page";');
  }
  next = ensureNamedImport(next, "@/lib/schema", "faqLd");

  if (!next.includes("const faqs =")) {
    if (!next.includes('getTranslations("ToolPage")')) {
      next = next.replace(
        /const t = await getTranslations\("([^"]+)"\);/,
        `const t = await getTranslations("$1");\n  const tPage = await getTranslations("ToolPage");`,
      );
    }
    next = next.replace(
      /const pathname = `\/\$\{locale\}\$\{PAGE_PATH\}`;/,
      `const pathname = \`/\${locale}\${PAGE_PATH}\`;\n  const faqs = getLocalizedToolFaqs(tPage, tool, null, t("title"), locale);`,
    );
  }

  if (!next.includes("faqLd(faqs)")) {
    next = next.replace(
      /<JsonLd data=\{breadcrumbLd\(crumbs\)\} \/>/,
      `<JsonLd data={breadcrumbLd(crumbs)} />\n      {faqs.length ? <JsonLd data={faqLd(faqs)} /> : null}`,
    );
  }

  next = next.replace(/\n{3,}/g, "\n\n");
  return next;
}

function main() {
  let changed = 0;
  for (const relative of PAGE_FILES) {
    const filePath = path.join(toolsRoot, relative);
    if (!fs.existsSync(filePath)) {
      console.warn("missing", relative);
      continue;
    }
    const before = fs.readFileSync(filePath, "utf8");
    if (!before.includes("ARTICLE_SECTIONS") && !before.includes("<article")) {
      console.warn("skip (no article)", relative);
      continue;
    }
    const after = cleanupPage(before);
    if (!after.includes('from "next"') || !after.includes("AppPageShell")) {
      throw new Error(`Refusing to write broken page: ${relative}`);
    }
    fs.writeFileSync(filePath, after, "utf8");
    changed += 1;
    console.log("cleaned", relative);
  }
  console.log(`Updated ${changed} pages`);
}

main();
