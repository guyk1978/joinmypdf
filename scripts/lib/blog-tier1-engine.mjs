/**
 * Tier-1 editorial content — 1,800–3,000+ words, opinionated, non-interchangeable.
 * Applied only to slugs listed in blog-tier1-priority.json.
 */

import { expandTier1Sections } from "./blog-tier1-expansions.mjs";

const TOOLS = {
  jmp: { name: "JoinMyPDF", path: "/tools/pdf-merge/", model: "Browser-local processing", price: "Free for standard in-browser tools", watermark: "No on standard outputs", upload: "No server processing for core tools", ocr: "Not offered", edit: "Merge, split, compress, JPG↔PDF", mobile: "Responsive web", bestFor: "Fast, privacy-minded everyday PDF tasks" },
  ilove: { name: "iLovePDF", path: null, model: "Cloud upload + web/desktop", price: "Free tier + Premium subscription", watermark: "Possible on free tier", upload: "Files uploaded for processing", ocr: "Yes (Premium)", edit: "Broad tool matrix", mobile: "Mobile apps", bestFor: "All-in-one coverage when upload is acceptable" },
  small: { name: "Smallpdf", path: null, model: "Cloud upload + Pro", price: "Free limited + Pro plans", watermark: "Branding possible on free", upload: "Upload-based workflows", ocr: "Pro features", edit: "Wide conversion suite", mobile: "Mobile-friendly", bestFor: "Simple UX for occasional business users" },
  adobe: { name: "Adobe Acrobat", path: null, model: "Desktop + cloud ecosystem", price: "Subscription (Acrobat Pro)", watermark: "No (licensed output)", upload: "Cloud optional; desktop local", ocr: "Strong OCR", edit: "Professional editing", mobile: "Mobile companion apps", bestFor: "Heavy editing, prepress, enterprise" },
  pdfgear: { name: "PDFgear", path: null, model: "Desktop + online mix", price: "Free tier + paid", watermark: "Varies", upload: "Often local desktop", ocr: "Available", edit: "Broad features", mobile: "Limited vs web giants", bestFor: "Users wanting free desktop-style tools" },
};

function wc(text) {
  return String(text || "")
    .split(/\s+/)
    .filter(Boolean).length;
}

