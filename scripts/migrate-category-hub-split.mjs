/**
 * Migrate category hub pages to CategoryHubSplit (50/50 content | tools).
 * Run: node scripts/migrate-category-hub-split.mjs
 */
import fs from "fs";
import path from "path";

const roots = [
  "src/app/[locale]/tools",
];

const hubDirs = [
  "pdf-tools",
  "mp4-tools",
  "convert-tools",
  "yaml-tools",
  "xml-tools",
  "word-tools",
  "video-tools",
  "unit-converters",
  "text-tools",
  "security-tools",
  "rotate-tools",
  "productivity-tools",
  "png-tools",
  "network-tools",
  "mp3-tools",
  "json-tools",
  "jpg-tools",
  "favicon-tools",
  "extract-tools",
  "excel-tools",
  "developer-tools",
  "data-conversion-tools",
  "crop-tools",
  "compress-tools",
];

function ensureImport(src) {
  if (src.includes("CategoryHubSplit")) return src;
  const needle = 'from "@/components/CategoryHubPageHeader";';
  const idx = src.indexOf(needle);
  if (idx !== -1) {
    const insertAt = idx + needle.length;
    return (
      src.slice(0, insertAt) +
      '\nimport { CategoryHubSplit } from "@/components/CategoryHubSplit";' +
      src.slice(insertAt)
    );
  }
  const needle2 = 'from "@/components/AppPageShell";';
  const idx2 = src.indexOf(needle2);
  if (idx2 !== -1) {
    const insertAt = idx2 + needle2.length;
    return (
      src.slice(0, insertAt) +
      '\nimport { CategoryHubSplit } from "@/components/CategoryHubSplit";' +
      src.slice(insertAt)
    );
  }
  return src;
}

function addHubSplitClass(src) {
  return src
    .replace(
      /tools-directory-page tools-directory-page--pdf-split page-container/g,
      "tools-directory-page tools-directory-page--hub-split page-container",
    )
    .replace(
      /tools-directory-page page-container/g,
      "tools-directory-page tools-directory-page--hub-split page-container",
    );
}

/**
 * Find matching closing tag index for a JSX element starting at openIdx.
 * openIdx points at '<' of the opening tag.
 */
