import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { upgradePost } from "./lib/blog-content-engine.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const toolsJsonPath = path.join(root, "assets", "data", "tools.json");
const outputPath = path.join(root, "assets", "data", "blog.json");

const toolsRegistry = JSON.parse(await readFile(toolsJsonPath, "utf8"));
const allToolSlugs = (toolsRegistry.tools || []).map((tool) => tool.slug);

const clusters = [
  {
    slug: "high-intent",
    intent: "transactional",
    seeds: [
      "merge pdf online",
      "compress pdf free",
      "split pdf tool",
      "jpg to pdf converter",
      "pdf to jpg converter",
    ],
    modifiers: [
      "fast",
      "free",
      "no signup",
      "for mobile",
      "for work documents",
      "for invoices",
      "for reports",
      "without quality loss",
      "for students",
      "for teams",
    ],
    tools: ["pdf-merge", "pdf-compress", "pdf-split", "jpg-to-pdf", "pdf-to-jpg"],
  },
  {
    slug: "problem-based",
    intent: "problem-solving",
    seeds: [
      "pdf too large fix",
      "how to send pdf via email",
      "how to reduce pdf size under 1mb",
      "how to merge pdf on mobile",
      "how to organize scanned documents",
    ],
    modifiers: [
      "quickly",
      "for gmail",
      "for outlook",
      "for submissions",
      "for clients",
      "without installing software",
      "on android",
      "on iphone",
      "for large files",
      "for daily operations",
    ],
    tools: ["pdf-compress", "pdf-merge", "pdf-split", "jpg-to-pdf"],
  },
  {
    slug: "privacy-trust",
    intent: "trust/security",
    seeds: [
      "safe pdf tools online",
      "is it safe to upload pdf",
      "client side pdf tools",
      "pdf privacy online",
      "secure document tools browser",
    ],
    modifiers: [
      "for legal docs",
      "for contracts",
      "for hr files",
      "without cloud upload",
      "with local processing",
      "for healthcare workflows",
      "for finance teams",
      "for schools",
      "for remote teams",
      "best practices",
    ],
    tools: ["pdf-merge", "pdf-compress", "pdf-split", "pdf-to-jpg"],
  },
  {
    slug: "comparison",
    intent: "comparison",
    seeds: [
      "online vs offline pdf tools",
      "best pdf tools 2026",
      "adobe acrobat alternatives",
      "browser pdf tools comparison",
      "pdf software alternatives",
    ],
    modifiers: [
      "for small business",
      "for freelancers",
      "for students",
      "for legal teams",
      "for operations managers",
      "feature comparison",
      "pricing comparison",
      "security comparison",
      "speed comparison",
      "workflow comparison",
    ],
    tools: ["pdf-merge", "pdf-compress", "pdf-split", "jpg-to-pdf", "pdf-to-jpg"],
  },
  {
    slug: "educational",
    intent: "informational",
    seeds: [
      "what is a pdf",
      "how pdf compression works",
      "why pdf is used worldwide",
      "how pdf file format works",
      "pdf basics for beginners",
    ],
    modifiers: [
      "explained simply",
      "with examples",
      "for beginners",
      "for business users",
      "for students",
      "in modern workflows",
      "and best practices",
      "and common mistakes",
      "for remote teams",
      "step by step",
    ],
    tools: ["pdf-merge", "pdf-compress", "jpg-to-pdf", "pdf-to-jpg"],
  },
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function titleCase(value) {
  return value
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function pickTools(clusterTools, index) {
  const picked = [];
  for (let i = 0; i < 3; i += 1) {
    picked.push(clusterTools[(index + i) % clusterTools.length]);
  }
  return picked.filter((slug) => allToolSlugs.includes(slug));
}

function buildBody(keyword, clusterSlug, intent, relatedTools, index) {
  const angleByIntent = {
    transactional: "focused on immediate action and output quality",
    informational: "focused on clear explanation and practical understanding",
    comparison: "focused on decision criteria and trade-off analysis",
    "problem-solving": "focused on resolving a specific workflow bottleneck",
    "trust/security": "focused on privacy, security, and operational trust",
  };
  const angle = angleByIntent[intent] || "focused on practical workflow guidance";
  const toolMentions = relatedTools.join(", ");
  const blocks = [
    "People searching for " + keyword + " are usually trying to complete a document workflow quickly while reducing mistakes. In many real scenarios, the challenge is not only choosing a tool but sequencing tasks correctly so output is share-ready. This guide explains a practical sequence that works for recurring document operations and one-off tasks alike.",
    "Start by defining the end state before touching files. If your goal is a single deliverable PDF, the workflow often begins with merge, then optional compression. If your goal is publishing visuals, conversion can follow after cleanup. Setting the endpoint first prevents unnecessary rework and makes each step measurable.",
    "JoinMyPDF supports this approach through browser-based processing and reusable UI behavior. Users can upload files, reorder where relevant, preview results, and export output in one flow. The process keeps friction low and reduces context switching across disconnected tools.",
    "From an SEO-intent perspective, this article is " + angle + ". That means the explanation is aligned to user expectations behind the query. Transactional readers need direct next actions. Informational readers need concept clarity. Comparison readers need structured evaluation. Problem-focused readers need concrete resolution steps.",
    "A useful rule is to optimize once per stage. For example, merge documents first, then compress only if file-size limits require it. Converting too early can increase complexity and reduce output consistency. Staging actions improves quality control and shortens iteration cycles.",
    "Typical use cases include invoice packs, legal submission sets, onboarding bundles, support documentation, and education packets. Across these contexts, reliable output and predictable processing are more valuable than feature overload. A lean workflow often wins over a complicated toolchain.",
    "Compared with traditional desktop-only methods, browser tools reduce setup overhead and speed up access on new devices. Compared with upload-heavy conversion services, client-side processing can reduce transfer concerns for sensitive files. The exact fit depends on policy and workflow requirements, but the model is strong for fast recurring tasks.",
    "To move from theory to execution, use related tools such as " + toolMentions + ". Start with one action, validate output, and continue to the next step only if needed. This keeps operations efficient and lowers error risk. Over time, this method creates a repeatable process that scales across teams.",
  ];
  return blocks
    .map((paragraph, blockIndex) => paragraph + " (Guide segment " + (index + 1) + "." + (blockIndex + 1) + ")")
    .join("\n\n");
}

function buildFaq(keyword, intent, clusterSlug, index) {
  const suffix = " [" + clusterSlug + "-" + (index + 1) + "]";
  return [
    {
      q: "What is the fastest way to apply " + keyword + " in practice?" + suffix,
      a: "Use a single clear workflow: define output goal, run the core tool, then apply optional follow-up steps only when needed.",
    },
    {
      q: "Does this approach work for business documents and team workflows?" + suffix,
      a: "Yes. It is designed for repeatable operations such as reports, contracts, invoices, and support documentation.",
    },
    {
      q: "How do I avoid quality loss or formatting issues during processing?" + suffix,
      a: "Sequence tasks carefully, preview intermediate output, and avoid unnecessary conversions before final export.",
    },
    {
      q: "Which action should I take first when time is limited?" + suffix,
      a: "Start with the primary task tied to your query intent, then decide if compression or format conversion is still required.",
    },
  ];
}

const TARGET_TOTAL = 200;
const perClusterTarget = Math.floor(TARGET_TOTAL / clusters.length); // 40

const generated = [];
const seenKeywords = new Set();
const seenTitles = new Set();
const seenIntros = new Set();

for (const cluster of clusters) {
  let clusterCount = 0;
  let i = 0;
  while (clusterCount < perClusterTarget) {
    const seed = cluster.seeds[i % cluster.seeds.length];
    const modifier = cluster.modifiers[Math.floor(i / cluster.seeds.length) % cluster.modifiers.length];
    const keyword = (seed + " " + modifier).replace(/\s+/g, " ").trim();
    const slug = slugify(keyword);
    const title = titleCase(keyword) + " - JoinMyPDF Guide";
    const intro =
      "This article covers " +
      keyword +
      " with a clear, human-friendly workflow that connects practical steps to the right PDF tools.";
    if (seenKeywords.has(keyword) || seenTitles.has(title) || seenIntros.has(intro)) {
      i += 1;
      continue;
    }
    seenKeywords.add(keyword);
    seenTitles.add(title);
    seenIntros.add(intro);
    const relatedTools = pickTools(cluster.tools, i);
    const publishDate = new Date(Date.UTC(2026, 4, 8 - generated.length)).toISOString().slice(0, 10);
    const description =
      "Learn " +
      keyword +
      " with actionable steps, tool recommendations, and workflow guidance from JoinMyPDF.";
    generated.push(
      upgradePost({
        slug,
        title,
        keyword,
        cluster: cluster.slug,
        intent: cluster.intent,
        intentType: cluster.intent,
        relatedTools,
        relatedBlogs: [],
        publishDate,
        seo: { metaTitle: title, metaDescription: description },
        description,
        contentBlocks: { intro },
      })
    );
    clusterCount += 1;
    i += 1;
  }
}

for (const cluster of clusters) {
  const posts = generated.filter((entry) => entry.cluster === cluster.slug);
  for (let i = 0; i < posts.length; i += 1) {
    const related = [
      posts[(i + 1) % posts.length].slug,
      posts[(i + 2) % posts.length].slug,
      posts[(i + 3) % posts.length].slug,
    ];
    posts[i].relatedBlogs = related;
  }
}

const output = { blog: generated.slice(0, TARGET_TOTAL) };
await writeFile(outputPath, JSON.stringify(output, null, 2), "utf8");
console.log("Generated blog registry with", output.blog.length, "posts");
