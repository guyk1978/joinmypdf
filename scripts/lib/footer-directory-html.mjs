/** Canonical 4-column footer markup for static HTML pages. */

export const FOOTER_DIRECTORY_INNER = `        <p class="site-footer__tagline">__TAGLINE__</p>
        <nav class="site-footer__directory" aria-label="Site directory">
          <div class="site-footer__col">
            <strong>Privacy &amp; security</strong>
            <a href="/privacy/">Privacy policy</a>
            <a href="/privacy-first-pdf-tools/">Privacy-first PDF hub</a>
          </div>
          <div class="site-footer__col">
            <strong>Comparisons</strong>
            <a href="/compare/">Tool comparisons</a>
          </div>
          <div class="site-footer__col">
            <strong>Guides &amp; tools</strong>
            <a href="/blog/">Guides</a>
            <a href="/tools/pdf-merge/">Merge PDF</a>
            <a href="/tools/pdf-compress/">Compress PDF</a>
          </div>
          <div class="site-footer__col site-footer__col--partners">
            <strong>Partner tools</strong>
            <a href="https://calnexapp.com/" target="_blank" rel="noopener noreferrer">Model Loan Repayments ➔ CalnexApp</a>
            <a href="https://mapdiagram.com/" target="_blank" rel="noopener noreferrer">Visualize your ideas → MapDiagram</a>
          </div>
        </nav>`;

export const FOOTER_TAGLINES = {
  default: "JoinMyPDF — browser-based PDF utilities with local processing.",
  tools: "JoinMyPDF — browser-based PDF tools with local processing.",
  blog: "JoinMyPDF Blog Factory",
  admin: "JoinMyPDF — programmatic SEO factory",
};

export function footerInnerForPath(filePath) {
  const norm = filePath.replace(/\\/g, "/");
  let tagline = FOOTER_TAGLINES.default;
  if (norm.includes("/blog/")) tagline = FOOTER_TAGLINES.blog;
  else if (norm.includes("/tools/")) tagline = FOOTER_TAGLINES.tools;
  else if (norm.includes("/admin/")) tagline = FOOTER_TAGLINES.admin;
  return FOOTER_DIRECTORY_INNER.replace("__TAGLINE__", tagline);
}

export function buildSiteFooter(filePath) {
  return `<footer class="site-footer">
      <div class="container">
${footerInnerForPath(filePath)}
      </div>
    </footer>`;
}