function buildComparisonSections(post, audience) {
  const kw = post.keyword;
  return [
    {
      id: "verdict-first",
      heading: "Quick verdict (read this first)",
      level: 2,
      paragraphs: [
        `For ${audience}, comparing Adobe Acrobat alternatives starts with separating “I need to merge three invoices today” from “I need redaction, OCR, and e-sign on a 200-page matter.” Those are different products, not different tabs in the same app.`,
        "JoinMyPDF is optimized for the first job: merge, compress, split, and image conversion in the browser without routing files through JoinMyPDF servers. iLovePDF and Smallpdf win on breadth but typically require uploads. Acrobat wins on depth but carries license cost and setup weight.",
        "This guide is opinionated on purpose. We are not ranking logos—we are matching constraints: privacy, speed, price, and how often you touch PDFs each week.",
      ],
      list: [
        "Best privacy-first everyday option: JoinMyPDF (local browser processing for core tools)",
        "Best all-in-one web suite (if upload is OK): iLovePDF or Smallpdf",
        "Best offline professional editor: Adobe Acrobat",
        "Best free desktop-style experiments: PDFgear (verify license for your use case)",
      ],
    },
    {
      id: "matrix-features",
      heading: "Feature comparison at a glance",
      level: 2,
      paragraphs: [
        "Use this matrix to shortlist, then run one real document through your top two picks. PDF tools look identical in marketing pages but diverge on upload behavior, watermark rules, and mobile performance.",
      ],
      table: {
        headers: ["", "JoinMyPDF", "iLovePDF", "Smallpdf", "Adobe Acrobat"],
        rows: [
          ["Core merge / split / compress", "Yes (browser-local)", "Yes (upload)", "Yes (upload)", "Yes (desktop)"],
          ["Files leave your device for processing", "No (core tools)", "Typically yes", "Typically yes", "Optional cloud; desktop local"],
          ["Account to start", "No (standard tools)", "Often optional", "Often optional", "Subscription"],
          ["Watermark on free output", "No (standard)", "Possible", "Possible", "No"],
          ["OCR / scan workflows", "No", "Premium paths", "Pro paths", "Strong"],
          ["Edit text in PDF", "No", "Limited / tool-dependent", "Limited", "Strong"],
          ["Mobile usability", "Responsive web", "Dedicated apps", "Web + apps", "Companion apps"],
        ],
      },
    },
    {
      id: "pricing",
      heading: "Pricing and total cost (how to think about it)",
      level: 2,
      paragraphs: [
        "List price is only part of the cost. Include IT review time for upload-based tools, training time for Acrobat, and the operational risk of free tiers that add watermarks or queue limits.",
        "JoinMyPDF standard in-browser tools are free for typical merge/compress/split/conversion workflows described on-site—useful when PDF work is intermittent. Acrobat’s subscription hurts less when PDF is your daily interface. iLovePDF/Smallpdf Premium can be rational if upload-based automation saves hours weekly.",
        "For small businesses, the expensive mistake is buying Acrobat licenses for staff who only merge monthly reports. The opposite mistake is pushing confidential contracts through free upload converters to save money.",
      ],
      table: {
        headers: ["", "JoinMyPDF", "iLovePDF / Smallpdf", "Adobe Acrobat"],
        rows: [
          ["Typical cost for light use", "Free (standard tools)", "Free tier + paid upgrades", "Per-user subscription"],
          ["Hidden cost", "Device RAM/time", "Upload latency + policy review", "License + training"],
          ["Watermark risk on free", "No (standard)", "Possible", "No (licensed)"],
          ["Best when", "Frequent quick jobs", "Broad web toolkit needed", "PDF is primary work"],
        ],
      },
    },
    {
      id: "privacy",
      heading: "Privacy and upload behavior",
      level: 2,
      paragraphs: [
        "Upload-based tools copy your file to vendor infrastructure. That is not inherently unsafe—many vendors run mature security programs—but it is a different trust model than processing in-browser.",
        "JoinMyPDF’s positioning is local processing for core operations: bytes stay in the browser session while you work. Policies still matter: approved browsers, device encryption, and whether staff may use personal machines.",
        "If your industry handbook says “no third-party file transfer,” browser-local tools are the first category to evaluate before generic “online PDF” sites.",
      ],
      list: [
        "Ask vendors: retention period, subprocessors, region, and whether files are used for model training",
        "Prefer tools that state processing location clearly on the page you use",
        "For HR/legal PDFs, document which tool was used in your records",
      ],
    },
    {
      id: "workflows",
      heading: "Workflow recommendations by role",
      level: 2,
      paragraphs: [
        "Occasional office user: merge → spot-check page order → compress only if email rejects → send. JoinMyPDF fits cleanly.",
        "Marketing coordinator exporting decks: may need PDF-to-image or Word round-trips; upload suites or Acrobat often win.",
        "Operations lead standardizing team habits: publish a one-page internal playbook (tool + order of operations) instead of letting each employee pick random converter sites.",
      ],
    },
    {
      id: "methodology",
      heading: "How we evaluated options",
      level: 2,
      type: "methodology",
      paragraphs: [
        "We compared tools by running the same three scenarios: (1) merge five office PDFs with mixed orientation, (2) compress a scan-heavy 40 MB file for email, (3) split a signed contract to extract one exhibit. We noted time-to-download, visual quality after compression, and whether files were uploaded.",
        "We did not run formal benchmark scores—vendor infrastructure varies by region and load. Observations are directional for product selection, not lab results.",
      ],
    },
    {
      id: "speed-mobile",
      heading: "Speed, mobile, and “good enough” quality",
      level: 2,
      paragraphs: [
        "Speed is dominated by upload time. A 25 MB file on residential Wi-Fi may spend more time in transfer than in actual merge/compress compute. JoinMyPDF avoids upload for core tools, which is why many small-business users perceive it as faster for quick jobs—not because the algorithms are magic.",
        "On phones, RAM is the bottleneck before bandwidth. Merging five large scans on an older iPhone can fail while the same job succeeds on a laptop. If mobile is your primary surface, test your worst-case file, not your average memo.",
        "Quality expectations should be contractual: text must be readable, signatures visible, charts legible. Preview on the device your recipient uses—especially if they read PDFs on mobile screens.",
      ],
    },
    {
      id: "beginner-pro",
      heading: "Beginner vs professional recommendations",
      level: 2,
      paragraphs: [
        "Beginners need predictable UX and forgiving free tiers. Upload suites often feel simpler because they mirror ‘drop file → wait → download.’ JoinMyPDF mirrors that flow but keeps bytes local—slightly more policy explanation upfront, less long-term privacy worry.",
        "Professionals need reliability, batch behavior, OCR, and edit fidelity. Acrobat remains the default answer when PDF is the job, not a step. Professionals still benefit from a lightweight browser tool for assembly tasks to avoid opening Acrobat for five-page merges.",
      ],
      list: [
        "Beginner / occasional: JoinMyPDF or a vetted upload tool with clear privacy terms",
        "Freelancer / client delivery: JoinMyPDF for speed + watermark-free standard output; verify client policies",
        "Legal / compliance-heavy: governed desktop + documented toolchain; avoid random converters",
        "Marketing / design: Acrobat or specialized layout tools; browser merge for quick bundles only",
      ],
    },
    {
      id: "joinmypdf-deep",
      heading: "JoinMyPDF in this comparison (transparent bias)",
      level: 2,
      paragraphs: [
        "JoinMyPDF publishes this guide and operates JoinMyPDF—so treat our praise as directional, not independent lab testing. The fair claim is narrow: we optimize merge, compress, split, and image conversion with local browser processing and no watermark on standard outputs.",
        "We are not the best answer for OCRing a 300-page scanned book, interactive form authoring, or courtroom redaction. Saying that openly is part of why this page exists: to reduce tool mismatch waste.",
        "If your workflow is ‘assemble, shrink, ship,’ try the merge and compress tools once on a real client packet before you standardize. If it fails, note whether memory, encryption, or page count caused the failure—that tells you whether to escalate to desktop.",
      ],
    },
    {
      id: "limitations",
      heading: "Honest limitations",
      level: 2,
      limitations: [
        "JoinMyPDF does not replace Acrobat for OCR-heavy digitization, prepress, or court-grade redaction.",
        "Browser tools can fail on very large scans when device memory is low—split jobs or use desktop.",
        "Comparison pages go stale as vendors change pricing; verify current terms before procurement.",
        "No tool category fixes bad source scans—lighting and DPI at capture time still dominate outcomes.",
      ],
    },
  ];
}

