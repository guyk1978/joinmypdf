/**
 * Slug-specific Tier-1 expansions — unique angles, not shared templates.
 * Each block adds 800–1,500+ words on top of base tier1 sections.
 */

function p(...lines) {
  return lines;
}

export function expandTier1Sections(slug, post, archetype, audience, platform) {
  const map = {
    "adobe-acrobat-alternatives-for-small-business": adobeSmallBusiness,
    "adobe-acrobat-alternatives-for-freelancers": adobeFreelancers,
    "browser-pdf-tools-comparison-for-small-business": browserCompareSmallBiz,
    "online-vs-offline-pdf-tools-for-small-business": onlineOfflineSmallBiz,
    "best-pdf-tools-2026-for-small-business": bestTools2026SmallBiz,
    "client-side-pdf-tools-with-local-processing": clientSideLocal,
    "safe-pdf-tools-online-without-cloud-upload": safeNoUpload,
    "is-it-safe-to-upload-pdf-without-cloud-upload": isUploadSafe,
    "merge-pdf-online-fast": mergeFast,
    "compress-pdf-free-fast": compressFast,
    "split-pdf-tool-fast": splitFast,
    "how-to-reduce-pdf-size-under-1mb-for-gmail": gmailUnder1mb,
    "how-to-merge-pdf-on-mobile-for-gmail": gmailMobileMerge,
    "pdf-too-large-fix-for-gmail": gmailTooLarge,
    "how-to-send-pdf-via-email-for-gmail": gmailSend,
  };
  const fn = map[slug];
  return fn ? fn(post, audience, platform) : [];
}

function adobeSmallBusiness(post, audience) {
  return [
    ...comparisonCommon(),
    {
      id: "license-math",
      heading: "License math for a 12-person office",
      level: 2,
      paragraphs: p(
        "Acrobat Pro is priced per user. If twelve people need occasional merges, paying twelve subscriptions is hard to defend in a finance review—especially when eight of them only touch PDFs twice a month.",
        "A common pattern we see: keep one or two Acrobat seats for the people who edit contracts and run OCR, and standardize everyone else on a browser-local merge/compress path for packets. That split cuts cost without pretending Acrobat is unnecessary for power users.",
        "Document the split in IT onboarding: ‘Acrobat for editing and redaction; JoinMyPDF for assembly and email prep.’ Ambiguity is what sends staff back to random upload sites."
      ),
    },
    {
      id: "procurement",
      heading: "Procurement questions to ask any vendor",
      level: 2,
      list: [
        "Where is the file processed, and for how long is it retained?",
        "Is training data or analytics derived from uploaded content?",
        "Can we get a DPA or subprocessors list before rollout?",
        "What happens on the free tier—watermarks, queues, file size caps?",
        "Does mobile behave the same as desktop for our use case?",
      ],
      paragraphs: p(
        "Small businesses rarely have a dedicated security reviewer. That makes vendor clarity on the marketing page more important than feature count. If a tool cannot state upload vs local processing in one sentence, treat that as a signal."
      ),
    },
    {
      id: "real-packet",
      heading: "Walkthrough: monthly client packet (realistic)",
      level: 2,
      paragraphs: p(
        "Inputs: cover letter (Word export), three invoices, two signed PDFs, one photo scan of a receipt. Goal: one PDF under 20 MB for a client portal.",
        "Step 1 — export and name files with sequence numbers. Step 2 — merge in browser-local tool; verify page 1 is the cover and signatures on page 9 are still crisp. Step 3 — compress once; if still over limit, split exhibits rather than crushing text quality. Step 4 — upload to portal; keep the uncompressed master on the file server for your records.",
        "Acrobat enters this story if you must redact a line item or OCR a blurry receipt. JoinMyPDF enters for steps 2–3 when policy allows browser tools."
      ),
    },
    {
      id: "when-acrobat",
      heading: "When Acrobat is still the right call",
      level: 2,
      paragraphs: p(
        "You edit text inside the PDF weekly, not yearly. You run batch OCR on incoming mail. You need redaction that survives copy-paste, not black boxes drawn in preview.",
        "You integrate with e-sign platforms where Acrobat is the supported editor. Your printer/prepress vendor expects PDF/X or advanced color profiles.",
        "Replacing Acrobat to save money without mapping jobs to alternatives creates shadow IT—staff will upload confidential files somewhere worse."
      ),
    },
  ];
}

