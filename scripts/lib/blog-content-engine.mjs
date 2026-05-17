/**
 * Generates differentiated, index-worthy blog content per article.
 * Each post gets unique section structure, copy pools keyed by slug hash, and intent-specific blocks.
 */

const TOOL_META = {
  "pdf-merge": {
    name: "Merge PDF Online",
    path: "/tools/pdf-merge/",
    verb: "merge PDFs",
    task: "combining multiple PDFs into one ordered file",
  },
  "pdf-compress": {
    name: "Compress PDF Online",
    path: "/tools/pdf-compress/",
    verb: "compress a PDF",
    task: "reducing file size while keeping text readable",
  },
  "pdf-split": {
    name: "Split PDF Online",
    path: "/tools/pdf-split/",
    verb: "split a PDF",
    task: "extracting pages into separate files",
  },
  "jpg-to-pdf": {
    name: "JPG to PDF Converter",
    path: "/tools/jpg-to-pdf/",
    verb: "convert images to PDF",
    task: "turning photos or scans into a single PDF",
  },
  "pdf-to-jpg": {
    name: "PDF to JPG Converter",
    path: "/tools/pdf-to-jpg/",
    verb: "export PDF pages as JPG",
    task: "pulling pages out as images for slides or web",
  },
};

function hashSlug(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

function pick(pool, slug, offset = 0) {
  return pool[(hashSlug(slug) + offset) % pool.length];
}

function detectTask(keyword, slug, relatedTools) {
  const k = (keyword + " " + slug).toLowerCase();
  if (/merge|combine|join/.test(k)) return "pdf-merge";
  if (/compress|reduce|shrink|small size|under 1mb|too large/.test(k)) return "pdf-compress";
  if (/split|extract page|separate page/.test(k)) return "pdf-split";
  if (/jpg|jpeg|image|photo|scan/.test(k) && /to pdf|into pdf/.test(k)) return "jpg-to-pdf";
  if (/pdf to jpg|pdf to image|export.*jpg/.test(k)) return "pdf-to-jpg";
  return relatedTools?.[0] || "pdf-merge";
}

function detectAudience(keyword, slug) {
  const k = (keyword + " " + slug).toLowerCase();
  if (/student/.test(k)) return "students submitting coursework or scanned notes";
  if (/legal|contract/.test(k)) return "legal and compliance teams handling contracts and exhibits";
  if (/finance|invoice/.test(k)) return "finance teams packaging invoices and statements";
  if (/healthcare|hipaa/.test(k)) return "healthcare admins with strict data-handling policies";
  if (/freelanc/.test(k)) return "freelancers sending client deliverables on tight deadlines";
  if (/small business|operations/.test(k)) return "small business operators without dedicated IT";
  if (/mobile|iphone|android|phone/.test(k)) return "people working from phones or tablets";
  if (/gmail|outlook|email/.test(k)) return "anyone hitting email attachment size limits";
  if (/submission|portal/.test(k)) return "applicants uploading to government or vendor portals";
  return "office workers who need a reliable one-off or weekly PDF task";
}

function detectPlatform(keyword, slug) {
  const k = (keyword + " " + slug).toLowerCase();
  if (/gmail/.test(k)) return "Gmail";
  if (/outlook/.test(k)) return "Outlook";
  if (/iphone|ios/.test(k)) return "iPhone";
  if (/android/.test(k)) return "Android";
  return null;
}

function titleFromKeyword(keyword, intentType) {
  const k = keyword.trim();
  if (intentType === "comparison") {
    if (k.length <= 42) return `${sentenceCase(k)} (2026 comparison)`;
    return `${sentenceCase(k)} — honest comparison`;
  }
  if (intentType === "trust/security") {
    return `Is ${k} safe? What to check before you start`;
  }
  if (/^how to/i.test(k)) return sentenceCase(k) + " — step-by-step";
  if (k.length <= 48) return sentenceCase(k) + " — practical guide";
  return sentenceCase(k.slice(0, 44)) + "… — guide";
}

function sentenceCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bPdf\b/g, "PDF").replace(/\bJpg\b/g, "JPG");
}

function buildMetaDescription(keyword, intentType, toolSlug) {
  const tool = TOOL_META[toolSlug];
  const base = tool
    ? `How to ${keyword}: workflows, pitfalls, and when to use ${tool.name}. Browser-based, no watermark on standard output.`
    : `Practical guide to ${keyword}: steps, tradeoffs, privacy notes, and tool picks for real document work.`;
  let desc = base.replace(/\s+/g, " ").trim();
  if (desc.length > 160) desc = desc.slice(0, 157) + "…";
  if (desc.length < 120) desc += " Written for teams who need clear, repeatable PDF workflows.";
  if (desc.length > 160) desc = desc.slice(0, 157) + "…";
  return desc;
}

