import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const pendingPath = path.join(root, "drafts", "pending-seo-pages.json");
const toolsPath = path.join(root, "assets", "data", "tools.json");
const blogPath = path.join(root, "assets", "data", "blog.json");
const reportPath = path.join(root, "logs", "auto-execution-report.json");
const publishStatePath = path.join(root, "logs", "publish-state.json");

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function norm(text) {
  return String(text || "").toLowerCase().trim();
}

function runNodeScript(scriptFile) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptFile], { cwd: root, stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(scriptFile + " failed with exit code " + code));
    });
    child.on("error", reject);
  });
}

async function safeRead(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

const requestedIds = process.argv.slice(2).filter(Boolean);
if (!requestedIds.length) {
  console.log("Usage: node scripts/publish-approved-drafts.mjs draft-0001 draft-0002 ...");
  process.exit(0);
}

const [pending, toolsRegistry, blogRegistry, report, publishState] = await Promise.all([
  safeRead(pendingPath, { drafts: [] }),
  safeRead(toolsPath, { tools: [] }),
  safeRead(blogPath, { blog: [] }),
  safeRead(reportPath, { publishedPages: [] }),
  safeRead(publishStatePath, { byDate: {} }),
]);

const date = todayKey();
const alreadyPublishedToday = Number((publishState.byDate || {})[date] || 0);
const maxPerDay = 3;
const allowed = Math.max(0, maxPerDay - alreadyPublishedToday);
if (!allowed) {
  console.log("Daily publish limit reached (3).");
  process.exit(0);
}

const draftMap = new Map((pending.drafts || []).map((draft) => [draft.id, draft]));
const selected = requestedIds
  .map((id) => draftMap.get(id))
  .filter(Boolean)
  .filter((draft) => draft.publishEligible === true && Number(draft.qualityScore || 0) >= 7)
  .filter((draft) => String(draft.status || "pending_approval") === "approved")
  .slice(0, allowed);

if (!selected.length) {
  console.log("No valid approved draft IDs selected.");
  process.exit(0);
}

const published = [];
for (const draft of selected) {
  if (draft.recommendedType === "tool" || draft.recommendedType === "long-tail") {
    const toolSlug =
      String(draft.targetUrl || "").match(/\/tools\/([^/]+)/)?.[1] ||
      "pdf-merge";
    const tool = (toolsRegistry.tools || []).find((item) => item.slug === toolSlug);
    if (tool && draft.recommendedType === "long-tail") {
      tool.longTailPages = tool.longTailPages || [];
      if (!tool.longTailPages.some((entry) => norm(entry.slug) === norm(draft.slug))) {
        tool.longTailPages.push({
          slug: draft.slug,
          keyword: draft.keyword,
          angle: "Approved expansion from quality gate",
        });
      }
    }
    if (tool) {
      tool.updatedAt = todayKey();
      tool.priority = Math.max(Number(tool.priority || 0.7), 0.85);
      tool.homepageFeatureEligible = true;
    }
  } else {
    const exists = (blogRegistry.blog || []).some((post) => norm(post.slug) === norm(draft.slug));
    if (!exists) {
      blogRegistry.blog = blogRegistry.blog || [];
      blogRegistry.blog.push({
        slug: draft.slug,
        title: draft.title,
        keyword: draft.keyword,
        description: draft.metaDescription,
        publishDate: todayKey(),
        intentType: draft.intent,
        cluster: "approved-expansion",
        relatedTools: (draft.internalLinkSuggestions || [])
          .map((url) => String(url).match(/\/tools\/([^/]+)/)?.[1])
          .filter(Boolean)
          .slice(0, 4),
        relatedBlogs: [],
        seo: {
          metaTitle: draft.metaTitle,
          metaDescription: draft.metaDescription,
        },
        contentBlocks: {
          intro: "Approved draft: " + draft.keyword,
          body: [],
          faq: (draft.faqSuggestions || []).map((q) => ({
            q,
            a: "Answer drafted during approval workflow for " + draft.keyword + ".",
          })),
        },
      });
    }
  }
  published.push({
    id: draft.id,
    slug: draft.slug,
    keyword: draft.keyword,
    type: draft.recommendedType,
    publishedAt: new Date().toISOString(),
  });
}

await writeFile(toolsPath, JSON.stringify(toolsRegistry, null, 2), "utf8");
await writeFile(blogPath, JSON.stringify(blogRegistry, null, 2), "utf8");

const remainingDrafts = (pending.drafts || []).filter((draft) => !selected.some((s) => s.id === draft.id));
pending.drafts = remainingDrafts;
await writeFile(pendingPath, JSON.stringify(pending, null, 2), "utf8");

publishState.byDate = publishState.byDate || {};
publishState.byDate[date] = alreadyPublishedToday + published.length;
await writeFile(publishStatePath, JSON.stringify(publishState, null, 2), "utf8");

report.publishedPages = (report.publishedPages || []).concat(published);
await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

await runNodeScript(path.join("scripts", "generate-blog-og-images.mjs"));
await runNodeScript(path.join("scripts", "generate-blog-pages.mjs"));
await runNodeScript(path.join("scripts", "generate-seo-pages.mjs"));
await runNodeScript(path.join("scripts", "generate-sitemap.mjs"));
await runNodeScript(path.join("scripts", "generate-rss.mjs"));
await runNodeScript(path.join("scripts", "audit-index-graph.mjs"));

console.log("Published drafts:", published.length);
