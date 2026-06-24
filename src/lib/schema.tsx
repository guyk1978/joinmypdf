import { absoluteUrl } from "./site";
import { getBrandName } from "./brand";
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

function schemaFeatureList(locale?: string): string[] {
  if (locale === "he") {
    return [
      "ממוקד בפרטיות",
      "עיבוד מקומי בדפדפן",
      "ללא התקנה",
      "שימוש ללא הגבלה",
      "חינם לחלוטין",
      "ללא העלאת קבצים לשרת",
    ];
  }

  return [
    "Privacy-focused",
    "Local processing",
    "No installation required",
    "Unlimited usage",
    "Free",
    "No server uploads",
  ];
}

export function softwareApplicationLd(args: {
  tool: ToolDefinition;
  variant: ToolVariant | null;
  pathname: string;
  description: string;
  locale?: string;
  name?: string;
}) {
  const { tool, variant, pathname, description, locale, name } = args;
  const appName = name || (variant ? `${tool.title} — ${variant.keyword}` : tool.title);
  const priceCurrency = locale === "he" ? "ILS" : "USD";

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: appName,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (Web Browser)",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency,
      availability: "https://schema.org/InStock",
    },
    isAccessibleForFree: true,
    description,
    url: absoluteUrl(pathname),
    featureList: schemaFeatureList(locale),
    provider: {
      "@type": "Organization",
      name: getBrandName(locale),
      url: absoluteUrl("/"),
    },
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
  locale?: string;
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
    publisher: { "@type": "Organization", name: getBrandName(post.locale) },
  };
}