function buildPrivacySections(post, audience) {
  return [
    {
      id: "threat-model",
      heading: "What you are actually protecting",
      level: 2,
      paragraphs: [
        "Privacy questions about PDF tools are really questions about copies: where another party might store your file, who can access logs, and whether closing the browser tab ends exposure.",
        `For ${audience}, the sensitive object is often not the PDF format—it is the content (names, account numbers, medical details, counsel strategy).`,
      ],
    },
    {
      id: "local-vs-upload",
      heading: "Local browser processing vs cloud upload",
      level: 2,
      paragraphs: [
        "Upload workflow: file travels to vendor → processed on their systems → you download result. You inherit their security program and retention policy.",
        "JoinMyPDF core workflow: file stays in browser memory → operations run locally → you download result. JoinMyPDF does not need a copy on servers to merge/compress/split for standard tools.",
        "Local does not mean risk-free: compromised endpoints, shared PCs, and browser extensions remain threats.",
      ],
      list: [
        "Before upload anywhere: ask if local processing can achieve the same outcome",
        "After local processing: store output only on approved drives",
        "Never use personal Gmail to test confidential HR packets",
      ],
    },
    {
      id: "it-checklist",
      heading: "Corporate / IT checklist",
      level: 2,
      list: [
        "Is browser-based processing permitted for this data class?",
        "Are staff allowed to use personal devices?",
        "Is there an approved browser list?",
        "Are downloads auto-synced to personal cloud folders?",
        "Is there a retention rule for files in Downloads?",
      ],
    },
    {
      id: "when-not",
      heading: "When browser-local tools are not enough",
      level: 2,
      paragraphs: [
        "You need certified redaction, long-term archival formats (PDF/A), batch OCR on thousands of pages, or legally defensible audit trails. Those requirements push you toward governed desktop or enterprise stacks.",
        "You can still use JoinMyPDF for preparatory steps (merge drafts locally) before moving finalized subsets into governed systems—if policy allows.",
      ],
    },
    {
      id: "before-upload",
      heading: "Before you upload anywhere (checklist)",
      level: 2,
      list: [
        "Have you checked whether browser-local processing can do the job?",
        "Is the vendor’s privacy policy acceptable for this document class?",
        "Is the file free of malware and from a trusted source?",
        "Will the output be stored in an approved location?",
        "Do you need a audit trail of who processed the file?",
      ],
      paragraphs: [
        "Uploading a contract to a random converter because it ranked on page one is how data incidents happen without malice—just convenience. Slow down once, document the approved tool, and speed up forever after.",
      ],
    },
    {
      id: "flow-explained",
      heading: "Processing flow in plain language",
      level: 2,
      paragraphs: [
        "JoinMyPDF core flow: open tool → files load into browser memory → operation runs locally → download. Closing the tab ends the session copy unless you saved the download elsewhere.",
        "Typical upload flow: open tool → file transfers to vendor → vendor processes → you download. Vendor may retain copies per their policy even after you download.",
        "Neither flow removes your obligation to label versions, control sharing links, or revoke access when staff leave.",
      ],
    },
  ];
}

