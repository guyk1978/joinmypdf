import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const locales = ["en", "he", "ru"];

for (const locale of locales) {
  const base = JSON.parse(
    await readFile(path.join(root, "messages", `${locale}.json`), "utf8"),
  );
  let extension = {};
  try {
    extension = JSON.parse(
      await readFile(
        path.join(root, "messages", "locale-extensions", `${locale}.json`),
        "utf8",
      ),
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const toolPage = extension.ToolPage ?? base.ToolPage;
  if (!toolPage) {
    throw new Error(`Missing ToolPage messages for locale "${locale}"`);
  }

  const outputDir = path.join(root, "public", "i18n", locale);
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, "tool-page.json"),
    `${JSON.stringify(toolPage)}\n`,
    "utf8",
  );
}

console.log("export-client-messages: wrote shared ToolPage locale assets");