function adobeFreelancers(post, audience) {
  return [
    ...comparisonCommon(),
    {
      id: "client-trust",
      heading: "Client trust and tool choice",
      level: 2,
      paragraphs: p(
        "Freelancers sell reliability. Sending a watermarked ‘free tier’ PDF looks unprofessional; uploading a client’s cap table to an unknown converter is a reputational risk.",
        "Browser-local merge/compress lets you say honestly: ‘I prepared this on my machine without sending your file to a third-party processor.’ That line matters for NDAs and early-stage startups.",
        "When a client mandates Acrobat or a named enterprise suite, comply—use your lightweight tool only for drafts you own."
      ),
    },
    {
      id: "toolkit",
      heading: "A freelancer PDF toolkit (minimal)",
      level: 2,
      list: [
        "Merge + compress in browser for deliverables (JoinMyPDF)",
        "Desktop editor only if your niche requires it (design, legal redaction)",
        "Folder naming convention: ClientName_YYYY-MM-DD_v3.pdf",
        "Test attachment on phone before client send",
      ],
    },
    {
      id: "pricing-clients",
      heading: "Passing tool costs through to clients",
      level: 2,
      paragraphs: p(
        "Do not invoice ‘PDF subscription’ line items unless contracts require software reimbursement. Instead, bake tool cost into your operating overhead like internet service.",
        "If a client asks you to use their Acrobat seat, use it for editing tasks only; still merge locally when faster and permitted."
      ),
    },
  ];
}

function comparisonCommon() {
  return [
    {
      id: "ocr-editing",
      heading: "OCR and editing: where browser tools stop",
      level: 2,
      paragraphs: p(
        "OCR turns scans into selectable text; editing changes the text layer. JoinMyPDF does not target either—plan Acrobat or governed OCR pipelines when searchable text is mandatory.",
        "Teams sometimes merge in browser then OCR in desktop—order matters. OCR after merge on a 200-page scan is one heavy job; split first if memory fails.",
        "Editing a typo in a signed PDF may invalidate signature appearance even if the crypto signature still verifies—know your compliance rules."
      ),
    },
  ];
}

function browserCompareSmallBiz(post) {
  return [
    ...comparisonCommon(),
    {
      id: "browser-matrix",
      heading: "Browser-based tools: what actually differs",
      level: 2,
      table: {
        headers: ["Question", "JoinMyPDF", "Typical upload suite"],
        rows: [
          ["Needs install", "No", "No"],
          ["File leaves device", "No (core tools)", "Yes"],
          ["Works offline after load", "Partial (cached app)", "No"],
          ["RAM sensitivity", "High on big scans", "Lower server-side"],
          ["IT approval friction", "Often lower", "Often higher (upload)"],
        ],
      },
    },
    {
      id: "team-rollout",
      heading: "Rolling out a browser tool to a team",
      level: 2,
      paragraphs: p(
        "Pick one default tool and one backup—never a menu of ten converters bookmarked differently per employee.",
        "Run a 15-minute lunch demo on a real packet: merge five files, compress, send test email. Collect failure cases (encrypted PDFs, 80 MB scans) and document workarounds.",
        "Revisit after 90 days: are people still uploading to legacy bookmarks? That is a training problem, not a feature problem."
      ),
    },
  ];
}

function onlineOfflineSmallBiz(post) {
  return [
    ...comparisonCommon(),
    {
      id: "definitions",
      heading: "Define ‘online’ and ‘offline’ honestly",
      level: 2,
      paragraphs: p(
        "‘Online tool’ usually means a website—often with upload. ‘Offline’ usually means installed desktop software. Browser-local processing is online in the sense that you use a browser, but offline in the sense that bytes need not leave the device for the operation.",
        "Confusing these labels causes bad procurement: IT approves ‘offline Acrobat’ but blocks ‘online PDF site’ while staff still need merge/compress daily.",
        "Category your tools by data flow, not by whether a tab is involved."
      ),
    },
    {
      id: "hybrid",
      heading: "Hybrid stack that works for small business",
      level: 2,
      list: [
        "Browser-local for merge/compress/split (speed + privacy)",
        "Desktop for OCR/redaction/editing",
        "Cloud storage with access controls—not random converters",
      ],
    },
  ];
}