function buildComparisonTable(audience) {
  return {
    headers: ["", "JoinMyPDF", "Typical upload-based tool", "Desktop suite (e.g. Acrobat)"],
    rows: [
      ["Where files are processed", "In your browser session", "Often on vendor servers", "On your computer"],
      ["Account required to start", "No for standard tools", "Sometimes", "Usually (license)"],
      ["Watermark on free output", "No on standard JoinMyPDF flows", "Often on free tiers", "Varies by plan"],
      ["Best for " + audience.split(" ")[0] + "…", "Quick merge/compress/split", "Huge feature matrix", "Deep editing & print prep"],
      ["Privacy tradeoff", "Files stay local; you control sharing", "Upload = third-party exposure", "Local, but install + updates"],
      ["Typical weak spot", "Very large files / protected PDFs", "Queue times, data policy", "Cost and learning curve"],
    ],
  };
}

function buildSections(post) {
  const { keyword, slug, cluster, intentType, relatedTools = [] } = post;
  const taskSlug = detectTask(keyword, slug, relatedTools);
  const tool = TOOL_META[taskSlug];
  const audience = detectAudience(keyword, slug);
  const platform = detectPlatform(keyword, slug);
  const h = hashSlug(slug);
  const sections = [];

  const introOpeners = [
    `If you searched for “${keyword}”, you probably have a deadline and a specific output in mind—not a textbook definition of PDF software.`,
    `Most people looking up ${keyword} already have files open in another tab. This guide skips hype and focuses on what actually changes your result.`,
    `“${keyword}” sounds simple until an attachment bounces back or a portal rejects your upload. Below is a workflow that works in real offices, not just in demos.`,
  ];
  sections.push({
    id: "overview",
    heading: pick(
      [`What “${keyword}” really means in practice`, `Before you start: clarify your goal`, `Quick context for ${keyword}`],
      slug
    ),
    level: 2,
    paragraphs: [
      pick(introOpeners, slug),
      tool
        ? `For this topic, the core job is to ${tool.verb}—specifically, ${tool.task}. JoinMyPDF handles that in the browser: files stay on your device during processing, and standard downloads are not watermarked. That matters when you are emailing ${audience}.`
        : `JoinMyPDF focuses on merge, compress, split, and image conversion with local browser processing—useful when upload-based converters are not allowed by policy.`,
      pick(
        [
          "Unlike all-in-one suites that push you through account creation before a simple merge, JoinMyPDF is built around one job at a time. That keeps cognitive load low when you only need a finished file in the next ten minutes.",
          "If your IT team allows browser tools, local processing avoids the compliance conversation that comes with uploading contracts or payroll PDFs to a third-party URL you do not control.",
          "You still own the output file: rename it, store it on approved drives, and attach it to email or portals without wondering whether a vendor copy exists on their servers.",
        ],
        slug,
        1
      ),
    ],
  });

  if (tool) {
    sections.push({
      id: "tool-tips",
      heading: pick(
        [`Tips for ${tool.name}`, `Getting better results`, `Fine-tuning your output`],
        slug,
        5
      ),
      level: 2,
      paragraphs: buildToolTips(tool, taskSlug, keyword, audience, slug),
    });
  }

  sections.push({
    id: "quality-check",
    heading: "Quality check before you send",
    level: 2,
    paragraphs: [
      "Open the output PDF and scroll start to finish—not just page one. Look for missing pages, upside-down scans, and blank inserts from empty source files.",
      platform
        ? `On ${platform}, preview attachments before send; some clients show a different size than desktop Outlook or web Gmail.`
        : "If a portal rejects the file, note whether the error cites megabytes, page count, or encryption—each needs a different fix.",
      tool
        ? `When ${tool.verb} still leaves the file too large, run ${TOOL_META["pdf-compress"]?.name || "Compress PDF"} as a second pass rather than re-exporting from scratch.`
        : "Chain tools only when a measured limit still fails after your first pass.",
    ],
  });

  sections.push({
    id: "limits",
    heading: "File size, memory, and browser limits",
    level: 2,
    paragraphs: [
      "Browser PDF tools depend on device RAM. A 400-page scan on an older phone may fail where the same job succeeds on a laptop with 16 GB RAM.",
      "Split oversized jobs into two runs, or merge in batches (chapters A–M, then N–Z) and merge the two outputs if policy allows.",
      "Password-protected, digitally signed, or rights-managed PDFs may block editing until unlocked in the app that created them—plan extra time for those files.",
    ],
  });

  if (intentType === "comparison" || cluster === "comparison") {
    sections.push({
      id: "comparison",
      heading: "Side-by-side: how options differ",
      level: 2,
      paragraphs: [
        "Comparisons go wrong when they treat every tool as interchangeable. A free online merger solves a different problem than a full desktop editor or an enterprise e-sign platform.",
        "Use the table below to match your constraint—privacy, speed, feature depth, or price—to the category that actually fits. Then try one narrow task (e.g. merge three invoices) before committing to a toolchain.",
      ],
      table: buildComparisonTable(audience),
    });
    sections.push({
      id: "when-joinmypdf",
      heading: "When JoinMyPDF is the right fit",
      level: 2,
      paragraphs: [
        "Choose JoinMyPDF when you need a fast, repeatable task without installing software or creating an account, and when policy allows browser-based processing.",
        "It is a poor fit when you need OCR on scanned books, redaction for court production, or batch automation across hundreds of folders—those jobs need specialized desktop or server products.",
      ],
      list: [
        "You merge, compress, or split occasionally and want consistent UX.",
        "You cannot upload confidential PDFs to unknown servers.",
        "You want clean standard output without branding watermarks.",
      ],
    });
  }

  if (intentType === "trust/security" || cluster === "privacy-trust") {
    sections.push({
      id: "privacy-model",
      heading: "What “safe” should mean for PDF tools",
      level: 2,
      paragraphs: [
        "Safety is not a single checkbox. At minimum, ask: where are bytes processed, how long are they stored, who can access logs, and what happens if you close the tab.",
        "Upload-based converters copy your file to their infrastructure. That can be acceptable for public marketing PDFs and unacceptable for HR, legal, or patient-related documents.",
        "JoinMyPDF’s merge, compress, split, and conversion tools run in your browser session. That reduces—but does not eliminate—risk: malware on the device, shared computers, and shoulder-surfing still matter.",
      ],
    });
    sections.push({
      id: "checklist",
      heading: "Security checklist before you process a sensitive PDF",
      level: 2,
      list: [
        "Confirm company policy allows browser PDF tools for this document class.",
        "Use a supported, updated browser on a trusted device.",
        "Close other extensions if your IT team flags risky add-ons.",
        "Download output to an approved folder; avoid auto-sync to personal cloud if policy forbids it.",
        "Delete local copies when retention rules require it.",
      ],
    });
  }

  if (intentType === "problem-solving" || cluster === "problem-based") {
    const problemHeadings = [
      platform ? `Fixing ${keyword} on ${platform}` : `Solving ${keyword} without extra software`,
      "Diagnose the real blocker first",
      "A practical fix path",
    ];
    sections.push({
      id: "diagnosis",
      heading: pick(problemHeadings, slug, 1),
      level: 2,
      paragraphs: [
        platform
          ? `On ${platform}, attachment limits and preview behavior cause half of “PDF too large” tickets. Check the exact error: size cap, page count, or security settings.`
          : "Size errors usually mean the PDF is over an email or portal limit, or contains heavy embedded images—not that the document is “corrupt.”",
        tool
          ? `A common fix: ${tool.verb} with JoinMyPDF, then re-check file size. If still too large, lower image-heavy pages or split into two submissions if the portal allows.`
          : "Compress after merge, not before splitting pages you still need to reorder.",
      ],
    });
  }

  sections.push({
    id: "workflow",
    heading: pick(
      ["Step-by-step workflow", "How to do it without rework", "Recommended sequence"],
      slug,
      2
    ),
    level: 2,
    paragraphs: [
      "Sequence matters. Converting formats twice, or compressing before merge, creates hard-to-debug quality issues.",
      tool
        ? `1) Open ${tool.name}. 2) Add files in the order you need. 3) Run the action and open the output once before sending. 4) Only then compress or split if the next system still rejects the file.`
        : "Pick one primary tool, validate output, then chain follow-up tools only if a real constraint remains.",
    ],
    list: relatedTools
      .filter((s) => s !== taskSlug)
      .slice(0, 3)
      .map((s) => {
        const t = TOOL_META[s];
        return t ? `If needed next: ${t.name} (${t.path.replace(/\//g, "")})` : null;
      })
      .filter(Boolean),
  });

  sections.push({
    id: "mistakes",
    heading: "Mistakes that waste time",
    level: 2,
    paragraphs: [
      pick(
        [
          "Re-compressing an already-optimized PDF rarely helps; you may blur text without saving much space.",
          "Merging before you confirm page order forces a full redo—ten seconds of drag-and-drop beats ten minutes of reconstruction.",
          "Assuming “online” always means “uploaded” leads to policy violations. Read the tool’s processing model first.",
        ],
        slug,
        3
      ),
      `For ${audience}, the expensive mistake is shipping the wrong version. Name files with version numbers and spot-check page 1 and the last page before send.`,
    ],
  });

  sections.push({
    id: "who-its-for",
    heading: "Who this approach fits—and who should skip it",
    level: 2,
    paragraphs: [
      `Best for: ${audience}.`,
      "Skip browser tools when IT mandates a specific desktop suite, when you need certified redaction, or when files exceed what your device memory can handle in one tab (often very large scans).",
    ],
    limitations: [
      "Password-protected PDFs may block merge/split until unlocked in an authorized app.",
      "Extremely large files can fail on low-RAM mobile devices—split into batches.",
      "JoinMyPDF does not replace legal e-sign platforms or print-shop preflight tools.",
    ],
  });

  if (intentType === "informational" || cluster === "educational") {
    sections.push({
      id: "concepts",
      heading: "Concepts worth understanding",
      level: 2,
      paragraphs: [
        "PDFs bundle vector text, embedded fonts, and raster images. Compression attacks images and structure differently—aggressive settings hit photos harder than plain text.",
        "That is why a scan-heavy PDF shrinks dramatically with compression while a text-only contract might barely change size.",
      ],
    });
  }

  sections.push({
    id: "bottom-line",
    heading: pick(["Bottom line", "What to do next", "Practical takeaway"], slug, 4),
    level: 2,
    paragraphs: [
      tool
        ? `For ${keyword}, start with ${tool.name}, verify the output once, and only add extra steps if a real limit (email, portal, print) still blocks you.`
        : `Treat ${keyword} as a workflow problem: pick tools in the right order, validate once, then send.`,
      "Bookmark the guides linked below if your team repeats this task monthly—documented steps beat rediscovering the same fixes.",
    ],
  });

  return sections;
}