function findElementEnd(src, openIdx) {
  const tagMatch = src.slice(openIdx).match(/^<\/?([A-Za-z][\w.]*)/);
  if (!tagMatch) return -1;
  const tag = tagMatch[1];
  // Self-closing?
  const selfClose = src.slice(openIdx).match(/^<[^>]*\/>/);
  if (selfClose && !src.slice(openIdx, openIdx + selfClose[0].length).includes(`</${tag}`)) {
    // Check it's truly self-closing at first >
    const firstGt = src.indexOf(">", openIdx);
    if (firstGt > openIdx && src[firstGt - 1] === "/") return firstGt + 1;
  }

  let i = openIdx;
  let depth = 0;
  const openRe = new RegExp(`<${tag}(\\s|>|/)`, "g");
  const closeRe = new RegExp(`</${tag}>`, "g");

  while (i < src.length) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;
    const openM = openRe.exec(src);
    const closeM = closeRe.exec(src);
    if (!closeM) return -1;

    if (openM && openM.index < closeM.index) {
      const start = openM.index;
      const gt = src.indexOf(">", start);
      if (gt === -1) return -1;
      const isSelf = src[gt - 1] === "/";
      if (!isSelf) depth += 1;
      i = gt + 1;
    } else {
      depth -= 1;
      i = closeM.index + closeM[0].length;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function isToolsBlock(block) {
  return (
    /tools-hub-panel/.test(block) ||
    /convert-tools-panel/.test(block) ||
    /CategoryDirectoryFlatGrid/.test(block) ||
    /PdfToolsCardGrid/.test(block) ||
    /ToolsDirectoryDashboard/.test(block) ||
    /pdf-tools-split__tools/.test(block) ||
    /category-hub-split__tools/.test(block)
  );
}

function migrateAlreadySplit(src) {
  // pdf-tools already uses pdf-tools-split — convert to CategoryHubSplit
  if (!src.includes("pdf-tools-split") && !src.includes("category-hub-split")) {
    return null;
  }
  if (src.includes("<CategoryHubSplit")) return src;

  let out = src;
  out = out.replace(/className="pdf-tools-split"/g, 'className="category-hub-split"');
  out = out.replace(/pdf-tools-split__/g, "category-hub-split__");
  out = out.replace(/category-hub-split__related-hubs/g, "category-hub-split__related");
  out = out.replace(/category-hub-split__content/g, "category-hub-split__content");
  // Wrap with component instead of raw divs for consistency
  out = out.replace(
    /<div className="category-hub-split">\s*<div className="category-hub-split__content">/,
    `<CategoryHubSplit\n            content={\n              <>`,
  );
  out = out.replace(
    /<\/div>\s*<div className="category-hub-split__tools">/,
    `</>\n            }\n            tools={\n              <>`,
  );
  out = out.replace(
    /<\/div>\s*<\/div>\s*\n(\s*)<footer/,
    `</>\n            }\n          />\n\n$1<footer`,
  );
  return out;
}

function migrateLinear(src) {
  if (src.includes("<CategoryHubSplit")) return src;

  // Locate container start after CategoryHubPageHeader block ends
  const headerIdx = src.indexOf("<CategoryHubPageHeader");
  if (headerIdx === -1) return src;

  const headerEnd = findElementEnd(src, headerIdx);
  if (headerEnd === -1) {
    console.warn("Could not find CategoryHubPageHeader end");
    return src;
  }

  // Find footer or end of container
  const footerIdx = src.indexOf("<footer", headerEnd);
  const endMarker = footerIdx !== -1 ? footerIdx : src.indexOf("</div>\n      </AppPageShell>", headerEnd);
  if (endMarker === -1) {
    console.warn("Could not find footer/end");
    return src;
  }

  const middle = src.slice(headerEnd, endMarker);
  if (!middle.trim()) return src;

  // Split middle into top-level JSX chunks by walking
  const chunks = [];
  let i = 0;
  const trimmed = middle;
  while (i < trimmed.length) {
    while (i < trimmed.length && /\s/.test(trimmed[i])) i += 1;
    if (i >= trimmed.length) break;
    // comments
    if (trimmed.startsWith("{/*", i)) {
      const end = trimmed.indexOf("*/}", i);
      if (end === -1) break;
      i = end + 3;
      continue;
    }
    if (trimmed[i] === "<") {
      // relative to src: need absolute
      const abs = headerEnd + i;
      const end = findElementEnd(src, abs);
      if (end === -1) {
        console.warn("chunk parse fail at", abs);
        break;
      }
      chunks.push(src.slice(abs, end));
      i = end - headerEnd;
      continue;
    }
    if (trimmed[i] === "{") {
      // expression block — rare at top level
      let depth = 0;
      let j = i;
      for (; j < trimmed.length; j++) {
        if (trimmed[j] === "{") depth++;
        else if (trimmed[j] === "}") {
          depth--;
          if (depth === 0) {
            j++;
            break;
          }
        }
      }
      chunks.push(trimmed.slice(i, j));
      i = j;
      continue;
    }
    // skip unknown
    i += 1;
  }

  if (!chunks.length) return src;

  const tools = [];
  const content = [];
  for (const chunk of chunks) {
    if (isToolsBlock(chunk)) {
      // Normalize group classes
      let c = chunk
        .replace(/tools-hub-panel border-b border-\[#262626\] py-8 first:pt-0/g, "tools-hub-panel category-hub-split__group")
        .replace(/tools-hub-panel border-b border-\[#262626\] pb-8/g, "tools-hub-panel category-hub-split__group")
        .replace(/tools-hub-panel convert-tools-panel/g, "tools-hub-panel convert-tools-panel category-hub-split__group")
        .replace(/tools-hub-panel p-0/g, "tools-hub-panel category-hub-split__group")
        .replace(/tools-hub-panel(?![^\n]*category-hub-split__group)/, "tools-hub-panel category-hub-split__group");
      tools.push(c);
    } else {
      let c = chunk
        .replace(/mt-10 border-t border-\[#262626\] pt-8/g, "category-hub-split__related")
        .replace(/mt-8 border-t border-\[#262626\] pt-6/g, "category-hub-split__related");
      // related section className cleanup for link lists
      if (/related|explore|whyCompress|ToolsHubRelatedGuides|CategorySeoSection/i.test(c)) {
        content.push(c);
      } else {
        content.push(c);
      }
    }
  }

  if (!tools.length) {
    // Nothing to put on the right — abort
    console.warn("No tools blocks found — skipping structural wrap");
    return src;
  }

  const indent = "          ";
  const wrap = `
${indent}<CategoryHubSplit
${indent}  content={
${indent}    <>
${content.map((c) => c.replace(/^/gm, "      ").replace(/^      /, "")).join("\n\n") || `${indent}      {null}`}
${indent}    </>
${indent}  }
${indent}  tools={
${indent}    <>
${tools.join("\n\n")}
${indent}    </>
${indent}  }
${indent}/>
`;

  // Fix indentation of content/tools - simpler construction:
  const contentInner = content.length
    ? content.map((c) => c.replace(/\n/g, "\n              ")).join("\n\n              ")
    : "{null}";
  const toolsInner = tools.map((c) => c.replace(/\n/g, "\n              ")).join("\n\n              ");

  const splitJsx = `
          <CategoryHubSplit
            content={
              <>
              ${contentInner}
              </>
            }
            tools={
              <>
              ${toolsInner}
              </>
            }
          />
`;

  return src.slice(0, headerEnd) + splitJsx + "\n" + src.slice(endMarker);
}

let ok = 0;
let fail = 0;

for (const dir of hubDirs) {
  const file = path.join("src/app/[locale]/tools", dir, "page.tsx");
  if (!fs.existsSync(file)) {
    console.log("missing", file);
    fail++;
    continue;
  }
  let src = fs.readFileSync(file, "utf8");
  const before = src;
  src = ensureImport(src);
  src = addHubSplitClass(src);

  if (dir === "pdf-tools" || src.includes("pdf-tools-split")) {
    const migrated = migrateAlreadySplit(src);
    if (migrated) src = migrated;
  } else {
    src = migrateLinear(src);
  }

  if (src !== before) {
    fs.writeFileSync(file, src);
    console.log("updated", dir);
    ok++;
  } else {
    console.log("unchanged", dir);
  }
}

console.log(`Done. updated=${ok}`);