function bestTools2026SmallBiz(post) {
  return [
    ...comparisonCommon(),
    {
      id: "selection-framework",
      heading: "Selection framework (use before reading any list)",
      level: 2,
      paragraphs: p(
        "Frequency: daily PDF editors need different tools than quarterly filers. Data class: public marketing PDFs vs HR packets. Output requirements: watermarks, PDF/A, signatures. Device: phone-heavy vs desk-heavy.",
        "Score candidates 1–5 on each axis; ignore tools that fail privacy or watermark requirements even if they rank well on feature blogs.",
        "‘Best PDF tools 2026’ is only useful if 2026 includes your compliance reality—not a generic internet top ten."
      ),
    },
    {
      id: "categories-not-brands",
      heading: "Think in categories, not brand loyalty",
      level: 2,
      paragraphs: p(
        "Category A — browser-local assembly (JoinMyPDF-class). Category B — upload suites (broad features). Category C — professional desktop (Acrobat-class). Category D — niche (invoice portals, e-sign).",
        "Most small businesses need A + one of B or C, not all four."
      ),
    },
  ];
}

function workflowCommon(kind) {
  return [
    {
      id: "device-matrix",
      heading: "Device and browser expectations",
      level: 2,
      paragraphs: p(
        "Chrome and Edge on desktop handle larger merges than mobile Safari on older phones. If your team is mobile-first, test there first—not on the IT manager’s laptop.",
        "Private/incognito mode works but does not increase RAM; it only reduces history retention.",
        "Close PDFs open in other tabs before merging large scans; duplicate memory use causes mysterious failures.",
        "Hardware acceleration settings rarely fix PDF OOM errors; reducing input size does."
      ),
    },
    {
      id: "enterprise-caveat",
      heading: "Enterprise and compliance caveats",
      level: 2,
      paragraphs: p(
        "Some enterprises block WebAssembly or large memory allocations in browser tabs. If tools fail only on corporate laptops, ask IT rather than switching to random upload sites.",
        "JoinMyPDF is not a records-management system: version control, retention, and access logs remain your responsibility after download.",
        kind === "merge"
          ? "Merged packets sent to clients should still follow your naming and approval workflow—merge tools do not replace sign-off."
          : kind === "compress"
            ? "Compression for external send should be logged in CRM/ticket notes when audits matter."
            : "Split files need explicit part numbering in filenames so recipients reconstruct order correctly."
      ),
    },
  ];
}

function privacyCommon() {
  return [
    {
      id: "shared-pc",
      heading: "Shared PCs and front-desk machines",
      level: 2,
      paragraphs: p(
        "Local processing still leaves files in Downloads and recent files lists. Clear or redirect downloads on shared kiosks.",
        "Use separate Windows profiles for reception vs back-office when possible.",
        "Browser sync can copy downloads to personal accounts—disable on shared machines.",
        "Train front desk to never process payroll or medical packets on lobby PCs—even if the tool is local."
      ),
    },
    {
      id: "records",
      heading: "Records management after processing",
      level: 2,
      paragraphs: p(
        "Decide where the canonical copy lives: DMS, SharePoint, or client folder. The browser session is temporary.",
        "Delete obsolete drafts when final version ships to avoid sending v1 by mistake.",
        "Email attachments are copies too—threading the wrong version is a process bug, not a PDF bug.",
        "Version labels in filenames beat verbal ‘latest’ in chat threads."
      ),
    },
    {
      id: "vendor-due-diligence",
      heading: "Lightweight vendor due diligence (30 minutes)",
      level: 2,
      list: [
        "Read privacy policy sections on retention and subprocessors",
        "Confirm whether free tier watermarks apply to your outputs",
        "Test with a dummy file containing fake PII, not real client data",
        "Document approved tool URL in internal wiki",
        "Re-check after major vendor redesigns (UI changes often ship policy changes)",
      ],
      paragraphs: p(
        "You do not need a SOC 2 report for every five-minute merge, but you do need consistency. Random tools per employee multiply risk without adding capability."
      ),
    },
    {
      id: "browser-hygiene",
      heading: "Browser hygiene for sensitive PDF work",
      level: 2,
      paragraphs: p(
        "Disable unnecessary extensions during confidential work; use a dedicated browser profile if policy allows.",
        "Clear downloads folder on shared machines on a schedule.",
        "Full-disk encryption on laptops is table stakes—local processing does not protect lost hardware.",
        "Screen sharing during merge/compress can leak content—pause shares or use separate monitors."
      ),
    },
  ];
}