function buildToolTips(tool, taskSlug, keyword, audience, slug) {
  const byOp = {
    "pdf-merge": [
      `Drag files into ${tool.name} in the exact order recipients should read them—annual report before appendix, not the reverse.`,
      "If one source is landscape and another portrait, expect mixed page sizes in the output; recipients usually prefer that to forced rotation that breaks charts.",
      `For ${audience}, merge first, then compress only if attachment limits still fail—never compress individual chapters before you know the final page order.`,
    ],
    "pdf-compress": [
      "Start with a moderate compression level; you can always run a second pass on the result, but you cannot recover sharpness lost to an aggressive first pass.",
      "Text-heavy PDFs may barely shrink—if size does not move, the bloat is likely embedded fonts or high-res images that need a different approach.",
      "Compare file size and visual quality on one representative page before batching ten similar invoices.",
    ],
    "pdf-split": [
      "Split when you only need to email one chapter or when a portal caps pages per upload—exporting everything is slower to review and easier to mis-send.",
      "Name outputs immediately (contract-signed-page-7.pdf) so downloads folder chaos does not undo the time you saved.",
      "If you will re-merge subsets later, keep a simple index document listing which split file maps to which section.",
    ],
    "jpg-to-pdf": [
      "Shoot or scan with consistent orientation; rotating inside the tool works but costs time on long photo sets.",
      "Higher photo resolution increases output size—crop borders before converting if you are close to an email limit.",
      "For multi-page photo PDFs, verify order on page thumbnails before download.",
    ],
    "pdf-to-jpg": [
      "Export JPG when you need slides, social images, or CMS uploads—not when you need editable text; text will be flattened into pixels.",
      "Expect one image per page; for a 40-page deck, confirm you have storage and rights to handle 40 files.",
      "Use JPG export after finalizing content—re-editing text in the source PDF is simpler than editing images.",
    ],
  };
  const tips = byOp[taskSlug] || byOp["pdf-merge"];
  return tips;
}

