import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function stripLightModeRules(css) {
  let result = "";
  let i = 0;

  while (i < css.length) {
    const next = css.indexOf("html:not(.dark)", i);
    if (next === -1) {
      result += css.slice(i);
      break;
    }

    result += css.slice(i, next);
    const braceStart = css.indexOf("{", next);
    if (braceStart === -1) {
      result += css.slice(next);
      break;
    }

    let depth = 1;
    let j = braceStart + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth += 1;
      if (css[j] === "}") depth -= 1;
      j += 1;
    }
    i = j;
  }

  return result.replace(/html\.dark\s+/g, "");
}

function mergeDarkTokens(css) {
  const darkBlock = css.match(/html\.dark\s*\{([\s\S]*?)\n\}/);
  if (!darkBlock) return css;

  const darkVars = darkBlock[1];
  let next = css.replace(/:root\s*\{/, `:root {${darkVars}`);
  next = next.replace(/\nhtml\.dark\s*\{[\s\S]*?\n\}\n?/, "\n");
  return next;
}

async function processFile(relativePath) {
  const filePath = path.join(root, relativePath);
  const original = await readFile(filePath, "utf8");
  let css = stripLightModeRules(original);
  css = mergeDarkTokens(css);
  css = css.replace(/color-scheme:\s*light;?/g, "color-scheme: dark;");
  css = css.replace(/@apply([^;]*)\bdark:/g, "@apply$1");
  await writeFile(filePath, css, "utf8");
  const removed = (original.match(/html:not\(\.dark\)/g) || []).length;
  console.log(`${relativePath}: removed ${removed} light-mode rule blocks`);
}

await processFile("src/app/globals.css");
await processFile("src/styles/industrial-matte-tokens.css");