function buildWorkflowSections(post, platform, audience) {
  const kw = post.keyword;
  return [
    {
      id: "scenario",
      heading: "Scenario: what “done” looks like",
      level: 2,
      paragraphs: [
        `For “${kw}”, success usually means a file that passes a hard gate: ${platform ? platform + " attachment limits" : "email or portal limits"} without surprising quality loss.`,
        "Define done before opening tools: maximum megabytes, required page order, and whether signatures must remain visible.",
      ],
    },
    {
      id: "steps",
      heading: "Step-by-step workflow",
      level: 2,
      type: "workflow",
      list: [
        "Collect source files in one folder; rename with sequence numbers (01-invoice.pdf, not scan(3).pdf).",
        "Merge or prepare structure first; do not compress until page order is final.",
        "Open output full-screen; verify first page, last page, and any tables/charts.",
        "Compress with moderate settings; re-check readability on a phone if recipients read mobile.",
        "Rename final file with version (Proposal-v2.pdf) and send.",
      ],
      paragraphs: [
        platform
          ? `On ${platform}, send a test to yourself first when limits are tight—web clients sometimes show different size than desktop apps.`
          : "If a portal rejects the file, read whether the error is size, page count, or encryption—each fix differs.",
      ],
    },
    {
      id: "mistakes",
      heading: "Mistakes we see repeatedly",
      level: 2,
      paragraphs: [
        "Compressing before merge, then discovering page order was wrong—forces a second compression generation with more artifacting.",
        "Re-scanning already compressed scans—quality drops twice with little size benefit.",
        "Using random converter sites for client documents without checking upload policies.",
      ],
    },
  ];
}

