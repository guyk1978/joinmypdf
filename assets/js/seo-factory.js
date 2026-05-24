/* global PDFCore, UICore */
(function () {
  "use strict";

  const DATA_PATH = "/assets/data/tools.json";
  const BLOG_DATA_PATH = "/assets/data/blog.json";
  const MODIFIER_LIBRARY = {
    fast: { text: "fast processing", useCase: "urgent delivery workflows" },
    free: { text: "free usage mode", useCase: "budget-friendly daily tasks" },
    online: { text: "online browser access", useCase: "cross-device availability" },
    mobile: { text: "mobile-first usage", useCase: "phone-based document operations" },
    "no-upload": { text: "no-upload privacy flow", useCase: "sensitive file handling" },
    "high-quality": { text: "high quality output", useCase: "presentation-grade documents" },
    "large-files": { text: "large-file handling", useCase: "high page-count files" },
    "no-signup": { text: "no-signup convenience", useCase: "quick one-off operations" },
    secure: { text: "secure local processing", useCase: "confidential business docs" },
    instant: { text: "instant generation", useCase: "high-throughput workflows" },
  };

  async function loadRegistry() {
    const response = await fetch(DATA_PATH, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed loading tools registry.");
    return response.json();
  }

  async function loadBlogRegistry() {
    const response = await fetch(BLOG_DATA_PATH, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed loading blog registry.");
    return response.json();
  }

  function slugFromPath(pathname) {
    const clean = pathname.replace(/^\/+|\/+$/g, "");
    const parts = clean.split("/");
    return parts.length > 1 ? parts[1] : "";
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ensureMeta(name, value) {
    let node = document.querySelector('meta[name="' + name + '"]');
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute("name", name);
      document.head.appendChild(node);
    }
    node.setAttribute("content", value);
  }

  function ensureCanonical(pathname) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    try {
      link.href = new URL(pathname, window.location.origin).toString();
    } catch (error) {
      link.href = pathname;
    }
  }

  function appendSchema(schema) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  function toolActionVerb(tool) {
    const verbMap = {
      merge: "merge",
      compress: "compress",
      split: "split",
      protect: "password-protect",
      unlock: "unlock",
      redact: "redact",
      sign: "sign a PDF",
      "delete-pages": "delete PDF pages",
      "add-page-numbers": "add page numbers to a PDF",
      "jpg-to-pdf": "convert JPG to PDF",
      "png-to-pdf": "convert PNG to PDF",
      "pdf-to-jpg": "convert PDF to JPG",
      "pdf-to-png": "convert PDF to PNG",
    };
    return verbMap[tool.operation] || "process PDF";
  }

  function generateClusterVariants(tool, registry) {
    const defaults = registry.clusterDefaults || {};
    const modifiers = defaults.modifiers || Object.keys(MODIFIER_LIBRARY);
    const targetCount = Math.max(20, Math.min(100, Number(defaults.targetVariantCount || 24)));
    const baseKeyword = (tool.primaryKeyword || tool.slug.replaceAll("-", " ")).replace(/\s+/g, " ").trim();
    const baseShort = baseKeyword.replace(/\bonline\b/gi, "").trim();
    const manual = (tool.longTailPages || []).map((entry) => ({
      slug: entry.slug,
      keyword: entry.keyword,
      modifier: (entry.modifier || entry.slug.replace(tool.slug + "-", "")).toLowerCase(),
      angle: entry.angle || "intent-specific workflow",
      source: "manual",
    }));
    const generated = [];
    const combos = [
      ["online", "fast"],
      ["free", "no-signup"],
      ["mobile", "fast"],
      ["high-quality", "online"],
      ["large-files", "fast"],
      ["secure", "no-upload"],
      ["instant", "online"],
      ["free", "mobile"],
      ["large-files", "high-quality"],
      ["no-upload", "mobile"],
    ];
    modifiers.forEach((modifier) => {
      generated.push({
        slug: tool.slug + "-" + modifier,
        keyword: baseShort + " " + modifier.replaceAll("-", " "),
        modifier,
        angle: (MODIFIER_LIBRARY[modifier] || {}).text || modifier.replaceAll("-", " "),
        source: "single",
      });
    });
    combos.forEach((pair) => {
      const key = pair.join("-");
      generated.push({
        slug: tool.slug + "-" + key,
        keyword: baseShort + " " + pair.join(" ").replaceAll("-", " "),
        modifier: key,
        angle: pair
          .map((mod) => (MODIFIER_LIBRARY[mod] || {}).text || mod.replaceAll("-", " "))
          .join(" + "),
        source: "combo",
      });
    });

    const unique = new Map();
    manual.concat(generated).forEach((item) => {
      if (!unique.has(item.slug)) unique.set(item.slug, item);
    });
    return Array.from(unique.values()).slice(0, targetCount);
  }

  function buildGraph(registry) {
    const bySlug = Object.fromEntries(registry.tools.map((tool) => [tool.slug, tool]));
    return registry.tools.map((tool) => {
      const links = new Set(tool.relatedTools || []);
      registry.tools
        .filter((item) => item.slug !== tool.slug && item.category === tool.category)
        .forEach((item) => links.add(item.slug));
      if (links.size < 3) {
        registry.tools.filter((item) => item.slug !== tool.slug).forEach((item) => links.add(item.slug));
      }
      const weight = Number(tool.internalLinkWeight || 1);
      const maxLinks = Math.max(3, Math.min(8, Math.round(3 + weight * 2)));
      return {
        tool: tool.slug,
        links: Array.from(links)
          .map((slug) => bySlug[slug])
          .filter(Boolean)
          .slice(0, maxLinks),
      };
    });
  }

  function findToolAndVariant(registry, pathname) {
    const key = slugFromPath(pathname);
    const base = registry.tools.find((tool) => tool.slug === key);
    if (base) return { tool: base, variant: null };
    for (const tool of registry.tools) {
      const variants = generateClusterVariants(tool, registry);
      const variant = variants.find((entry) => entry.slug === key);
      if (variant) return { tool, variant };
      if (key.startsWith(tool.slug + "-")) {
        const modifier = key.slice(tool.slug.length + 1);
        return {
          tool,
          variant: {
            slug: key,
            modifier,
            keyword: tool.primaryKeyword.replace(/\bonline\b/gi, "").trim() + " " + modifier.replaceAll("-", " "),
            angle: "intent route for " + modifier.replaceAll("-", " "),
            source: "routed",
          },
        };
      }
    }
    return { tool: null, variant: null };
  }

  function getSortedBlogPosts(blogRegistry) {
    const posts = blogRegistry && blogRegistry.blog ? blogRegistry.blog.slice() : [];
    posts.sort((a, b) => {
      const featureA = a.homepageFeatureEligible ? 1 : 0;
      const featureB = b.homepageFeatureEligible ? 1 : 0;
      if (featureA !== featureB) return featureB - featureA;
      const scoreA = Number((a.signals && a.signals.score) || 0);
      const scoreB = Number((b.signals && b.signals.score) || 0);
      if (scoreA !== scoreB) return scoreB - scoreA;
      const ta = Date.parse(a.publishDate || "1970-01-01");
      const tb = Date.parse(b.publishDate || "1970-01-01");
      return tb - ta;
    });
    return posts;
  }

  function asArray(value) {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null) return [];
    if (typeof value === "string") return [value];
    return [];
  }

  function renderHomepage(registry, blogRegistry) {
    document.title = registry.site.defaultTitle;
    ensureMeta("description", registry.site.defaultDescription);
    ensureCanonical("/");

    const allTools = document.getElementById("allTools");
    const categoryBlocks = document.getElementById("categoryBlocks");
    const authorityLinks = document.getElementById("authorityLinks");
    const latestBlogPosts = document.getElementById("latestBlogPosts");
    const recentUpdates = document.getElementById("recentUpdates");
    const variantsByTool = Object.fromEntries(
      registry.tools.map((tool) => [tool.slug, generateClusterVariants(tool, registry)])
    );

    if (allTools) {
      allTools.innerHTML = registry.tools
        .map((tool) => {
          const category = registry.categories.find((cat) => cat.slug === tool.category);
          const variants = variantsByTool[tool.slug] || [];
          return (
            '<article class="card glass"><h3>' +
            escapeHtml(tool.title) +
            "</h3><p>" +
            escapeHtml(tool.intent || "") +
            "</p><span class=\"tool-chip\">" +
            escapeHtml(category ? category.label : tool.category) +
            '</span><div class="btn-row"><a class="btn btn--ghost" href="/tools/' +
            tool.slug +
            '/">Open Tool</a></div></article>'
          );
        })
        .join("");
    }

    if (categoryBlocks) {
      categoryBlocks.innerHTML = registry.categories
        .map((category) => {
          const tools = registry.tools.filter((tool) => tool.category === category.slug);
          return (
            '<article class="glass card"><h2>' +
            escapeHtml(category.label) +
            "</h2><p>" +
            escapeHtml(category.description) +
            '</p><div class="related-links">' +
            tools.map((tool) => '<a href="/tools/' + tool.slug + '/">' + escapeHtml(tool.title) + "</a>").join("") +
            "</div></article>"
          );
        })
        .join("");
    }

    if (authorityLinks) {
      authorityLinks.innerHTML = registry.tools
        .flatMap((tool) => (variantsByTool[tool.slug] || []).slice(0, 10))
        .map((variant) => '<a href="/tools/' + variant.slug + '/">' + escapeHtml(variant.keyword) + "</a>")
        .join("");
    }

    if (latestBlogPosts) {
      const renderLatest = function () {
        const latest = getSortedBlogPosts(blogRegistry).slice(0, 8);
        latestBlogPosts.innerHTML = latest
          .map(
            (post) =>
              '<article class="card glass"><h3>' +
              escapeHtml(post.title) +
              "</h3><p>" +
              escapeHtml(post.keyword) +
              '</p><div class="btn-row"><a class="btn btn--ghost" href="/blog/' +
              post.slug +
              '/">Read Article</a></div></article>'
          )
          .join("");
      };
      if (window.requestIdleCallback) {
        window.requestIdleCallback(renderLatest);
      } else {
        setTimeout(renderLatest, 0);
      }
    }

    if (recentUpdates) {
      const latestBlogs = getSortedBlogPosts(blogRegistry).slice(0, 6).map((post) => ({
        title: post.title,
        subtitle: post.publishDate || "recent blog update",
        href: "/blog/" + post.slug + "/",
      }));
      const latestTools = (registry.tools || []).slice(0, 3).map((tool) => ({
        title: tool.title,
        subtitle: tool.homepageFeatureEligible ? "High priority tool" : "Tool page update",
        href: "/tools/" + tool.slug + "/",
      }));
      const highPriorityLongTail = (registry.tools || [])
        .flatMap((tool) => generateClusterVariants(tool, registry).slice(0, 2))
        .slice(0, 3)
        .map((variant) => ({
          title: variant.keyword,
          subtitle: "Workflow tip",
          href: "/tools/" + variant.slug + "/",
        }));
      recentUpdates.innerHTML = latestBlogs
        .concat(latestTools, highPriorityLongTail)
        .map(
          (item) =>
            '<article class="card glass"><h3>' +
            escapeHtml(item.title) +
            "</h3><p>" +
            escapeHtml(item.subtitle) +
            '</p><div class="btn-row"><a class="btn btn--ghost" href="' +
            item.href +
            '">Open</a></div></article>'
        )
        .join("");
    }

    appendSchema({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: registry.site.name,
      url: registry.site.baseUrl,
    });
  }

  function buildSeoParagraphs(tool, variant) {
    const keyword = variant ? variant.keyword : tool.primaryKeyword;
    const angle = variant ? variant.angle || "a common document scenario" : "the core workflow";
    const secondary = (tool.secondaryKeywords || []).slice(0, 4).join(", ");
    const useCases = (tool.useCases || []).slice(0, 2).join(" and ");
    const p1 = variant
      ? "This page helps you " +
        toolActionVerb(tool) +
        ' when your goal matches searches like “' +
        keyword +
        '”. You get the same JoinMyPDF controls as the main ' +
        tool.title +
        " flow—local processing in your browser and a straightforward download when you are done."
      : tool.description +
        " Whether you are packaging invoices, coursework, or contract sets, the objective is simple: complete the task without installing desktop software.";
    const p2 =
      "Privacy is intentional: files are handled in your browser session on your device rather than uploaded to JoinMyPDF servers for processing. That reduces transfer time for many jobs and is easier to reason about when documents are sensitive.";
    const p3 = variant
      ? "Because you landed on a page tuned for “" +
        keyword +
        "”, we emphasize " +
        angle.toLowerCase() +
        " If you want the generic experience, use the main " +
        tool.title +
        " link in the navigation."
      : "If you need related steps next, many people follow merge with compression for email limits, or split first when only a few pages matter. Use the related links on this page to continue in one sitting.";
    const p4 = secondary.length
      ? "Related phrases people use alongside this task include " +
        secondary +
        ". You do not need to match wording exactly—follow the checklist, confirm previews where available, and download once the status line shows success."
      : "Follow the checklist, confirm previews where available, and download once the status line shows success.";
    const p5 = useCases.length
      ? "Typical situations include " + useCases + "."
      : "If you are new to browser-based PDF tools, start with a small test file, verify the output, then run your real documents.";
    const p6 =
      "If something fails, it is usually browser memory on very large files, mixed inputs, or a protected PDF. Try fewer pages per run, re-export from the authoring app, or split before converting.";
    return [p1, p2, p3, p4, p5, p6];
  }

  function buildFaq(tool, variant) {
    if (!variant) {
      if (tool.faq && tool.faq.length) return tool.faq;
      return [
        { q: "Is " + tool.title + " free to use on JoinMyPDF?", a: "Yes. The tool runs directly in the browser with no paid account required for standard usage." },
        { q: "Do my files get uploaded to external servers?", a: "No. JoinMyPDF tools process files client-side, helping preserve privacy and reduce transfer delays." },
        { q: "Can I use this tool on mobile devices?", a: "Yes. The interface is responsive and supports modern mobile browsers." },
        { q: "How quickly can I finish a typical workflow?", a: "Most tasks complete in one short session, depending on file size and device performance." },
      ];
    }
    const modifierText = variant.modifier.replaceAll("-", " ");
    const angle = variant.angle || "We keep the flow short and highlight the controls that matter for your scenario.";
    return [
      { q: "Is this the same " + tool.title + " experience as your main page?", a: "Yes—the same controls and privacy model. This page uses clearer wording for a specific situation so you know what to expect before you start." },
      { q: "What does “" + variant.keyword + "” mean in practice?", a: angle },
      { q: "Does this page use a different backend than the main tool?", a: "No. You still run the same in-browser workflow; guidance and context are tuned to your intent." },
      { q: "Where is the general " + tool.title + " page?", a: "Open /tools/" + tool.slug + "/ from the navigation for the all-purpose entry point." },
    ];
  }

  function renderFaq(target, faqItems) {
    target.innerHTML = faqItems
      .map((entry) => "<details><summary>" + escapeHtml(entry.q) + "</summary><p>" + escapeHtml(entry.a) + "</p></details>")
      .join("");
  }

  function findRelatedBlogPosts(blogRegistry, toolSlug, excludeSlug, limit) {
    const posts = (blogRegistry && blogRegistry.blog ? blogRegistry.blog : []).filter((post) =>
      (post.relatedTools || []).includes(toolSlug)
    );
    return posts
      .filter((post) => (excludeSlug ? post.slug !== excludeSlug : true))
      .slice(0, limit || 4);
  }

  function buildBlogFaq(post, relatedToolsList) {
    const tools = Array.isArray(relatedToolsList) ? relatedToolsList : [];
    const primaryTool = tools[0];
    const kw = post.keyword || post.title || "this workflow";
    const seedFaq =
      post.contentBlocks && Array.isArray(post.contentBlocks.faq) && post.contentBlocks.faq.length
        ? post.contentBlocks.faq.slice()
        : [
            {
              q: "What is the fastest way to apply this guide for " + post.keyword + "?",
              a: "Start with the linked JoinMyPDF tools in this article and follow the workflow section step by step.",
            },
            {
              q: "Is this method suitable for business documents?",
              a: "Yes. The process is designed for daily operations, report packaging, and team-ready document sharing.",
            },
            {
              q: "Do I need software installation to follow this tutorial?",
              a: "No. The workflow is browser-based and works on modern desktop and mobile devices.",
            },
            {
              q: "Which related tools should I use next?",
              a: "Check the related tool links in this article to continue your next PDF workflow step.",
            },
          ];

    const extras = [
      {
        q: "How long does a typical " + kw + " run take in practice?",
        a: "Most operations complete in a few seconds for documents under 50 pages, with larger files scaling with size and device performance.",
      },
      {
        q: "Can I run " + kw + " on a phone or tablet?",
        a: "Yes. The JoinMyPDF interface is responsive and supports modern mobile browsers, so the same workflow runs on phone, tablet, and desktop.",
      },
      {
        q: "Is " + kw + " safe for confidential documents?",
        a: "Files stay on the device and are not uploaded to a remote server, which is suitable for HR, legal, and finance documents when policy allows browser-based tools.",
      },
      {
        q: primaryTool
          ? "Which tool should I open first for " + kw + "?"
          : "Which JoinMyPDF tool should I open first for " + kw + "?",
        a: primaryTool
          ? "Open " + primaryTool.title + " at /tools/" + primaryTool.slug + "/ as the primary action, then branch into related tools only if you need optimization or splitting."
          : "Open the related tool linked in this article and start with a single primary action; branch into other tools only when needed.",
      },
    ];

    const result = seedFaq.slice();
    const seen = new Set(result.map((entry) => (entry.q || "").trim().toLowerCase()));
    for (const entry of extras) {
      if (result.length >= 6) break;
      const key = (entry.q || "").trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(entry);
    }
    return result;
  }

  function buildBlogContent(post, tools) {
    if (post.contentBlocks && post.contentBlocks.body) {
      const bodyBlocks = asArray(post.contentBlocks.body);
      if (bodyBlocks.length) return bodyBlocks;
    }
    const relatedToolTitles = tools.map((tool) => tool.title).join(", ");
    return [
      "If you are searching for " +
        post.keyword +
        ", you are likely trying to complete a document task quickly without installing heavy software. Many users start with a simple need such as combining files, reducing size, or converting formats, but they often end up in workflows that involve multiple steps. This is where a tool-connected guide becomes more useful than a generic article. Instead of abstract advice, this page maps the exact actions you can take using browser-based tools and links those actions directly to execution pages.",
      "A practical workflow begins by defining your final output goal. For example, some users want a single shareable file for email, others need smaller documents for portal limits, and some need page-level extraction for review processes. Once the goal is clear, the process is easier: select the right utility, upload files, verify output, and continue to the next step only when needed. This staged approach reduces mistakes and avoids repetitive rework that often happens when users jump between unrelated tools.",
      "JoinMyPDF is built for this type of progression. Because processing runs client-side, you can complete tasks with low friction while keeping files local to your session. That model helps with privacy-sensitive workflows and can improve speed for common operations because you avoid repeated server upload delays. It also improves consistency: each tool follows a similar interaction pattern, so once users learn one workflow they can apply the same behavior across related tasks.",
      "For " +
        post.intentType +
        " search intent, context matters as much as instructions. Informational readers need clear definitions and examples. Comparison readers need decision criteria and trade-offs. Tutorial readers need direct steps and expected outcomes. Privacy-focused readers need confidence about processing flow and data exposure. This article framework adapts to intent by combining education with practical next actions, which makes the page useful for both search engines and real users.",
      "In real-world usage, teams often chain tools. A typical path can be merge -> compress -> export images, or scan-to-PDF -> split -> reorganize. By linking related operations intentionally, this guide helps you complete full document cycles rather than single isolated actions. It also supports better internal navigation across the platform, which strengthens crawl depth and helps important pages get discovered faster.",
      "Compared with traditional desktop-only approaches, browser-based workflows are easier to access across devices and faster to adopt for occasional tasks. Compared with upload-heavy cloud tools, client-side processing can reduce privacy concerns for many users. While no system is universal for every case, the balance of speed, convenience, and local handling makes this model highly effective for recurring PDF tasks in business, education, and personal administration.",
      "Use cases vary by audience. Operations teams may process weekly reports and invoices. Students may combine assignments and scanned notes. Support teams may optimize PDF attachments for faster ticket handling. Legal and compliance users may split and reorganize documentation sets for review rounds. Each scenario benefits from clear steps, predictable outputs, and direct transitions between related tools.",
      "To get the best results from this guide, start with one core action, validate output quality, and then continue to secondary actions only if needed. This keeps the workflow lean and reduces unnecessary file conversions. The related tools for this article are " +
        relatedToolTitles +
        ". Use them as a guided sequence, not as disconnected utilities, and you will complete document workflows faster with fewer errors.",
    ];
  }

  function blogTodayIso() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function blogFormatDateLong(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    try {
      return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch (_) {
      return iso;
    }
  }

  function blogToolLink(tool, label) {
    if (!tool) return escapeHtml(label || "JoinMyPDF");
    return '<a href="/tools/' + tool.slug + '/">' + escapeHtml(label || tool.title) + "</a>";
  }

  function blogPostLink(post, label) {
    if (!post) return escapeHtml(label || "");
    return '<a href="/blog/' + post.slug + '/">' + escapeHtml(label || post.title) + "</a>";
  }

  function buildLongFormSections(post, tools, otherPosts) {
    const kw = post.keyword || post.title || "this PDF workflow";
    const kwCap = kw.charAt(0).toUpperCase() + kw.slice(1);
    const t1 = tools[0] || null;
    const t2 = tools[1] || t1;
    const t3 = tools[2] || t2 || t1;
    const otherPost = (otherPosts || [])[0] || null;
    const e = escapeHtml;

    const sections = [
      {
        id: "what-is",
        heading: "What is " + kwCap + "?",
        paragraphs: [
          e("In simple terms, " + kw + " refers to the practical workflow people follow to complete the related document task in a fast, browser-based environment. The phrase covers a real intent: users want a clear path from raw files to a final, share-ready output without unnecessary friction. Understanding what the workflow actually involves makes it easier to choose the right tool, sequence the steps, and avoid avoidable rework."),
          e("Most readers arrive on this page with a specific outcome in mind, not just curiosity. They have a set of files, a deadline, and a target format or size. The goal of this guide is to translate that intent into a series of small, repeatable actions you can run with ") + blogToolLink(t1) + e(", which removes the heavy installation step common in legacy desktop tools and keeps the entire process running locally inside a browser tab."),
          e("Because everything stays client-side, files are not pushed to remote servers for processing. That detail matters for sensitive documents and for users who need predictable, low-latency runs. It also means the same workflow behaves consistently on desktop and mobile, which makes " + kw + " a viable approach for one-off tasks and recurring operations alike."),
          e("Throughout this article, you will find direct references to the tools that map to each phase of the workflow, along with related guides such as ") +
            (otherPost ? blogPostLink(otherPost) : e("our other JoinMyPDF tutorials")) +
            e(" so you can branch into adjacent topics without losing the thread of the main task."),
        ],
      },
      {
        id: "why-use",
        heading: "Why use " + kw + "?",
        paragraphs: [
          e("The clearest reason to invest in a structured " + kw + " process is consistency. When the same steps run in the same order, output quality stops depending on memory or improvisation. That predictability is valuable in business workflows, where a missing page in a contract pack or an oversized invoice attachment can break a downstream process."),
          e("A second reason is speed. Working inside the browser with ") + blogToolLink(t1) + e(" removes the upload-wait-download cycle that most cloud tools force on users. Files load instantly because they never leave the device, and exports are generated as soon as the operation completes. For people processing many small jobs per day, that gap compounds into a meaningful time saving."),
          e("A third reason is privacy. Running " + kw + " locally avoids transmitting files to a third party, which is often a hard requirement for HR records, legal documents, healthcare exports, and similar categories. The model is not tied to a specific organization size: solo freelancers, small teams, and enterprise users all benefit from keeping documents on the device until they are intentionally shared."),
          e("Finally, the " + kw + " workflow connects naturally to adjacent operations. After running ") +
            blogToolLink(t1) +
            e(", many users move into ") +
            blogToolLink(t2) +
            e(" to optimize size or into ") +
            blogToolLink(t3) +
            e(" to extract specific pages. Treating these as a sequence rather than separate one-off tools is what unlocks a real productivity gain."),
          e("There is also a learning-curve advantage. Because every JoinMyPDF tool follows the same dropzone, status, and download pattern, the time spent learning one " + kw + " workflow transfers cleanly to every other PDF task. Teams onboard faster, support questions drop, and the same checklist works for new hires and seasoned operators."),
        ],
      },
      {
        id: "step-by-step",
        heading: "Step-by-step: how to " + kw,
        paragraphs: [
          e("Start with the end goal. Before opening any tool, decide what the final deliverable looks like: a single PDF for email, multiple split files for a portal, optimized images for a slide deck, or a packaged set for archiving. Naming the output up front prevents the most common workflow mistake, which is running operations in the wrong order and re-doing work."),
          e("Next, prepare your inputs. Group the source files in a single folder, give them clear names, and remove anything that is not part of the deliverable. Once the inputs are clean, open ") + blogToolLink(t1) + e(" and drag the files directly into the dropzone. The interface accepts multi-file selection where applicable and keeps order under your control."),
          e("Run the primary action. The core operation associated with " + kw + " usually completes in a few seconds for typical document sizes. Watch the status line for confirmation and, when applicable, preview thumbnails before moving on. If output looks correct, download the result; if not, adjust ordering or settings and re-run rather than chaining unrelated tools."),
          e("If the deliverable still needs work, branch into a follow-up tool. Common follow-ups include ") +
            blogToolLink(t2) +
            e(" for size optimization and ") +
            blogToolLink(t3) +
            e(" for page-level adjustments. Keep each step independent and validated; that is what makes the entire " + kw + " process repeatable across team members and over time."),
          e("Finish with a quick verification pass. Open the exported file in the browser preview, scroll the full document, and confirm headings, page order, and image quality. A 30-second check at the end of the workflow saves significantly more time than the rare bug it catches."),
        ],
      },
      {
        id: "common-mistakes",
        heading: "Common mistakes when working with " + kw,
        paragraphs: [
          e("The most frequent mistake is converting too early. Users sometimes export a file to JPG or run an aggressive compression before the structure is final, which forces them to redo work after every late edit. Treat conversion and compression as the last steps in the chain, not the first."),
          e("Another mistake is skipping ordering. Drag-and-drop interfaces make it tempting to push files through quickly, but a wrong sequence in a merge or split job propagates into every downstream step. Take ten extra seconds inside ") + blogToolLink(t1) + e(" to confirm the order before running the action."),
          e("Mixing unrelated source formats inside one job is also common. " + kwCap + " works best when inputs are uniform; for example, mixing scanned images with vector PDFs without a clear plan will produce inconsistent output sizes. If you need to combine source types, normalize them first using ") + blogToolLink(t2) + e(" or a sibling tool."),
          e("Finally, many users forget to validate the output on the actual device or platform where it will be used. A document that looks correct in the browser preview can still fail an email size limit or a portal upload check. Always test against the real constraint before declaring a task complete."),
          e("A subtler mistake is treating " + kw + " as a one-shot operation when it is really a recurring task. If the same job appears every week, invest five minutes in standardising the inputs, the tool, and the verification step. The first standardised run feels slower, but every following run becomes dramatically faster and more reliable."),
        ],
      },
      {
        id: "best-practices",
        heading: "Best practices for " + kw,
        paragraphs: [
          e("Build a one-screen routine. The fastest " + kw + " workflows fit into a single browser tab without scrolling: dropzone, action button, status line, and download. Locking in this layout removes mental overhead on repeat tasks and lowers the chance of clicking the wrong control."),
          e("Use clear, predictable file names. Names like contract-final-v3.pdf are dramatically easier to merge correctly than generic camera or scanner names. Pair this with a small naming convention shared across the team and the same convention works inside ") + blogToolLink(t1) + e(" without any extra setup."),
          e("Stage your operations. Run merge or assembly first, validate, then run optimization. This keeps each step measurable and lets you isolate any quality issue to one phase. Pair it with ") + blogToolLink(t2) + e(" only when a real constraint demands it, instead of as a default step."),
          e("Document the workflow once. After running " + kw + " a handful of times, write down the exact sequence and link the relevant tools and guides. Sharing that two-paragraph note inside a team channel produces an immediate productivity bump and reduces support questions for the people who run the same task on a recurring basis."),
          e("Audit the workflow on a quarterly cadence. Tools evolve, source formats drift, and team needs shift. A short review keeps the steps fresh and identifies stages that can be removed entirely. Most " + kw + " routines can be simplified after the first audit because some early caution becomes unnecessary once the team is comfortable with the core tooling."),
        ],
      },
      {
        id: "alternatives",
        heading: "Alternatives and when to switch",
        paragraphs: [
          e("Browser-based tools are not the only option, and there are real cases where a different approach fits better. Heavy desktop suites can be useful for complex layout, advanced redaction, or commercial print preparation. They typically come with a setup cost and license, but for specialized tasks the trade-off is worth it."),
          e("Server-based cloud platforms can also fit specific scenarios, especially when many users need a centralized audit trail or when integrations with storage providers and DMS systems are mandatory. The trade-off is upload time and the policy work required to handle file transfers safely."),
          e("In most everyday " + kw + " jobs, however, a focused browser tool such as ") + blogToolLink(t1) + e(" is the right default because it removes installation, account, and upload steps. Switching only happens when a hard requirement appears: enterprise compliance, deep PDF editing, or extremely large batch processing."),
          e("Even in those cases, the JoinMyPDF tools remain useful as a pre-stage. You can prepare files quickly with ") + blogToolLink(t2) + e(" and ") + blogToolLink(t3) + e(", and only push the cleaned-up output into the heavier system. That keeps the routine work fast and the specialized system focused on what only it can do."),
          e("A practical decision rule helps: if the next " + kw + " task is something you will repeat at least monthly, optimise for speed and pick the lightest-weight tool that gets the job done. If the task is rare but mission-critical, optimise for control and use the heaviest tool you have access to. Most teams overuse the second rule and underuse the first."),
        ],
      },
      {
        id: "final-thoughts",
        heading: "Final thoughts on " + kw,
        paragraphs: [
          e("The biggest win from a structured " + kw + " process is not any single tool, it is the habit of running operations in a clear order. Once that habit is in place, the choice of tool becomes a small implementation detail rather than the bottleneck."),
          e("Start small. Pick one recurring task you run this week, build the workflow around ") + blogToolLink(t1) + e(", and write down the exact steps. The next time the same task appears, the steps will be ready and the run will take a fraction of the original time."),
          e("If you want to keep going, branch into ") +
            (otherPost ? blogPostLink(otherPost) : e("the other guides in this section")) +
            e(" or open the related tools listed below. Every page is built with the same structure, so the time spent learning one workflow transfers cleanly to the next."),
          e("One last note: a clean " + kw + " process is also a great onboarding asset. New colleagues can read this guide, follow the linked tools, and ship their first deliverable on the same day. That is what makes a small workflow improvement compound into a long-term team advantage rather than staying as a one-person trick."),
        ],
      },
    ];
    return sections;
  }

  function buildBlogTocHtml(sections) {
    if (!sections || !sections.length) return "";
    const items = sections
      .map((s) => '<li><a href="#' + s.id + '">' + escapeHtml(s.heading) + "</a></li>")
      .join("");
    return (
      '<aside class="glass card" aria-label="Table of contents" style="margin:0 0 1rem;">' +
      '<h3 style="margin:0 0 .5rem;">Table of contents</h3>' +
      '<ol style="margin:0;padding-left:1.2rem;">' +
      items +
      "</ol></aside>"
    );
  }

  function buildBlogCtaHtml(primaryTool) {
    if (!primaryTool) return "";
    return (
      '<aside class="glass card" aria-label="Try JoinMyPDF" style="margin:1.2rem 0;text-align:center;">' +
      '<h3 style="margin:0 0 .4rem;">Try JoinMyPDF Free</h3>' +
      '<p style="margin:0 0 .8rem;">Open ' +
      escapeHtml(primaryTool.title) +
      " in your browser and run the workflow in seconds. No upload, no signup.</p>" +
      '<a class="btn btn--primary" href="/tools/' +
      primaryTool.slug +
      '/">Open ' +
      escapeHtml(primaryTool.title) +
      " →</a></aside>"
    );
  }

  function buildExistingBodyHtml(post) {
    if (!post.contentBlocks || !post.contentBlocks.body) return "";
    const raw = post.contentBlocks.body;
    const arr = Array.isArray(raw) ? raw : String(raw).split(/\n{2,}/);
    return arr
      .map((p) => String(p).trim())
      .filter(Boolean)
      .map((p) => "<p>" + escapeHtml(p) + "</p>")
      .join("");
  }

  function buildSectionsHtml(sections, ctaHtml) {
    let html = "";
    sections.forEach((section, idx) => {
      html +=
        '<section><h2 id="' +
        section.id +
        '">' +
        escapeHtml(section.heading) +
        "</h2>" +
        section.paragraphs.map((p) => "<p>" + p + "</p>").join("") +
        "</section>";
      if (idx === 1 && ctaHtml) html += ctaHtml;
    });
    return html;
  }

  function setBlogLastUpdated(blogTitle, post) {
    if (!blogTitle) return;
    const dateIso =
      post.lastUpdated || post.dateModified || post.publishDate || post.datePublished || blogTodayIso();
    const dateText = blogFormatDateLong(dateIso);
    if (!dateText) return;
    let metaP = document.getElementById("blogMeta");
    if (!metaP) {
      metaP = document.createElement("p");
      metaP.id = "blogMeta";
      metaP.style.margin = "0.4rem 0 0";
      metaP.style.fontSize = "0.9rem";
      const parent = blogTitle.parentNode;
      if (parent) parent.insertBefore(metaP, blogTitle.nextSibling);
    }
    metaP.textContent = "Last Updated: " + dateText;
  }

  function renderBlogPage(registry, blogRegistry, pathname) {
    const slug = slugFromPath(pathname);
    const posts = blogRegistry && blogRegistry.blog ? blogRegistry.blog : [];
    const post = posts.find((entry) => entry.slug === slug);
    if (!post) return;
    const relatedTools = registry.tools.filter((tool) => (post.relatedTools || []).includes(tool.slug));
    let relatedPosts = posts.filter((entry) => entry.slug !== post.slug && entry.cluster === post.cluster);
    if (post.relatedBlogs && post.relatedBlogs.length) {
      const explicit = post.relatedBlogs
        .map((slug) => posts.find((entry) => entry.slug === slug))
        .filter(Boolean);
      const fallbackSameCluster = relatedPosts.filter(
        (entry) => !explicit.some((item) => item.slug === entry.slug)
      );
      relatedPosts = explicit.concat(fallbackSameCluster);
    }
    relatedPosts = relatedPosts.slice(0, 4);
    if (relatedPosts.length < 2) {
      const fallback = getSortedBlogPosts(blogRegistry)
        .filter((entry) => entry.slug !== post.slug && !relatedPosts.some((item) => item.slug === entry.slug))
        .slice(0, 4 - relatedPosts.length);
      relatedPosts = relatedPosts.concat(fallback);
    }
    const faq = buildBlogFaq(post, relatedTools);
    const sections = buildLongFormSections(post, relatedTools, relatedPosts);
    const primaryTool = relatedTools[0] || null;
    const ctaHtml = buildBlogCtaHtml(primaryTool);
    const tocHtml = buildBlogTocHtml(sections);
    const existingBodyHtml = buildExistingBodyHtml(post);
    const sectionsHtml = buildSectionsHtml(sections, ctaHtml);

    const description =
      (post.seo && post.seo.metaDescription)
        ? post.seo.metaDescription
        : "Learn " + post.keyword + " with a practical guide, linked tools, and workflow tips from JoinMyPDF.";

    const blogTitle = document.getElementById("blogTitle");
    const blogIntro = document.getElementById("blogIntro");
    const blogContent = document.getElementById("blogContent");
    const blogToolLinks = document.getElementById("blogToolLinks");
    const relatedBlogLinks = document.getElementById("relatedBlogLinks");
    const blogFaq = document.getElementById("blogFaq");

    if (blogTitle) {
      blogTitle.textContent = post.title;
      setBlogLastUpdated(blogTitle, post);
    }
    if (blogIntro) {
      blogIntro.textContent = (post.contentBlocks && post.contentBlocks.intro)
        ? post.contentBlocks.intro
        : "This guide explains " +
          post.keyword +
          " with practical steps, tool recommendations, and SEO-friendly workflows.";
    }
    if (blogContent) {
      blogContent.innerHTML = tocHtml + existingBodyHtml + sectionsHtml;
    }
    if (blogToolLinks) {
      blogToolLinks.innerHTML = relatedTools
        .slice(0, 4)
        .map(
          (tool) =>
            '<a class="btn btn--ghost" href="/tools/' +
            tool.slug +
            '/">Try ' +
            escapeHtml(tool.title) +
            " -></a>"
        )
        .join("");
    }
    if (relatedBlogLinks) {
      relatedBlogLinks.innerHTML = relatedPosts
        .map((entry) => '<a href="/blog/' + entry.slug + '/">' + escapeHtml(entry.title) + "</a>")
        .join("");
    }
    if (blogFaq) renderFaq(blogFaq, faq);

    const baseUrl = (registry.site.baseUrl || "https://joinmypdf.com").replace(/\/+$/, "");
    const datePublished = post.publishDate || post.datePublished || blogTodayIso();
    const dateModified = post.lastUpdated || post.dateModified || datePublished;
    appendSchema({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description,
      url: baseUrl + pathname,
      mainEntityOfPage: { "@type": "WebPage", "@id": baseUrl + pathname },
      datePublished,
      dateModified,
      author: {
        "@type": "Organization",
        name: "JoinMyPDF",
        url: baseUrl + "/",
      },
      publisher: {
        "@type": "Organization",
        name: "JoinMyPDF",
        url: baseUrl + "/",
        logo: {
          "@type": "ImageObject",
          url: baseUrl + "/assets/brand/logo-icon.svg",
        },
      },
      keywords: [post.keyword, post.intentType, post.cluster].filter(Boolean).join(", "),
    });
    appendSchema({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((entry) => ({
        "@type": "Question",
        name: entry.q,
        acceptedAnswer: { "@type": "Answer", text: entry.a },
      })),
    });
  }

  function renderBlogIndex(registry, blogRegistry) {
    document.title = "JoinMyPDF Guides";
    ensureMeta(
      "description",
      "Browse the latest JoinMyPDF blog posts across tutorials, comparisons, and trust guides."
    );
    ensureCanonical("/blog/");
    const grid = document.getElementById("blogIndexGrid");
    if (grid) {
      grid.innerHTML = getSortedBlogPosts(blogRegistry)
        .slice(0, 60)
        .map(
          (post) =>
            '<article class="card glass"><h3>' +
            escapeHtml(post.title) +
            "</h3><p>" +
            escapeHtml(post.keyword) +
            '</p><div class="btn-row"><a class="btn btn--ghost" href="/blog/' +
            post.slug +
            '/">Read</a></div></article>'
        )
        .join("");
    }
    appendSchema({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "JoinMyPDF Guides",
      url: (registry.site.baseUrl || "https://joinmypdf.com").replace(/\/+$/, "") + "/blog/",
    });
  }

  function renderToolPage(registry, blogRegistry, pathname) {
    const resolved = findToolAndVariant(registry, pathname);
    if (!resolved.tool) return;
    const tool = resolved.tool;
    const variant = resolved.variant;
    const keyword = variant ? variant.keyword : tool.primaryKeyword;
    const title = (variant ? tool.title + " - " + keyword : tool.title + " | " + keyword) + " | JoinMyPDF";
    const description =
      (variant ? tool.title + " for searches like “" + keyword + "”. " : "") + (tool.description || tool.intent || "");
    document.title = title;
    ensureMeta("description", description);
    ensureCanonical(pathname);

    const heroTitle = document.getElementById("toolHeroTitle");
    const heroDesc = document.getElementById("toolHeroDesc");
    const howList = document.getElementById("howItWorks");
    const seoBody = document.getElementById("seoContent");
    const faqRoot = document.getElementById("faqContent");
    const comparisonRoot = document.getElementById("comparisonBlock");
    const useCasesRoot = document.getElementById("useCases");
    const relatedToolsRoot = document.getElementById("relatedTools");
    const usersAlsoRoot = document.getElementById("usersAlsoUse");
    const workflowRoot = document.getElementById("workflowLinks");
    const variantsRoot = document.getElementById("longTailLinks");
    const categoryLinksRoot = document.getElementById("categoryLinks");
    const toolBlogLinksRoot = document.getElementById("toolBlogLinks");
    const toolInput = document.getElementById("toolInput");
    const primaryAction = document.getElementById("primaryAction");
    const qualityRange = document.getElementById("qualityRange");
    const qualityLabel = document.getElementById("qualityLabel");

    if (heroTitle) heroTitle.textContent = variant ? tool.title + " — " + keyword : tool.title;
    if (heroDesc) heroDesc.textContent = tool.intent || "";
    if (howList) {
      const map = {
        merge: ["Upload two or more PDF files.", "Reorder file sequence.", "Click merge and download."],
        compress: ["Upload one PDF file.", "Set optimization level.", "Download the compressed file."],
        split: ["Upload one PDF file.", "Run split process.", "Download page-level outputs."],
        protect: ["Upload one PDF file.", "Enter and confirm your password.", "Download the protected PDF."],
        unlock: ["Upload a password-protected PDF.", "Enter the current password.", "Download the unlocked PDF."],
        redact: ["Upload a PDF.", "Drag black boxes over sensitive areas.", "Download the redacted PDF."],
        sign: ["Upload a PDF.", "Create and place your signature.", "Download the signed PDF."],
        "delete-pages": ["Upload a PDF.", "Mark page thumbnails to remove.", "Download the cleaned PDF."],
        "add-page-numbers": ["Upload a PDF.", "Choose position, start page, and format.", "Download the numbered PDF."],
        "jpg-to-pdf": ["Upload JPG/PNG images.", "Reorder image list.", "Create and download PDF."],
        "png-to-pdf": ["Upload PNG images.", "Reorder thumbnails if needed.", "Convert and download PDF."],
        "pdf-to-jpg": ["Upload one PDF.", "Render pages to JPG.", "Download image files."],
        "pdf-to-png": ["Upload one PDF.", "Export pages as PNG at 2× scale.", "Download pages or a ZIP archive."],
      };
      howList.innerHTML = (map[tool.operation] || map.merge).map((line) => "<li>" + escapeHtml(line) + "</li>").join("");
    }
    if (seoBody) {
      seoBody.innerHTML = buildSeoParagraphs(tool, variant).map((p) => "<p>" + escapeHtml(p) + "</p>").join("");
    }
    if (comparisonRoot) {
      comparisonRoot.innerHTML =
        "<ul>" +
        "<li><strong>Privacy:</strong> JoinMyPDF processes files locally, while many traditional tools require upload to remote servers.</li>" +
        "<li><strong>Speed:</strong> Browser-side execution avoids transfer overhead for common tasks and short workflows.</li>" +
        "<li><strong>No Upload Dependency:</strong> Users can complete " + escapeHtml(toolActionVerb(tool)) + " flows without waiting for server queues.</li>" +
        "<li><strong>Consistent UX:</strong> Every tool follows the same dropzone, status, and download pattern so you spend less time relearning controls.</li>" +
        "</ul>";
    }
    if (useCasesRoot) {
      useCasesRoot.innerHTML = (tool.useCases || []).map((item) => "<li>" + escapeHtml(item) + "</li>").join("");
    }

    const faqItems = buildFaq(tool, variant);
    if (faqRoot) renderFaq(faqRoot, faqItems);

    const graph = buildGraph(registry);
    const linked = (graph.find((entry) => entry.tool === tool.slug) || { links: [] }).links;
    const variants = generateClusterVariants(tool, registry);
    const siblingVariants = variant
      ? variants.filter((entry) => entry.slug !== variant.slug).slice(0, 8)
      : variants.slice(0, 8);

    if (relatedToolsRoot) {
      const parent = variant ? [{ slug: tool.slug, title: "Parent Tool: " + tool.title }] : [];
      relatedToolsRoot.innerHTML = parent
        .concat(linked.slice(0, 6))
        .map((item) => '<a href="/tools/' + item.slug + '/">' + escapeHtml(item.title) + "</a>")
        .join("");
    }
    if (usersAlsoRoot) {
      usersAlsoRoot.innerHTML = linked
        .slice(0, 4)
        .map((item) => '<a href="/tools/' + item.slug + '/">' + escapeHtml(item.primaryKeyword) + "</a>")
        .join("");
    }
    if (workflowRoot) {
      workflowRoot.innerHTML = linked
        .slice(0, 4)
        .map((item) => '<li><a href="/tools/' + item.slug + '/">' + escapeHtml(tool.title + " -> " + item.title) + "</a></li>")
        .join("");
    }
    if (variantsRoot) {
      variantsRoot.innerHTML = siblingVariants
        .map((entry) => '<a href="/tools/' + entry.slug + '/">' + escapeHtml(entry.keyword) + "</a>")
        .join("");
    }
    if (categoryLinksRoot) {
      categoryLinksRoot.innerHTML = registry.tools
        .filter((entry) => entry.category === tool.category && entry.slug !== tool.slug)
        .map((entry) => '<a href="/tools/' + entry.slug + '/">' + escapeHtml(entry.title) + "</a>")
        .join("");
    }
    if (toolBlogLinksRoot) {
      let posts = findRelatedBlogPosts(blogRegistry, tool.slug, null, 4);
      if (posts.length < 3) {
        const fallback = getSortedBlogPosts(blogRegistry)
          .filter((post) => !posts.some((item) => item.slug === post.slug))
          .slice(0, 3 - posts.length);
        posts = posts.concat(fallback);
      }
      toolBlogLinksRoot.innerHTML = posts
        .slice(0, 4)
        .map((post) => '<a href="/blog/' + post.slug + '/">' + escapeHtml(post.title) + "</a>")
        .join("");
    }

    if (toolInput) {
      const configByOp = {
        merge: {
          accept: (file) => /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name),
          minFilesForAction: 2,
          multiple: true,
          button: "Merge PDFs",
          run: async (files, helpers) => {
            const bytes = await PDFCore.mergePdfFiles(files);
            helpers.downloadBlob(new Blob([bytes], { type: "application/pdf" }), "joinmypdf-merged.pdf");
            helpers.setStatus("Merged " + files.length + " files.");
          },
        },
        compress: {
          accept: (file) => /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name),
          minFilesForAction: 1,
          multiple: false,
          button: "Compress PDF",
          run: async (files, helpers) => {
            const quality = qualityRange ? Number(qualityRange.value) / 100 : 0.75;
            const result = await PDFCore.compressSimulation(files[0], quality);
            helpers.downloadBlob(new Blob([result.bytes], { type: "application/pdf" }), "joinmypdf-compressed.pdf");
            helpers.setStatus("Estimated output ratio: " + Math.round(result.estimatedRatio * 100) + "%");
          },
        },
        split: {
          accept: (file) => /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name),
          minFilesForAction: 1,
          multiple: false,
          button: "Split PDF",
          run: async (files, helpers) => {
            const parts = await PDFCore.splitPdfFile(files[0]);
            parts.forEach((entry) => {
              helpers.downloadBlob(
                new Blob([entry.bytes], { type: "application/pdf" }),
                "joinmypdf-page-" + entry.page + ".pdf"
              );
            });
            helpers.setStatus("Split complete: " + parts.length + " file(s) exported.");
          },
        },
        "jpg-to-pdf": {
          accept: (file) => /^image\//i.test(file.type) || /\.(jpg|jpeg|png)$/i.test(file.name),
          minFilesForAction: 1,
          multiple: true,
          button: "Create PDF",
          run: async (files, helpers) => {
            const bytes = await PDFCore.jpgToPdf(files);
            helpers.downloadBlob(new Blob([bytes], { type: "application/pdf" }), "joinmypdf-images.pdf");
            helpers.setStatus("Created PDF from " + files.length + " image(s).");
          },
        },
        "png-to-pdf": {
          accept: (file) => /png$/i.test(file.type) || /\.png$/i.test(file.name),
          minFilesForAction: 1,
          multiple: true,
          button: "Convert to PDF",
          run: async (files, helpers) => {
            const bytes = await PDFCore.pngToPdf(files);
            helpers.downloadBlob(
              new Blob([bytes], { type: "application/pdf" }),
              PDFCore.pngToPdfOutputName(files),
            );
            helpers.setStatus("Created PDF from " + files.length + " PNG image(s).");
          },
        },
        "pdf-to-jpg": {
          accept: (file) => /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name),
          minFilesForAction: 1,
          multiple: false,
          button: "Export JPG Pages",
          run: async (files, helpers) => {
            const pages = await PDFCore.pdfToJpg(files[0], 1.3);
            pages.forEach((entry) => {
              helpers.downloadBlob(entry.blob, "joinmypdf-page-" + entry.page + ".jpg");
            });
            helpers.setStatus("Exported " + pages.length + " JPG file(s).");
          },
        },
        unlock: {
          accept: (file) => /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name),
          minFilesForAction: 1,
          multiple: false,
          button: "Unlock PDF",
          run: async (files, helpers) => {
            const unlockPassword = document.getElementById("unlockPassword");
            const unlockFormError = document.getElementById("unlockFormError");
            const password = unlockPassword ? unlockPassword.value : "";
            let encrypted = false;
            try {
              encrypted = await PDFCore.isPdfEncrypted(files[0]);
            } catch (_) {
              encrypted = false;
            }
            if (unlockFormError) {
              unlockFormError.classList.add("is-hidden");
              unlockFormError.textContent = "";
            }
            if (encrypted && !password) {
              if (unlockFormError) {
                unlockFormError.textContent = "Enter the current PDF password.";
                unlockFormError.classList.remove("is-hidden");
              }
              throw new Error("Enter the current PDF password.");
            }
            helpers.setStatus("Removing password protection…");
            try {
              const bytes = await PDFCore.unlockPdfFile(files[0], password);
              const base = files[0].name.replace(/\.pdf$/i, "") || "document";
              helpers.downloadBlob(new Blob([bytes], { type: "application/pdf" }), base + "-unlocked.pdf");
              helpers.setStatus("Unlocked PDF downloaded.");
            } catch (error) {
              if (error && error.name === "IncorrectPasswordError") {
                if (unlockFormError) {
                  unlockFormError.textContent = error.message || "Incorrect password. Please try again.";
                  unlockFormError.classList.remove("is-hidden");
                }
                helpers.setStatus("");
                return;
              }
              throw error;
            }
          },
        },
        protect: {
          accept: (file) => /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name),
          minFilesForAction: 1,
          multiple: false,
          button: "Protect PDF",
          run: async (files, helpers) => {
            const protectPassword = document.getElementById("protectPassword");
            const protectPasswordConfirm = document.getElementById("protectPasswordConfirm");
            const protectFormError = document.getElementById("protectFormError");
            const password = protectPassword ? protectPassword.value : "";
            const confirm = protectPasswordConfirm ? protectPasswordConfirm.value : "";
            if (protectFormError) {
              protectFormError.classList.add("is-hidden");
              protectFormError.textContent = "";
            }
            if (!password) {
              if (protectFormError) {
                protectFormError.textContent = "Enter a password.";
                protectFormError.classList.remove("is-hidden");
              }
              throw new Error("Enter a password.");
            }
            if (password.length < 4) {
              if (protectFormError) {
                protectFormError.textContent = "Use a password with at least 4 characters.";
                protectFormError.classList.remove("is-hidden");
              }
              throw new Error("Use a password with at least 4 characters.");
            }
            if (password !== confirm) {
              if (protectFormError) {
                protectFormError.textContent = "Passwords do not match.";
                protectFormError.classList.remove("is-hidden");
              }
              throw new Error("Passwords do not match.");
            }
            helpers.setStatus("Encrypting your PDF…");
            const bytes = await PDFCore.protectPdfFile(files[0], password);
            const base = files[0].name.replace(/\.pdf$/i, "") || "document";
            helpers.downloadBlob(new Blob([bytes], { type: "application/pdf" }), base + "-protected.pdf");
            helpers.setStatus("Protected PDF downloaded.");
          },
        },
      };
      const config = configByOp[tool.operation];
      if (!config) {
        if (primaryAction && tool.operation !== "redact" && tool.operation !== "sign" && tool.operation !== "delete-pages" && tool.operation !== "pdf-to-png" && tool.operation !== "add-page-numbers") {
          primaryAction.disabled = true;
          primaryAction.textContent = "Tool module coming soon";
        }
      } else if (tool.operation !== "redact" && tool.operation !== "sign" && tool.operation !== "delete-pages" && tool.operation !== "pdf-to-png" && tool.operation !== "add-page-numbers") {
        toolInput.multiple = !!config.multiple;
        if (primaryAction) primaryAction.textContent = config.button;
        const showQuality = tool.operation === "compress";
        const protectPanel = document.getElementById("protectPanel");
        const unlockPanel = document.getElementById("unlockPanel");
        if (qualityRange) qualityRange.classList.toggle("is-hidden", !showQuality);
        if (qualityLabel) qualityLabel.classList.toggle("is-hidden", !showQuality);
        UICore.createUploader({
          dropzoneId: "dropzone",
          inputId: "toolInput",
          listId: "fileList",
          previewId: "previewGrid",
          statusId: "statusText",
          primaryActionId: "primaryAction",
          clearActionId: "clearAction",
          minFilesForAction: config.minFilesForAction,
          accept: config.accept,
          onStateChange: function (files) {
            if (protectPanel) protectPanel.classList.toggle("is-hidden", !files.length);
            if (unlockPanel) unlockPanel.classList.toggle("is-hidden", !files.length);
          },
          onPrimaryAction: async function (files, helpers) {
            if ((tool.operation === "protect" || tool.operation === "unlock") && primaryAction) {
              primaryAction.classList.add("is-busy");
              primaryAction.disabled = true;
            }
            try {
              await config.run(files, helpers);
            } finally {
              if ((tool.operation === "protect" || tool.operation === "unlock") && primaryAction) {
                primaryAction.classList.remove("is-busy");
                primaryAction.disabled = files.length < config.minFilesForAction;
              }
            }
          },
        });
      }
    }

    appendSchema({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tool.title,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description,
      url: registry.site.baseUrl + pathname,
      featureList: [tool.primaryKeyword].concat(tool.secondaryKeywords || []),
    });
    appendSchema({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((entry) => ({
        "@type": "Question",
        name: entry.q,
        acceptedAnswer: { "@type": "Answer", text: entry.a },
      })),
    });
  }

  async function bootstrap() {
    const loaded = await Promise.all([loadRegistry(), loadBlogRegistry()]);
    const registry = loaded[0];
    const blogRegistry = loaded[1];
    const pageType = document.body.getAttribute("data-page");
    if (pageType === "home") return renderHomepage(registry, blogRegistry);
    if (pageType === "tool") return renderToolPage(registry, blogRegistry, window.location.pathname);
    if (pageType === "blog") return renderBlogPage(registry, blogRegistry, window.location.pathname);
    if (pageType === "blog-index") return renderBlogIndex(registry, blogRegistry);
  }

  window.SeoFactory = {
    bootstrap,
    loadRegistry,
    loadBlogRegistry,
    slugFromPath,
    buildGraph,
    generateClusterVariants,
  };

  document.addEventListener("DOMContentLoaded", function () {
    bootstrap().catch(function (error) {
      const status = document.getElementById("statusText");
      if (status) status.textContent = error.message;
    });
  });
})();