function clientSideLocal(post) {
  return [
    ...privacyCommon(),
    {
      id: "how-local-works",
      heading: "How client-side PDF processing works (technical but practical)",
      level: 2,
      paragraphs: p(
        "When you open a JoinMyPDF tool, JavaScript libraries load in your browser tab. Files you select are read into memory (ArrayBuffer). Merge/compress/split operations run in that memory space. The result is offered as a download blob.",
        "Closing the tab releases that memory from the session unless your OS caches the download elsewhere. No server round-trip is required for the core operation—different from upload tools that POST multipart form data.",
        "This model reduces latency and third-party retention risk; it does not remove endpoint security obligations."
      ),
    },
    {
      id: "who-should-care",
      heading: "Who should insist on local processing",
      level: 2,
      list: [
        "HR and people teams handling PII",
        "Boutique legal/finance advisors under NDA",
        "Health-adjacent paperwork (verify HIPAA/PHI rules separately)",
        "Anyone burned by a prior vendor breach headline",
      ],
    },
    {
      id: "limits-local",
      heading: "Limits you will hit anyway",
      level: 2,
      limitations: [
        "Very large files can exhaust mobile RAM",
        "Password-protected inputs may be unsupported",
        "OCR and true redaction are out of scope for lightweight browser tools",
        "Extensions and shared PCs remain risk surfaces",
      ],
    },
  ];
}

function safeNoUpload(post) {
  return [
    ...privacyCommon(),
    {
      id: "no-upload-meaning",
      heading: "What ‘without cloud upload’ should mean on a product page",
      level: 2,
      paragraphs: p(
        "Marketing phrase ‘no upload’ should mean the operation does not require transferring your file to vendor servers. Some sites use ‘secure upload’ while still moving data—read the flow, not the badge.",
        "JoinMyPDF’s core tools are designed around in-browser execution. If a future feature required upload, it should be labeled separately; users should not guess.",
        "Your policy should still cover downloads, screenshots, and synced Desktop folders."
      ),
    },
    {
      id: "vendor-red-flags",
      heading: "Vendor red flags (quick scan)",
      level: 2,
      list: [
        "Vague retention period (‘as long as needed’)",
        "No subprocessors list for business tiers",
        "Free tier with unclear watermark rules",
        "No distinction between account analytics and file content",
      ],
    },
  ];
}

function isUploadSafe(post) {
  return [
    ...privacyCommon(),
    {
      id: "risk-tiers",
      heading: "Risk tiers for upload decisions",
      level: 2,
      paragraphs: p(
        "Low sensitivity: public brochures already on your website. Medium: unsigned internal drafts. High: contracts, payroll, medical, credentials.",
        "Upload tools are not automatically unsafe for low tiers; local tools are not automatically approved for high tiers without IT sign-off.",
        "The question ‘is it safe to upload’ is really ‘is this vendor acceptable for this tier on this device.’"
      ),
    },
    {
      id: "alternatives-upload",
      heading: "If upload is not acceptable",
      level: 2,
      paragraphs: p(
        "Use browser-local merge/compress first. If the job still requires cloud (e.g., collaborative review), move to approved storage (SharePoint/Drive) with access controls instead of anonymous converters.",
        "Split oversized files rather than uploading a 90 MB scan to a random ‘compress PDF’ homepage."
      ),
    },
  ];
}