function buildFaq(post, taskSlug) {
  const { keyword, slug, intentType } = post;
  const tool = TOOL_META[taskSlug];
  const platform = detectPlatform(keyword, slug);
  const faqs = [];

  faqs.push({
    q: tool ? `Can I ${tool.verb} without uploading files to a server?` : `Does JoinMyPDF upload my PDF to process it?`,
    a: "JoinMyPDF runs merge, compress, split, and standard conversions in your browser session. Files are not sent to JoinMyPDF servers to execute those operations—check your org policy if browser tools are allowed at all.",
  });

  faqs.push({
    q: `Is ${keyword} free for typical use?`,
    a: "Yes for standard in-browser tasks on JoinMyPDF. You do not need a paid account for everyday merge, compress, split, or conversion workflows described here.",
  });

  if (platform) {
    faqs.push({
      q: `Does this workflow work on ${platform}?`,
      a: `Modern browsers on ${platform} support the same JoinMyPDF tools. Very large files may still fail if the device runs low on memory—try fewer pages per run.`,
    });
  }

  faqs.push({
    q: "Will compression ruin document quality?",
    a: "Aggressive compression reduces image detail. For contracts and forms, use a moderate setting and open the PDF once before sending. Text-only pages usually stay sharp.",
  });

  faqs.push({
    q: "What if my PDF is password-protected?",
    a: "Protected files often cannot be merged or split until unlocked with the correct password in an approved application. Remove protection only when you have permission.",
  });

  if (intentType === "comparison") {
    faqs.push({
      q: "How is JoinMyPDF different from iLovePDF or Smallpdf?",
      a: "Large suites offer more features (OCR, e-sign, desktop apps) but commonly rely on uploads. JoinMyPDF optimizes for local processing, speed on everyday tasks, and clean standard output without watermarks.",
    });
    faqs.push({
      q: "When should I pay for Adobe Acrobat instead?",
      a: "When you need advanced editing, prepress, batch automation, or enterprise compliance features beyond merge/compress/split. Many teams use JoinMyPDF for quick jobs and Acrobat for specialized work.",
    });
  } else {
    faqs.push({
      q: `What is the fastest way to handle ${keyword}?`,
      a: tool
        ? `Open ${tool.name}, complete one pass, verify page order and file size, then send. Add compress or split only if a second system still rejects the file.`
        : "Define the end file you need, run one tool, validate output, then chain a second tool only if required.",
    });
    faqs.push({
      q: "Are downloads watermarked?",
      a: "JoinMyPDF does not add marketing watermarks to standard outputs from these tools. Third-party portals may still apply their own rules.",
    });
  }

  return faqs.slice(0, 8);
}

