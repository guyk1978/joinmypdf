import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const toolsJsonPath = path.join(root, "assets", "data", "tools.json");
const blogJsonPath = path.join(root, "assets", "data", "blog.json");
const roadmapPath = path.join(root, "assets", "data", "seo-roadmap.json");
const draftsDir = path.join(root, "drafts");
const logsDir = path.join(root, "logs");
const pendingDraftsPath = path.join(draftsDir, "pending-seo-pages.json");
const reportPath = path.join(logsDir, "auto-execution-report.json");

await mkdir(draftsDir, { recursive: true });
await mkdir(logsDir, { recursive: true });

function norm(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return new Set(norm(text).split(" ").filter(Boolean));
}

function overlapScore(a, b) {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (!ta.size || !tb.size) return 0;
  let shared = 0;
  ta.forEach((token) => {
    if (tb.has(token)) shared += 1;
  });
  return shared / Math.max(ta.size, tb.size);
}

const [toolsRegistry, blogRegistry, roadmap] = await Promise.all([
  readFile(toolsJsonPath, "utf8").then(JSON.parse),
  readFile(blogJsonPath, "utf8").then(JSON.parse),
  readFile(roadmapPath, "utf8").then(JSON.parse),
]);

const existingKeywordPool = [];
const existingSlugPool = new Set();
for (const tool of toolsRegistry.tools || []) {
  existingSlugPool.add(tool.slug);
  existingKeywordPool.push(tool.primaryKeyword, ...(tool.secondaryKeywords || []));
  for (const lt of tool.longTailPages || []) {
    existingSlugPool.add(lt.slug);
    existingKeywordPool.push(lt.keyword);
  }
}
for (const post of blogRegistry.blog || []) {
  existingSlugPool.add(post.slug);
  existingKeywordPool.push(post.keyword);
}

const decisions = (Array.isArray(roadmap) ? roadmap : []).map((item, index) => {
  const keyword = item.keyword || "";
  const targetSlug = norm(item.targetUrl || item.keyword || "")
    .replace(/\//g, " ")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
  const exactDuplicate = existingKeywordPool.some((k) => norm(k) === norm(keyword));
  const semanticOverlap = existingKeywordPool.reduce((max, k) => Math.max(max, overlapScore(keyword, k)), 0);
  const slugDuplicate = existingSlugPool.has(targetSlug);
  const overlapRisk = Number(Math.max(exactDuplicate ? 1 : 0, semanticOverlap, slugDuplicate ? 1 : 0).toFixed(2));

  const intentClarity = item.intent ? 8 : 5;
  const usefulness = item.recommendedType === "tool" || item.recommendedType === "long-tail" ? 8 : 7;
  const monetizationScore = item.priority === "high" ? 9 : item.priority === "medium" ? 7 : 5;
  const internalLinkPotential = item.linkToExisting ? 8 : 5;
  const uniquenessScore = Math.round((1 - overlapRisk) * 10);

  const qualityScore = Number(
    (
      uniquenessScore * 0.25 +
      intentClarity * 0.2 +
      usefulness * 0.2 +
      monetizationScore * 0.2 +
      internalLinkPotential * 0.15
    ).toFixed(2)
  );
  const publishEligible = qualityScore >= 7 && overlapRisk < 0.7;

  const reason = !publishEligible
    ? overlapRisk >= 0.7
      ? "Rejected: high overlap/cannibalization risk."
      : "Rejected: quality score below threshold."
    : "Eligible: strong quality and acceptable overlap risk.";

  return {
    id: "draft-" + String(index + 1).padStart(4, "0"),
    slug: item.targetUrl ? item.targetUrl.replace(/^\/|\/$/g, "").split("/").pop() : norm(keyword).replace(/\s+/g, "-"),
    title: item.keyword
      ? item.keyword
          .split(" ")
          .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
          .join(" ") + " | JoinMyPDF"
      : "JoinMyPDF Draft",
    keyword,
    intent: item.intent || "informational",
    recommendedType: item.recommendedType || "blog",
    targetUrl: item.targetUrl || "/blog/" + norm(keyword).replace(/\s+/g, "-") + "/",
    qualityScore,
    publishEligible,
    overlapRisk,
    monetizationScore,
    internalLinkPotential,
    reason,
    metaTitle:
      (item.keyword || "JoinMyPDF Guide")
        .split(" ")
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
        .join(" ") + " - JoinMyPDF",
    metaDescription:
      "Learn " + (item.keyword || "PDF workflows") + " with practical steps, tool integrations, and safe browser-based workflows.",
    faqSuggestions: [
      "What is the best workflow for " + (item.keyword || "this topic") + "?",
      "Is this method suitable for business and team usage?",
      "How do I keep quality while optimizing speed?",
      "Which JoinMyPDF tool should I use first?",
    ],
    internalLinkSuggestions: [
      item.linkToExisting || "/tools/pdf-merge/",
      "/blog/",
      "/tools/pdf-compress/",
    ],
    ctaSuggestions: [
      "Try this tool -> " + (item.linkToExisting || "/tools/pdf-merge/"),
      "Open related guide -> /blog/",
    ],
    schemaRecommendations: ["BlogPosting", "FAQPage"],
    estimatedContentStructure: {
      wordRange: "600-1200",
      headings: ["H1 problem framing", "H2 solution steps", "H2 examples", "H3 FAQ"],
    },
    status: publishEligible ? "pending_approval" : "rejected",
    createdAt: new Date().toISOString(),
  };
});

const approvedQueue = decisions.filter((entry) => entry.publishEligible);
const rejectedQueue = decisions.filter((entry) => !entry.publishEligible);

await writeFile(
  pendingDraftsPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      policy: {
        publishThreshold: 7,
        maxPerDay: 3,
        manualApprovalRequired: true,
      },
      drafts: approvedQueue,
      rejected: rejectedQueue.map((item) => ({
        id: item.id,
        keyword: item.keyword,
        reason: item.reason,
        qualityScore: item.qualityScore,
        overlapRisk: item.overlapRisk,
      })),
    },
    null,
    2
  ),
  "utf8"
);

await writeFile(
  reportPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      approvedDrafts: approvedQueue.length,
      rejectedDrafts: rejectedQueue.length,
      queuedPages: approvedQueue.map((item) => ({
        id: item.id,
        keyword: item.keyword,
        targetUrl: item.targetUrl,
        qualityScore: item.qualityScore,
      })),
      rejectedDetails: rejectedQueue.map((item) => ({
        id: item.id,
        keyword: item.keyword,
        reason: item.reason,
        qualityScore: item.qualityScore,
        overlapRisk: item.overlapRisk,
      })),
      publishedPages: [],
    },
    null,
    2
  ),
  "utf8"
);

console.log("SEO quality gate completed.");
console.log("Pending approval drafts:", approvedQueue.length);
console.log("Rejected drafts:", rejectedQueue.length);