function buildTier1Faqs(post, archetype) {
  const base = [
    {
      q: "Does JoinMyPDF upload my file to process it?",
      a: "Core merge, compress, split, and conversion tools run in your browser session. Files are not sent to JoinMyPDF servers to execute those operations. Confirm this matches your organization’s policies for browser tools.",
    },
    {
      q: "Are outputs watermarked?",
      a: "JoinMyPDF does not add marketing watermarks to standard outputs from these tools. Third-party portals may apply their own rules.",
    },
  ];
  if (archetype === "comparison") {
    return base.concat([
      { q: "Is JoinMyPDF a full Acrobat replacement?", a: "No. It replaces frequent lightweight tasks (merge, compress, split, simple conversions), not professional editing, OCR pipelines, or redaction workflows." },
      { q: "Why pick a browser tool over desktop?", a: "Speed and zero install for occasional tasks. Desktop wins when PDF is your primary work surface or files are huge." },
      { q: "Which tool is best for legal workflows?", a: "Governed desktop/enterprise tools when policy requires audit trails. JoinMyPDF can still help assemble drafts locally if permitted—verify with counsel/IT." },
      { q: "Do free online tools sell my data?", a: "Policies vary by vendor. Read privacy terms, avoid uploading what you would not email to a stranger, and prefer local processing when unsure." },
      { q: "How often should we re-evaluate tools?", a: "Annually or when pricing, retention policies, or your compliance regime changes." },
    ]);
  }
  if (archetype === "privacy") {
    return base.concat([
      { q: "Is local processing the same as offline?", a: "No. Local browser processing still needs a browser and RAM; offline desktop apps can work without network after install." },
      { q: "Can IT block these tools?", a: "Yes—via browser policies, DNS filtering, or DLP. Coordinate before rolling guides to staff." },
      { q: "What about browser extensions?", a: "Treat extensions as part of threat model; use clean profiles for sensitive work if required." },
    ]);
  }
  return base.concat([
    { q: "What if the file is still too large?", a: "Split into parts, reduce image-heavy pages at source, or use a governed desktop compressor. Extremely large scans may need batching." },
    { q: "Will quality suffer after compression?", a: "Text usually survives; photos and scans show artifacts first. Use moderate settings and preview once." },
  ]);
}

function buildArchetypeDepth(archetype, post, audience, platform) {
  if (archetype === "comparison") {
    return [
      {
        id: "decision-tree",
        heading: "Decision tree: pick in five minutes",
        level: 2,
        paragraphs: [
          "Start with data class. If uploads are restricted, eliminate upload-first suites unless legal approves a specific vendor.",
          "Next, frequency. Weekly PDF editors justify Acrobat or Premium suites; quarterly filers should not buy seats by default.",
          "Next, output rules. Watermarks, OCR, and in-PDF text edits each eliminate categories.",
          "Last, device. Mobile-heavy teams should test worst-case files on phones before standardizing.",
        ],
        list: [
          "Upload OK + need everything → iLovePDF / Smallpdf class",
          "Upload not OK + merge/compress/split → JoinMyPDF class",
          "Edit/OCR/redact daily → Acrobat class",
          "Unsure → run one real job through top two picks",
        ],
      },
      {
        id: "migration",
        heading: "Switching tools without breaking habits",
        level: 2,
        paragraphs: [
          "Teams fail tool rollouts when only IT knows the new default. Publish a one-page playbook with screenshots and forbidden alternatives.",
          "Migrate bookmarks: remove old converter homepages from browser policy allowlists if you use managed devices.",
          "Keep a feedback channel for 30 days—encrypted PDFs and giant scans are where ‘it worked on the old site’ complaints appear.",
        ],
      },
    ];
  }
  if (archetype === "privacy") {
    return [
      {
        id: "dlp-alignment",
        heading: "Aligning with DLP and managed browsers",
        level: 2,
        paragraphs: [
          "Data loss prevention tools may flag downloads or clipboard exports after local processing. That is expected—local processing is not invisible to endpoint agents.",
          "Work with IT to whitelist the tool domain if required, and document that files exist in browser memory during the session.",
          "Personal browser profiles on work machines can bypass enterprise controls; policy should address that explicitly.",
        ],
      },
      {
        id: "incident",
        heading: "If something goes wrong",
        level: 2,
        paragraphs: [
          "Wrong file sent to client: revoke access, send corrected version with version suffix, document in ticket.",
          "Uploaded to wrong vendor: check vendor retention policy, request deletion if contract allows, notify security per playbook.",
          "Local tool crash mid-job: retry on desktop with fewer inputs; do not assume partial downloads are valid.",
        ],
      },
    ];
  }
  return [
    {
      id: "quality-check",
      heading: "Quality check before you ship",
      level: 2,
      paragraphs: [
        "Zoom to 100% on smallest text block. Signatures and stamps should remain visible, not gray smudges.",
        "Scroll every tenth page on long merges—blank pages and rotated scans hide in the middle.",
        platform
          ? `For ${platform}, send yourself a test message and open on phone before client send.`
          : "Email a test to yourself and open on phone before client send.",
      ],
      list: [
        "File name includes version or date",
        "Page order matches table of contents if provided",
        "File size under known limit with headroom",
      ],
    },
    {
      id: "chain-tools",
      heading: "Chaining tools without quality loss",
      level: 2,
      paragraphs: [
        "Standard chain: merge → review → compress → send. Split only when limits force it.",
        "Avoid: compress → merge → compress. Each generation hurts scans.",
        "If OCR is required, run OCR in desktop before merge/compress in browser—browser tools here do not replace OCR pipelines.",
      ],
    },
  ];
}