function buildInternalLinks(post, taskSlug) {
  const links = [];
  const tool = TOOL_META[taskSlug];
  if (tool) links.push({ href: tool.path, anchor: tool.name });

  for (const s of post.relatedTools || []) {
    const t = TOOL_META[s];
    if (t && !links.some((l) => l.href === t.path)) links.push({ href: t.path, anchor: t.name });
  }

  const staticLinks = [
    { href: "/privacy/", anchor: "Privacy & security" },
    { href: "/compare/", anchor: "How JoinMyPDF compares" },
    { href: "/privacy-first-pdf-tools/", anchor: "Privacy-first PDF hub" },
    { href: "/tools/", anchor: "All PDF tools" },
  ];

  for (const s of post.relatedBlogs || []) {
    if (s !== post.slug) links.push({ href: `/blog/${s}/`, anchor: s.replace(/-/g, " ") });
  }

  for (const l of staticLinks) {
    if (links.length >= 10) break;
    if (!links.some((x) => x.href === l.href)) links.push(l);
  }

  return links.slice(0, 10);
}

export function upgradePost(post) {
  const taskSlug = detectTask(post.keyword, post.slug, post.relatedTools);
  const intentType = post.intentType || post.intent || "transactional";
  const sections = buildSections(post);
  const faq = buildFaq(post, taskSlug);
  const internalLinks = buildInternalLinks(post, taskSlug);
  const metaTitle = titleFromKeyword(post.keyword, intentType);
  const metaDesc = buildMetaDescription(post.keyword, intentType, taskSlug);

  const wordCount =
    sections.reduce(
      (n, s) =>
        n +
        (s.paragraphs || []).join(" ").split(/\s+/).length +
        (s.list || []).join(" ").split(/\s+/).length +
        (s.limitations || []).join(" ").split(/\s+/).length,
      0
    ) + faq.join(" ").split(/\s+/).length;

  const intro = sections[0]?.paragraphs?.[0] || post.contentBlocks?.intro;

  return {
    ...post,
    title: metaTitle,
    description: metaDesc,
    seo: { metaTitle, metaDescription: metaDesc },
    contentBlocks: {
      intro,
      sections,
      faq,
      internalLinks,
      bestFor: detectAudience(post.keyword, post.slug),
      primaryTool: taskSlug,
      wordCount,
    },
  };
}

export function upgradeRegistry(registry) {
  return {
    blog: (registry.blog || []).map((post) => upgradePost(post)),
  };
}
