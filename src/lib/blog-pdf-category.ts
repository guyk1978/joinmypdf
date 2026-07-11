import type { BlogPost } from "@/lib/types";
import { PDF_TOOL_IDS, type PdfToolId } from "@/lib/pdf-tools-hub";

function normalizeCategory(post: BlogPost): string {
  return (post.category || "").trim().toLowerCase();
}

function postHint(post: BlogPost): string {
  return `${post.slug} ${post.title} ${post.keyword || ""} ${post.description || ""}`.toLowerCase();
}

/** True when editorial category targets PDF guides. */
export function isPdfBlogPost(post: BlogPost): boolean {
  const category = normalizeCategory(post);
  if (category === "pdf" || category.includes("pdf")) {
    return true;
  }

  const relatedTools = post.relatedTools || [];
  if (relatedTools.some((slug) => PDF_TOOL_IDS.includes(slug as PdfToolId))) {
    return true;
  }

  if (
    relatedTools.some(
      (slug) =>
        slug.includes("pdf") ||
        slug.endsWith("-to-pdf") ||
        slug.startsWith("pdf-to-") ||
        slug === "unlock-pdf" ||
        slug === "rotate-pdf",
    )
  ) {
    return true;
  }

  const hint = postHint(post);
  if (/\b(favicon|mp3|json|yaml)\b/.test(hint) && !/\bpdf\b/.test(hint)) {
    return false;
  }

  return /\bpdf\b/.test(hint) || /\b(merge|split|compress).{0,12}pdf|pdf.{0,12}(merge|split|compress)\b/.test(hint);
}

export function getRecentPdfBlogPosts(posts: BlogPost[], limit = 3): BlogPost[] {
  return [...posts]
    .filter(isPdfBlogPost)
    .sort((a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""))
    .slice(0, limit);
}
