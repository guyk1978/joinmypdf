import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const toolsJsonPath = path.join(root, "assets", "data", "tools.json");
const blogJsonPath = path.join(root, "assets", "data", "blog.json");
const signalsJsonPath = path.join(root, "assets", "data", "performance-signals.json");
const roadmapPath = path.join(root, "assets", "data", "seo-roadmap.json");
const reportPath = path.join(root, "assets", "data", "seo-feedback-report.json");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeReadJson(filePath, fallback) {
  return readFile(filePath, "utf8")
    .then((raw) => JSON.parse(raw))
    .catch(() => fallback);
}

function buildSignalMap(signals) {
  const map = new Map();
  const entries = Array.isArray(signals.pages)
    ? signals.pages
    : Array.isArray(signals)
      ? signals
      : [];
  entries.forEach((entry) => {
    if (!entry || !entry.type || !entry.slug) return;
    map.set(entry.type + ":" + entry.slug, entry);
  });
  return map;
}

function scoreFromSignal(signal, defaults) {
  if (!signal) return defaults;
  const ctr = toNumber(signal.ctr, defaults.ctr);
  const impressions = toNumber(signal.impressions, defaults.impressions);
  const crawlFrequency = toNumber(signal.crawlFrequency, defaults.crawlFrequency);
  const ctrScore = clamp(ctr / 12, 0, 1);
  const impressionScore = clamp(Math.log10(Math.max(1, impressions + 1)) / 5, 0, 1);
  const crawlScore = clamp(crawlFrequency / 30, 0, 1);
  return {
    ctr,
    impressions,
    crawlFrequency,
    score: Number((ctrScore * 0.45 + impressionScore * 0.35 + crawlScore * 0.2).toFixed(4)),
  };
}

function enrichTool(tool, signalMap) {
  const defaults = { ctr: 2.5, impressions: 500, crawlFrequency: 6 };
  const signal = signalMap.get("tool:" + tool.slug);
  const scored = scoreFromSignal(signal, defaults);
  const priority = Number(clamp(0.65 + scored.score * 0.3, 0.5, 0.95).toFixed(2));
  const longTailPriority = Number(clamp(priority - 0.2, 0.5, 0.75).toFixed(2));
  const internalLinkWeight = Number(clamp(1 + scored.score * 2, 1, 3).toFixed(2));
  return {
    ...tool,
    priority,
    longTailPriority,
    internalLinkWeight,
    homepageFeatureEligible: priority >= 0.8,
    updatedAt: new Date().toISOString().slice(0, 10),
    signals: scored,
  };
}

function enrichBlog(post, signalMap) {
  const defaults = { ctr: 1.8, impressions: 200, crawlFrequency: 4 };
  const signal = signalMap.get("blog:" + post.slug);
  const scored = scoreFromSignal(signal, defaults);
  const priority = Number(clamp(0.6 + scored.score * 0.25, 0.6, 0.8).toFixed(2));
  const internalLinkWeight = Number(clamp(1 + scored.score * 2, 1, 3).toFixed(2));
  const homepageFeatureEligible = priority >= 0.72;
  return {
    ...post,
    priority,
    internalLinkWeight,
    homepageFeatureEligible,
    signals: scored,
  };
}

const [toolsRegistry, blogRegistry, signals] = await Promise.all([
  safeReadJson(toolsJsonPath, { tools: [] }),
  safeReadJson(blogJsonPath, { blog: [] }),
  safeReadJson(signalsJsonPath, { pages: [] }),
]);
const roadmap = await safeReadJson(roadmapPath, []);

const signalMap = buildSignalMap(signals);
const highPriorityRoadmap = (Array.isArray(roadmap) ? roadmap : [])
  .filter((entry) => entry.priority === "high")
  .slice(0, 20);

const toolBoostMap = new Map();
const blogBoostMap = new Map();
highPriorityRoadmap.forEach((entry) => {
  const link = String(entry.linkToExisting || entry.targetUrl || "");
  const toolMatch = link.match(/\/tools\/([^/]+)\//);
  const blogMatch = link.match(/\/blog\/([^/]+)\//);
  if (toolMatch && toolMatch[1]) {
    toolBoostMap.set(toolMatch[1], (toolBoostMap.get(toolMatch[1]) || 0) + 0.08);
  }
  if (blogMatch && blogMatch[1]) {
    blogBoostMap.set(blogMatch[1], (blogBoostMap.get(blogMatch[1]) || 0) + 0.08);
  }
});

const enrichedTools = (toolsRegistry.tools || []).map((tool) => {
  const enriched = enrichTool(tool, signalMap);
  const boost = toolBoostMap.get(tool.slug) || 0;
  return {
    ...enriched,
    priority: Number(clamp(enriched.priority + boost, 0.5, 0.95).toFixed(2)),
    internalLinkWeight: Number(clamp(enriched.internalLinkWeight + boost * 10, 1, 3).toFixed(2)),
    homepageFeatureEligible: enriched.homepageFeatureEligible || boost > 0.05,
  };
});

const enrichedBlogs = (blogRegistry.blog || []).map((post) => {
  const enriched = enrichBlog(post, signalMap);
  const boost = blogBoostMap.get(post.slug) || 0;
  return {
    ...enriched,
    priority: Number(clamp(enriched.priority + boost, 0.6, 0.85).toFixed(2)),
    internalLinkWeight: Number(clamp(enriched.internalLinkWeight + boost * 10, 1, 3).toFixed(2)),
    homepageFeatureEligible: enriched.homepageFeatureEligible || boost > 0.05,
  };
});

const updatedToolsRegistry = { ...toolsRegistry, tools: enrichedTools };
const updatedBlogRegistry = { ...blogRegistry, blog: enrichedBlogs };

await writeFile(toolsJsonPath, JSON.stringify(updatedToolsRegistry, null, 2), "utf8");
await writeFile(blogJsonPath, JSON.stringify(updatedBlogRegistry, null, 2), "utf8");

const report = {
  generatedAt: new Date().toISOString(),
  sources: {
    usedSignals: Array.isArray(signals.pages) ? signals.pages.length : Array.isArray(signals) ? signals.length : 0,
    fallbackMode:
      !(Array.isArray(signals.pages) ? signals.pages.length : Array.isArray(signals) ? signals.length : 0),
    roadmapBoostEntries: highPriorityRoadmap.length,
  },
  summary: {
    toolsUpdated: enrichedTools.length,
    blogsUpdated: enrichedBlogs.length,
    homepageEligibleBlogs: enrichedBlogs.filter((post) => post.homepageFeatureEligible).length,
    homepageEligibleTools: enrichedTools.filter((tool) => tool.homepageFeatureEligible).length,
  },
};
await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

console.log(
  "SEO feedback loop completed. Tools:",
  report.summary.toolsUpdated,
  "Blogs:",
  report.summary.blogsUpdated,
  "Fallback mode:",
  report.sources.fallbackMode
);
