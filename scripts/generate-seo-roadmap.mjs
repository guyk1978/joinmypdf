import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const toolsJsonPath = path.join(root, "assets", "data", "tools.json");
const blogJsonPath = path.join(root, "assets", "data", "blog.json");
const outputPath = path.join(root, "assets", "data", "seo-roadmap.json");

const toolsRegistry = JSON.parse(await readFile(toolsJsonPath, "utf8"));
const blogRegistry = JSON.parse(await readFile(blogJsonPath, "utf8"));

function norm(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return new Set(norm(text).split(" ").filter(Boolean));
}

const existingKeywords = new Set();
for (const tool of toolsRegistry.tools || []) {
  existingKeywords.add(norm(tool.primaryKeyword));
  (tool.secondaryKeywords || []).forEach((kw) => existingKeywords.add(norm(kw)));
  (tool.longTailPages || []).forEach((lt) => existingKeywords.add(norm(lt.keyword)));
}
for (const post of blogRegistry.blog || []) {
  existingKeywords.add(norm(post.keyword));
}

const opportunities = [
  { keyword: "merge pdf online fast", intent: "transactional", bucket: "high-intent" },
  { keyword: "compress pdf under 1mb", intent: "problem-solving", bucket: "high-intent" },
  { keyword: "split pdf large file", intent: "problem-solving", bucket: "high-intent" },
  { keyword: "pdf tools on mobile", intent: "transactional", bucket: "mobile" },
  { keyword: "merge pdf on iphone", intent: "transactional", bucket: "mobile" },
  { keyword: "compress pdf android", intent: "transactional", bucket: "mobile" },
  { keyword: "adobe vs free pdf tools", intent: "comparison", bucket: "comparison" },
  { keyword: "best pdf tools 2026 alternatives", intent: "comparison", bucket: "comparison" },
  { keyword: "how to fix large pdf files", intent: "problem-solving", bucket: "problem" },
  { keyword: "email pdf too big", intent: "problem-solving", bucket: "problem" },
  { keyword: "merge scanned pdf pages", intent: "problem-solving", bucket: "problem" },
  { keyword: "secure online pdf merger", intent: "trust/security", bucket: "trust" },
  { keyword: "best pdf compressor for email", intent: "transactional", bucket: "high-intent" },
  { keyword: "split pdf on mobile browser", intent: "transactional", bucket: "mobile" },
  { keyword: "free pdf tools for students", intent: "informational", bucket: "educational" },
];

function inferTool(keyword) {
  const k = norm(keyword);
  if (k.includes("merge")) return "pdf-merge";
  if (k.includes("compress") || k.includes("size") || k.includes("1mb") || k.includes("email")) return "pdf-compress";
  if (k.includes("split")) return "pdf-split";
  if (k.includes("jpg to pdf") || k.includes("scanned")) return "jpg-to-pdf";
  if (k.includes("pdf to jpg") || k.includes("image")) return "pdf-to-jpg";
  return "pdf-merge";
}

function computeScores(keyword, intent) {
  const intentStrengthMap = {
    transactional: 9,
    "problem-solving": 8,
    comparison: 7,
    "trust/security": 7,
    informational: 6,
  };
  const monetizationMap = {
    transactional: 9,
    "problem-solving": 8,
    comparison: 7,
    "trust/security": 7,
    informational: 5,
  };
  const competitionLikelihoodMap = {
    transactional: 8,
    "problem-solving": 6,
    comparison: 7,
    "trust/security": 5,
    informational: 5,
  };
  const intentStrength = intentStrengthMap[intent] || 6;
  const competitionInverted = 11 - (competitionLikelihoodMap[intent] || 6);
  const monetization = monetizationMap[intent] || 6;

  const kwTokens = tokenize(keyword);
  const toolRelevance = (toolsRegistry.tools || []).map((tool) => {
    const pool = tokenize([tool.primaryKeyword].concat(tool.secondaryKeywords || []).join(" "));
    let overlap = 0;
    kwTokens.forEach((token) => {
      if (pool.has(token)) overlap += 1;
    });
    return overlap / Math.max(1, kwTokens.size);
  });
  const internalRelevance = Math.round((Math.max(...toolRelevance, 0) * 9) + 1);

  const score =
    intentStrength * 2.5 +
    competitionInverted * 2 +
    internalRelevance * 2.5 +
    monetization * 3;

  return {
    intentStrength,
    competitionInverted,
    internalRelevance,
    monetization,
    score: Number(score.toFixed(1)),
  };
}

function recommendedType(intent, keyword) {
  const k = norm(keyword);
  if (intent === "transactional") return k.includes("mobile") ? "long-tail" : "tool";
  if (intent === "informational") return "blog";
  if (intent === "comparison") return "blog";
  if (intent === "problem-solving") return k.includes("under 1mb") || k.includes("too big") ? "long-tail" : "blog";
  if (intent === "trust/security") return "blog";
  return "blog";
}

const roadmap = opportunities
  .filter((entry) => !existingKeywords.has(norm(entry.keyword)))
  .map((entry) => {
    const scores = computeScores(entry.keyword, entry.intent);
    const targetTool = inferTool(entry.keyword);
    const type = recommendedType(entry.intent, entry.keyword);
    const targetUrl =
      type === "tool"
        ? "/tools/" + targetTool + "/"
        : type === "long-tail"
          ? "/tools/" + targetTool + "-" + norm(entry.keyword).replaceAll(" ", "-") + "/"
          : "/blog/" + norm(entry.keyword).replaceAll(" ", "-") + "/";
    const priority = scores.score >= 70 ? "high" : scores.score >= 58 ? "medium" : "low";
    const expectedTrafficPotential = scores.score >= 70 ? "high" : scores.score >= 58 ? "medium" : "low";
    return {
      keyword: entry.keyword,
      intent: entry.intent,
      score: scores.score,
      recommendedType: type,
      reason:
        "Intent strength " +
        scores.intentStrength +
        ", competition inverse " +
        scores.competitionInverted +
        ", relevance " +
        scores.internalRelevance +
        ", monetization " +
        scores.monetization +
        ".",
      targetUrl,
      priority,
      expectedTrafficPotential,
      linkToExisting: "/tools/" + targetTool + "/",
      cluster: entry.bucket,
    };
  })
  .sort((a, b) => b.score - a.score);

await writeFile(outputPath, JSON.stringify(roadmap, null, 2), "utf8");

console.log("SEO roadmap generated:", outputPath);
console.log("Top 10 opportunities:");
roadmap.slice(0, 10).forEach((entry, index) => {
  console.log(
    index + 1 + ".",
    entry.keyword,
    "| score:",
    entry.score,
    "| type:",
    entry.recommendedType,
    "| link:",
    entry.linkToExisting
  );
});