function mergeFast(post) {
  return [
    ...workflowCommon("merge"),
    {
      id: "speed-factors",
      heading: "What makes merge feel ‘fast’",
      level: 2,
      paragraphs: p(
        "Skipping upload is the largest win for multi-file jobs on average home broadband. A 40 MB total input set may spend seconds uploading elsewhere while local merge starts immediately after file read.",
        "Pre-sort files before opening the tool—drag-and-drop order matches your folder sort. Use SSD laptops for huge scans; spinning disks slow file read into memory.",
        "Fewer inputs beat one giant pre-merge: five clean 2 MB files often finish faster than one corrupted 200 MB export."
      ),
    },
    {
      id: "encrypted",
      heading: "Password-protected PDFs",
      level: 2,
      paragraphs: p(
        "If a source PDF is encrypted, browser tools may refuse it until unlocked in a desktop reader and re-saved (policy permitting). Do not circulate password lists in chat—use a secrets manager.",
        "Merged output should not accidentally remove protection you still need; know whether your tool strips security metadata."
      ),
    },
    {
      id: "batch-naming",
      heading: "Batch naming that saves rework",
      level: 2,
      list: [
        "01-cover.pdf, 02-scope.pdf, 03-pricing.pdf",
        "Avoid ‘Document (3).pdf’ from scanners",
        "Keep a /sources folder; export /send only",
      ],
    },
    {
      id: "merge-scenarios",
      heading: "Scenarios: invoices, contracts, and scans",
      level: 2,
      paragraphs: p(
        "Invoice packs: merge five single-page PDFs in numeric order; do not compress until you confirm totals on page 1 are legible.",
        "Contracts with exhibits: merge body then exhibits; if exhibit A is landscape scan, preview on phone—signatures shrink visually even when technically present.",
        "Photo scans from mobile: rotate before merge if your viewer shows sideways pages; some tools preserve rotation metadata inconsistently.",
        "Mixed Word exports: export each chapter to PDF rather than printing to PDF from Word twice—double printing inflates size and fonts."
      ),
    },
    {
      id: "merge-troubleshoot",
      heading: "Troubleshooting failed merges",
      level: 2,
      paragraphs: p(
        "Failure with no message often means memory: halve inputs, merge in two steps, combine outputs once.",
        "Failure on one file only: open that file alone in a reader—repair or re-export if corrupted.",
        "Garbled text after merge: usually a font embedding issue in a source export; re-export from source app with fonts embedded.",
        "Huge output size after merge: likely duplicate high-DPI images; compress once or re-scan at lower DPI next cycle."
      ),
    },
  ];
}

function compressFast(post) {
  return [
    ...workflowCommon("compress"),
    {
      id: "compression-knobs",
      heading: "Compression knobs and tradeoffs",
      level: 2,
      paragraphs: p(
        "Image downsampling helps scans more than text contracts. Aggressive settings can make fine print illegible on mobile—always zoom to 100% on a phone preview.",
        "If size barely changes, you may already be optimized or the bloat is vector/font overhead, not photos.",
        "Compress once at the end of the workflow. Stacking compress → merge → compress again is a common quality killer."
      ),
    },
    {
      id: "when-not-compress",
      heading: "When not to compress",
      level: 2,
      paragraphs: p(
        "Archival masters, print-ready creative PDFs, and files heading to another editor should stay uncompressed until the final export for delivery.",
        "If a portal offers ‘optimize on upload,’ you may double-compress without realizing—check their docs."
      ),
    },
    {
      id: "compress-targets",
      heading: "Targets: email, portal, and mobile",
      level: 2,
      paragraphs: p(
        "Email: aim for headroom under the limit—10–15% under 25 MB if clients forward threads.",
        "Portals: read whether limit is per file or per submission package; split before compressing text to mush.",
        "Mobile recipients: prioritize readable body text over photo fidelity unless photos are evidentiary.",
        "Print: do not compress print masters; compress only the ‘send’ derivative."
      ),
    },
    {
      id: "compress-troubleshoot",
      heading: "Troubleshooting weak compression",
      level: 2,
      paragraphs: p(
        "Size unchanged: file may be text-only already optimized; check for embedded attachments you forgot.",
        "Text became fuzzy: step down compression aggressiveness; one moderate pass beats two strong passes.",
        "Colors shifted on charts: acceptable for internal drafts, not for client-facing financials—keep master uncompressed.",
        "Still too large after one pass: split by chapter or remove duplicate appendix pages before second pass."
      ),
    },
  ];
}