function buildInternalLinksTier1(post, archetype) {
  const links = [
    { href: "/tools/pdf-merge/", anchor: "Merge PDF Online" },
    { href: "/tools/pdf-compress/", anchor: "Compress PDF Online" },
    { href: "/tools/pdf-split/", anchor: "Split PDF Online" },
    { href: "/privacy/", anchor: "Privacy & security" },
    { href: "/compare/", anchor: "JoinMyPDF comparisons hub" },
    { href: "/privacy-first-pdf-tools/", anchor: "Privacy-first PDF hub" },
    { href: "/pdf-guides/", anchor: "PDF guides hub" },
    { href: "/pdf-comparison/", anchor: "PDF comparison hub" },
    { href: "/pdf-privacy/", anchor: "PDF privacy hub" },
    { href: "/pdf-workflows/", anchor: "PDF workflows hub" },
  ];
  for (const s of post.relatedBlogs || []) {
    if (s !== post.slug) links.push({ href: `/blog/${s}/`, anchor: s.replace(/-/g, " ") });
  }
  return links.slice(0, 14);
}

function titleTier1(post) {
  const k = post.keyword;
  if (post.cluster === "comparison") {
    if (k.includes("adobe")) return `Adobe Acrobat alternatives for ${extractAudience(post.slug)} (honest 2026 comparison)`;
    if (k.includes("best pdf tools")) return `Best PDF tools in 2026 for ${extractAudience(post.slug)}`;
    return `${cap(k)} — compared for real workflows`;
  }
  if (post.cluster === "privacy-trust") return `Is ${k} safe? Local processing explained`;
  return `${cap(k)} — expert workflow guide`;
}

function metaTier1(post) {
  const k = post.keyword;
  if (post.cluster === "comparison") {
    return `Compare JoinMyPDF, iLovePDF, Smallpdf, and Acrobat for ${extractAudience(post.slug)}: pricing, privacy, watermarks, and when to use each.`.slice(
      0,
      158
    );
  }
  if (post.cluster === "privacy-trust") {
    return `Understand ${k}: browser-local vs upload tools, IT checklist, and when JoinMyPDF fits sensitive PDF work.`.slice(0, 158);
  }
  return `Step-by-step ${k}: mistakes, limits, and browser-based fixes without unnecessary uploads.`.slice(0, 158);
}

function extractAudience(slug) {
  if (slug.includes("freelancer")) return "freelancers";
  if (slug.includes("student")) return "students";
  if (slug.includes("legal")) return "legal teams";
  if (slug.includes("small-business")) return "small businesses";
  return "everyday office work";
}

function cap(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bPdf\b/g, "PDF");
}

function detectArchetype(post) {
  if (post.cluster === "comparison") return "comparison";
  if (post.cluster === "privacy-trust") return "privacy";
  if (post.cluster === "problem-based" || post.intentType === "problem-solving") return "workflow";
  if (post.cluster === "high-intent") return "transactional";
  return "transactional";
}

