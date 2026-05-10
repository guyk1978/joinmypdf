import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pingSearchEngines } from "./ping-search-engines.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const toolsJsonPath = path.join(root, "assets", "data", "tools.json");
const blogJsonPath = path.join(root, "assets", "data", "blog.json");
const outputPath = path.join(root, "rss.xml");

const toolsRegistry = JSON.parse(await readFile(toolsJsonPath, "utf8"));
const blogRegistry = JSON.parse(await readFile(blogJsonPath, "utf8"));
const baseUrl = (toolsRegistry.site && toolsRegistry.site.baseUrl ? toolsRegistry.site.baseUrl : "https://joinmypdf.com").replace(/\/+$/, "");

const blogItems = (blogRegistry.blog || [])
  .slice()
  .sort((a, b) => Date.parse(b.publishDate || "1970-01-01") - Date.parse(a.publishDate || "1970-01-01"))
  .slice(0, 40)
  .map((post) => ({
    title: post.title,
    link: baseUrl + "/blog/" + post.slug + "/",
    pubDate: new Date(post.publishDate || Date.now()).toUTCString(),
    description: post.description || ("Guide for " + post.keyword),
  }));

const toolItems = (toolsRegistry.tools || []).slice(0, 20).map((tool) => ({
  title: tool.title + " Tool Update",
  link: baseUrl + "/tools/" + tool.slug + "/",
  pubDate: new Date(tool.updatedAt || Date.now()).toUTCString(),
  description: tool.description || tool.intent || tool.primaryKeyword || "PDF workflow tool update",
}));

const items = blogItems.concat(toolItems).slice(0, 60);

const rss =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<rss version="2.0">\n' +
  "<channel>\n" +
  "<title>JoinMyPDF Updates</title>\n" +
  "<link>" +
  baseUrl +
  "</link>\n" +
  "<description>Latest blog posts and tool updates from JoinMyPDF</description>\n" +
  items
    .map(
      (item) =>
        "<item>\n" +
        "<title>" +
        item.title +
        "</title>\n" +
        "<link>" +
        item.link +
        "</link>\n" +
        "<guid>" +
        item.link +
        "</guid>\n" +
        "<pubDate>" +
        item.pubDate +
        "</pubDate>\n" +
        "<description>" +
        item.description +
        "</description>\n" +
        "</item>"
    )
    .join("\n") +
  "\n</channel>\n</rss>\n";

await writeFile(outputPath, rss, "utf8");
console.log("RSS generated:", outputPath);

const sitemapUrl = baseUrl + "/sitemap.xml";
try {
  await pingSearchEngines(sitemapUrl, { maxAttempts: 2 });
} catch (error) {
  console.log("[ping] skipped after RSS generation:", error && error.message ? error.message : "unknown");
}