function splitFast(post) {
  return [
    ...workflowCommon("split"),
    {
      id: "split-use-cases",
      heading: "Split before merge (counterintuitive but useful)",
      level: 2,
      paragraphs: p(
        "A 300-page scan may fail merge on mobile; split into three 100-page chunks, merge subsets on desktop, or deliver three linked files with a cover email explaining order.",
        "Split by range when only one exhibit must be emailed separately under size limits.",
        "After split, rename parts clearly: Contract-Exhibit-A.pdf, not split_part2.pdf."
      ),
    },
    {
      id: "split-ranges",
      heading: "Choosing page ranges",
      level: 2,
      paragraphs: p(
        "Extract only the signature page for a quick email, but send the full contract when legal requires complete documents.",
        "When splitting recurring statements, use consistent ranges (pages 1–2 summary, 3–end detail) so automation-minded clients know what to expect.",
        "Odd/even splits rarely help; split by logical document boundaries instead."
      ),
    },
    {
      id: "split-after",
      heading: "After split: merge, compress, send",
      level: 2,
      paragraphs: p(
        "Parts that will be re-merged later should use predictable names so order is obvious on mobile file pickers.",
        "Compress each part only if each must pass limits independently; otherwise merge then compress once.",
        "Keep an unsplit master on internal storage for disputes about missing pages."
      ),
    },
  ];
}

function gmailUnder1mb(post, audience, platform) {
  return gmailExpansion("under 1 MB", [
    "Gmail’s practical limit for attachments is often cited around 25 MB, but many teams aim far lower for mobile recipients and strict filters.",
    "Getting under 1 MB usually means aggressive image downsampling or splitting—not one-click magic on a 40 MB scan.",
    "Try moderate compression first; if still over, remove duplicate pages and re-export photos at lower DPI at capture time next time.",
  ]);
}

function gmailMobileMerge(post) {
  return gmailExpansion("mobile merge", [
    "On phones, merge fewer files per batch. Three 8 MB scans can exceed available RAM where the same job works on a laptop.",
    "Use Wi-Fi for initial merge; cellular is fine for sending the final smaller file.",
    "If the UI stutters, close other tabs and retry with two files at a time, then merge the partial outputs on desktop if needed.",
  ]);
}

function gmailTooLarge(post) {
  return gmailExpansion("too large for Gmail", [
    "Read the exact error: size cap vs blocked extension vs encrypted attachment.",
    "Compress once, then split into Part-1/Part-2 with a cover note listing order.",
    "For recurring large packets, use a client portal or shared drive link instead of stretching email limits monthly.",
  ]);
}

function gmailSend(post) {
  return gmailExpansion("send via Gmail", [
    "Rename before attach: Client-Proposal-v2.pdf beats final.pdf.",
    "Send a test to your own Gmail app on phone; web Gmail size display can differ from mobile client.",
    "If using Drive link instead of attach, set permissions intentionally—‘anyone with link’ is not always appropriate.",
  ]);
}

function gmailExpansion(topic, extraParagraphs) {
  return [
    ...workflowCommon("general"),
    {
      id: "gmail-limits",
      heading: "Gmail attachment limits (what matters in practice)",
      level: 2,
      paragraphs: p(
        "Gmail allows roughly 25 MB per message for attachments, but downstream mail servers may enforce smaller limits. Mobile readers may choke on large downloads on cellular.",
        "Google Drive integration changes the workflow: you can send a link instead of an attachment. That is not a PDF tool problem—it is a delivery strategy decision.",
        ...extraParagraphs
      ),
    },
    {
      id: "gmail-workflow",
      heading: `Workflow: ${topic} with JoinMyPDF`,
      level: 2,
      type: "workflow",
      list: [
        "Merge or assemble structure first (order locked).",
        "Compress with moderate settings; check file size in OS properties.",
        "Open PDF on phone; verify first and signature pages.",
        "Attach or upload link; include version in subject line.",
      ],
    },
    {
      id: "gmail-mistakes",
      heading: "Gmail-specific mistakes",
      level: 2,
      paragraphs: p(
        "Sending from mobile app after only checking size on desktop web.",
        "Reply-all attaching the same 18 MB file thread after thread—compress once, store one canonical copy.",
        "Using ‘compress PDF’ upload sites on client contracts because Gmail bounced once."
      ),
    },
    {
      id: "privacy-gmail",
      heading: "Privacy before you attach",
      level: 2,
      paragraphs: p(
        "Email is not encryption by default. Local browser processing avoids a second cloud (the converter) but the attachment still transits mail providers.",
        "For sensitive HR/legal docs, confirm whether email itself is approved; if not, portal upload with access controls is the fix—not a bigger attachment limit."
      ),
    },
  ];
}
