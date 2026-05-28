import { absoluteUrl } from "./site";
import type { ToolDefinition, ToolVariant } from "./types";

export function JsonLd({ data }: { data: unknown }) {
  const serialized = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}

export function softwareApplicationLd(args: {
  tool: ToolDefinition;
  variant: ToolVariant | null;
  pathname: string;
  description: string;
}) {
  const { tool, variant, pathname, description } = args;
  const name = variant ? `${tool.title} — ${variant.keyword}` : tool.title;
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description,
    url: absoluteUrl(pathname),
  };
}

export function faqLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function blogPostingLd(post: {
  title: string;
  description: string;
  pathname: string;
  datePublished?: string;
  authorName?: string;
  authorRole?: string;
}) {
  const authorName = post.authorName || "Tomer";
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    url: absoluteUrl(post.pathname),
    datePublished: post.datePublished,
    author: {
      "@type": "Person",
      name: authorName,
      jobTitle: post.authorRole || "Web Tools Engineer",
    },
    publisher: { "@type": "Organization", name: "JoinMyPDF" },
  };
}