export function buildTier1Post(post) {
  const archetype = detectArchetype(post);
  const audience = extractAudience(post.slug);
  const platform = /gmail/i.test(post.slug)
    ? "Gmail"
    : /outlook/i.test(post.slug)
      ? "Outlook"
      : /iphone/i.test(post.slug)
        ? "iPhone"
        : /android/i.test(post.slug)
          ? "Android"
          : null;

  let sections = [];
  if (archetype === "comparison") sections = buildComparisonSections(post, audience);
  else if (archetype === "privacy") sections = buildPrivacySections(post, audience);
  else sections = buildWorkflowSections(post, platform, audience);

  // Add transactional depth for high-intent tool posts
  if (archetype === "transactional" || post.cluster === "high-intent" || post.cluster === "problem-based") {
    const toolFocus = /merge/i.test(post.keyword)
      ? "merge"
      : /compress|reduce|size/i.test(post.keyword)
        ? "compress"
        : /split/i.test(post.keyword)
          ? "split"
          : "general";
    sections = buildWorkflowSections(post, platform, audience);
    sections.push({
      id: "tool-deep",
      heading:
        toolFocus === "merge"
          ? "Merge-specific guidance"
          : toolFocus === "compress"
            ? "Compression-specific guidance"
            : "Tool-specific guidance",
      level: 2,
      paragraphs:
        toolFocus === "merge"
          ? [
              "Merge is order-sensitive. Drag handles exist for a reason: recipients experience your packet in sequence. Put cover letters before attachments, summaries before appendices.",
              "If sources mix portrait and landscape, do not assume the tool will rotate for you—decide whether consistent orientation matters for this recipient.",
              "After merging, scroll for blank pages from empty inputs. They confuse reviewers and inflate size.",
            ]
          : toolFocus === "compress"
            ? [
                "Compression helps email and portals, not archival master copies. Keep an uncompressed master if you may re-edit later.",
                "Scan-heavy PDFs shrink more than text-only contracts. If size barely moves, the bottleneck may be embedded fonts or already-optimized images.",
                "Compress once at the end. Repeated compression stacks artifacts.",
              ]
            : [
                "Pick the primary tool that matches your keyword intent, run once, validate, then chain secondary tools only if a measured limit still fails.",
              ],
    });
    sections.push({
      id: "joinmypdf-fit",
      heading: "Where JoinMyPDF fits",
      level: 2,
      paragraphs: [
        "JoinMyPDF is deliberately narrow: merge, compress, split, JPG↔PDF with local browser processing. That focus is a feature—less surface area for policy review and faster tasks.",
        "Use it when you want clean standard output without watermarks and without creating yet another cloud account for a five-minute task.",
        "We tested multi-file office merges and scan-heavy compress jobs on laptop and phone browsers; failures correlated with RAM and page count more than with ‘online vs offline’ labels.",
      ],
    });
  }

  sections = sections.concat(expandTier1Sections(post.slug, post, archetype, audience, platform));
  sections = sections.concat(buildArchetypeDepth(archetype, post, audience, platform));

  const faq = buildTier1Faqs(post, archetype);
  const internalLinks = buildInternalLinksTier1(post, archetype);
  const metaTitle = titleTier1(post);
  const metaDescription = metaTier1(post);
  const intro = sections[0]?.paragraphs?.[0] || "";
  const primaryTool =
    post.relatedTools?.find((t) =>
      ["pdf-merge", "pdf-compress", "pdf-split", "jpg-to-pdf", "pdf-to-jpg"].includes(t)
    ) || post.relatedTools?.[0];

  const wordCount =
    wc(intro) +
    sections.reduce(
      (n, s) =>
        n +
        wc((s.paragraphs || []).join(" ")) +
        wc((s.list || []).join(" ")) +
        wc((s.limitations || []).join(" ")) +
        (s.table ? wc(s.table.rows.flat().join(" ")) + wc(s.table.headers.join(" ")) : 0),
      0
    ) + wc(faq.map((f) => f.q + " " + f.a).join(" "));

  return {
    ...post,
    tier1: true,
    title: metaTitle,
    description: metaDescription,
    seo: { metaTitle, metaDescription },
    publishDate: post.publishDate || "2026-05-08",
    contentBlocks: {
      intro,
      sections,
      faq,
      internalLinks,
      bestFor: audience,
      primaryTool,
      editorialNote: "Tier-1 editorial guide — methodology and limitations included.",
      wordCount,
    },
  };
}
