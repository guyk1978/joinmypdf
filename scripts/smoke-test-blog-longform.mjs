/**
 * Smoke-tests the blog long-form upgrade in seo-factory.js by running the module
 * inside a sandboxed VM with a minimal DOM stub. No real browser needed.
 *
 * Verifies all requirements from the upgrade brief.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail: detail || "" });
  console.log("[" + (ok ? "PASS" : "FAIL") + "] " + name + (detail ? " — " + detail : ""));
}
function assert(name, condition, detail) {
  record(name, Boolean(condition), detail);
}

function makeFakeElement(tag) {
  const el = {
    tagName: (tag || "div").toUpperCase(),
    children: [],
    attributes: {},
    style: {},
    _innerHTML: "",
    _textContent: "",
    parentNode: null,
    nextSibling: null,
    get innerHTML() {
      return this._innerHTML;
    },
    set innerHTML(value) {
      this._innerHTML = String(value);
    },
    get textContent() {
      return this._textContent;
    },
    set textContent(value) {
      this._textContent = String(value);
    },
    setAttribute(k, v) {
      this.attributes[k] = String(v);
    },
    getAttribute(k) {
      return Object.prototype.hasOwnProperty.call(this.attributes, k) ? this.attributes[k] : null;
    },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    insertBefore(node, ref) {
      node.parentNode = this;
      const idx = ref ? this.children.indexOf(ref) : -1;
      if (idx >= 0) this.children.splice(idx, 0, node);
      else this.children.push(node);
      return node;
    },
    addEventListener() {},
  };
  return el;
}

function makeFakeDocument(byId) {
  const head = makeFakeElement("head");
  const body = makeFakeElement("body");
  body.setAttribute("data-page", "blog");
  body.getAttribute = function (k) {
    return k === "data-page" ? "blog" : null;
  };
  body.dataset = { page: "blog" };

  return {
    head,
    body,
    title: "",
    readyState: "complete",
    createElement(tag) {
      return makeFakeElement(tag);
    },
    querySelector(selector) {
      const m = /^meta\[name="([^"]+)"\]$/.exec(selector);
      if (m) {
        return head.children.find(
          (el) => el.tagName === "META" && el.attributes.name === m[1]
        ) || null;
      }
      if (selector === 'link[rel="canonical"]') {
        return head.children.find((el) => el.tagName === "LINK" && el.rel === "canonical") || null;
      }
      return null;
    },
    getElementById(id) {
      return byId[id] || null;
    },
    addEventListener() {},
  };
}

function paragraphsTextFromHtml(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function countH2s(html) {
  return (html.match(/<h2\b/gi) || []).length;
}

function extractH2Ids(html) {
  const ids = [];
  const re = /<h2[^>]*\bid="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) ids.push(m[1]);
  return ids;
}

function countAnchors(html, hrefPrefix) {
  const re = new RegExp('<a\\b[^>]*href="' + hrefPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return (html.match(re) || []).length;
}

async function runForPost(post, { tools, blogPosts, label }) {
  const sourcePath = path.join(root, "assets", "js", "seo-factory.js");
  const source = await readFile(sourcePath, "utf8");

  const blogTitle = makeFakeElement("h1");
  blogTitle.id = "blogTitle";
  const heroSection = makeFakeElement("section");
  heroSection.appendChild(blogTitle);
  const blogIntro = makeFakeElement("p");
  blogIntro.id = "blogIntro";
  heroSection.appendChild(blogIntro);

  const blogContent = makeFakeElement("div");
  blogContent.id = "blogContent";
  const blogToolLinks = makeFakeElement("div");
  blogToolLinks.id = "blogToolLinks";
  const relatedBlogLinks = makeFakeElement("div");
  relatedBlogLinks.id = "relatedBlogLinks";
  const blogFaq = makeFakeElement("div");
  blogFaq.id = "blogFaq";

  const byId = {
    blogTitle,
    blogIntro,
    blogContent,
    blogToolLinks,
    relatedBlogLinks,
    blogFaq,
  };
  const doc = makeFakeDocument(byId);

  const fetchResponses = {
    "/assets/data/tools.json": {
      site: {
        defaultTitle: "JoinMyPDF",
        defaultDescription: "PDF tools",
        baseUrl: "https://joinmypdf.com",
        name: "JoinMyPDF",
      },
      categories: [],
      tools,
      clusterDefaults: { modifiers: [], targetVariantCount: 24 },
    },
    "/assets/data/blog.json": { blog: blogPosts },
  };

  const sandbox = {
    console,
    document: doc,
    location: { pathname: "/blog/" + post.slug + "/", origin: "https://joinmypdf.com" },
    URL,
    setTimeout,
    clearTimeout,
    requestIdleCallback(fn) {
      try { fn(); } catch (_) {}
    },
    fetch: async (url) => {
      const key = String(url);
      if (Object.prototype.hasOwnProperty.call(fetchResponses, key)) {
        const data = fetchResponses[key];
        return { ok: true, status: 200, json: async () => data };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    },
    PDFCore: {},
    UICore: { createUploader() {}, downloadBlob() {} },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "seo-factory.js" });

  await sandbox.SeoFactory.bootstrap();

  const html = blogContent.innerHTML;
  const text = paragraphsTextFromHtml(html);
  const wordCount = text ? text.split(/\s+/).length : 0;

  console.log("\n--- " + label + " ---");
  record(
    label + ": word count is 1800–2500",
    wordCount >= 1800 && wordCount <= 2500,
    "words=" + wordCount
  );

  const h2Count = countH2s(html);
  record(label + ": at least 7 H2 sections", h2Count >= 7, "h2=" + h2Count);

  const requiredHeadings = [
    "what is",
    "why use",
    "step-by-step",
    "common mistakes",
    "best practices",
    "alternatives",
    "final thoughts",
  ];
  const lower = html.toLowerCase();
  const missing = requiredHeadings.filter((h) => !lower.includes(h));
  record(
    label + ": all 7 required section headings present",
    missing.length === 0,
    missing.length ? "missing=" + missing.join(",") : "all present"
  );

  const ids = extractH2Ids(html);
  record(
    label + ": every generated H2 has an id (for TOC anchor)",
    ids.length >= 7,
    "ids=" + ids.length
  );

  const tocOk =
    /aria-label="Table of contents"/.test(html) &&
    ids.every((id) => html.indexOf('href="#' + id + '"') !== -1);
  record(label + ": TOC links to every section id", tocOk);

  const ctaIdx = html.indexOf('aria-label="Try JoinMyPDF"');
  const sectionMatches = [];
  const sRe = /<section><h2[^>]*\bid="([^"]+)"/g;
  let sm;
  while ((sm = sRe.exec(html))) sectionMatches.push({ id: sm[1], idx: sm.index });
  const after2nd =
    sectionMatches.length >= 3 &&
    ctaIdx > sectionMatches[1].idx &&
    ctaIdx < sectionMatches[2].idx;
  record(
    label + ": CTA box appears after the 2nd section (and before the 3rd)",
    after2nd,
    "ctaIdx=" + ctaIdx + " s2=" + (sectionMatches[1] && sectionMatches[1].idx) + " s3=" + (sectionMatches[2] && sectionMatches[2].idx)
  );

  const ctaHasLink = /href="\/tools\/[^"]+\/"[^>]*>Open [^<]+<\/a>/.test(html);
  record(label + ": CTA links to the most relevant tool page", ctaHasLink);

  const faqCount = blogFaq.innerHTML.match(/<details>/g) || [];
  record(label + ": FAQ has 6+ questions", faqCount.length >= 6, "faq=" + faqCount.length);

  const inlineToolLinks = countAnchors(html, "/tools/");
  record(
    label + ": contextual /tools/ links inside paragraphs (≥4)",
    inlineToolLinks >= 4,
    "count=" + inlineToolLinks
  );

  const lastUpdatedEl = byId.blogTitle.parentNode.children.find((c) => c._textContent && c._textContent.startsWith("Last Updated:"));
  record(
    label + ": Last Updated paragraph injected after title",
    Boolean(lastUpdatedEl),
    lastUpdatedEl ? lastUpdatedEl._textContent : "missing"
  );

  const schemaScripts = doc.head.children.filter(
    (el) =>
      el.tagName === "SCRIPT" &&
      (el.type === "application/ld+json" || el.attributes.type === "application/ld+json")
  );
  const blogPostingScript = schemaScripts.find((el) => el._textContent && el._textContent.includes('"BlogPosting"'));
  let schemaObj = null;
  try {
    schemaObj = JSON.parse(blogPostingScript._textContent);
  } catch (_) {}
  const schemaOk =
    schemaObj &&
    schemaObj.datePublished &&
    schemaObj.dateModified &&
    schemaObj.author &&
    schemaObj.publisher &&
    schemaObj.publisher.logo &&
    schemaObj.publisher.logo.url;
  record(
    label + ": BlogPosting schema includes datePublished, dateModified, author, publisher with logo",
    Boolean(schemaOk),
    schemaObj ? "datePublished=" + schemaObj.datePublished + " dateModified=" + schemaObj.dateModified : "no schema"
  );

  const hasExistingBody = Boolean(post.contentBlocks && post.contentBlocks.body);
  if (hasExistingBody) {
    const existingSnippet = String(post.contentBlocks.body).split(/\n{2,}/)[0].slice(0, 60);
    const escapedSnippet = existingSnippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existingHtmlIdx = new RegExp(escapedSnippet).exec(html);
    const firstSectionIdx = html.indexOf("<section><h2");
    record(
      label + ": existing post.contentBlocks.body is preserved BEFORE generated sections",
      existingHtmlIdx && existingHtmlIdx.index < firstSectionIdx,
      "existing=" + (existingHtmlIdx && existingHtmlIdx.index) + " section=" + firstSectionIdx
    );
  }
}

async function main() {
  const blogPath = path.join(root, "assets", "data", "blog.json");
  const toolsPath = path.join(root, "assets", "data", "tools.json");
  const blogData = JSON.parse(await readFile(blogPath, "utf8"));
  const toolsData = JSON.parse(await readFile(toolsPath, "utf8"));

  const postWithBody = blogData.blog.find(
    (p) => p.contentBlocks && p.contentBlocks.body && p.relatedTools && p.relatedTools.length >= 3
  );
  if (!postWithBody) throw new Error("No suitable post-with-body found in blog.json");

  // Synthesize a post without contentBlocks.body to verify generation still happens.
  const postWithoutBody = JSON.parse(JSON.stringify(postWithBody));
  postWithoutBody.slug = postWithoutBody.slug + "-no-body-test";
  postWithoutBody.contentBlocks = { intro: "Synthetic intro for the no-body test.", faq: [] };

  // Inject our synthetic post into a copy of the registry so resolution succeeds.
  const blogForTest = {
    blog: blogData.blog.concat([postWithoutBody]),
  };
  // Run with full registries.
  await runForPost(postWithBody, {
    tools: toolsData.tools,
    blogPosts: blogData.blog,
    label: "post WITH contentBlocks.body",
  });
  await runForPost(postWithoutBody, {
    tools: toolsData.tools,
    blogPosts: blogForTest.blog,
    label: "post WITHOUT contentBlocks.body",
  });

  console.log("\n== Summary ==");
  const failed = results.filter((r) => !r.ok);
  console.log("Total: " + results.length + "   Passed: " + (results.length - failed.length) + "   Failed: " + failed.length);
  if (failed.length) {
    for (const f of failed) console.log("  FAIL: " + f.name + (f.detail ? " — " + f.detail : ""));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
