import { absoluteUrl } from "./site";
import { getBrandName } from "./brand";
import type { ToolDefinition, ToolVariant } from "./types";

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
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

export function homeSoftwareApplicationLd(args: {
  locale: string;
  name: string;
  description: string;
  pathname: string;
}) {
  const { locale, name, description, pathname } = args;
  const priceCurrency = locale === "he" ? "ILS" : "USD";

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
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
      url: absoluteUrl(`/${locale}`),
    },
  };
}

export function softwareApplicationLd(args: {
  tool: ToolDefinition;
  variant: ToolVariant | null;
  pathname: string;
  description: string;
  locale?: string;
  name?: string;
  operatingSystem?: string;
  applicationCategory?: string;
}) {
  const { tool, variant, pathname, description, locale, name, operatingSystem, applicationCategory } = args;
  const appName = name || (variant ? `${tool.title} — ${variant.keyword}` : tool.title);
  const priceCurrency = locale === "he" ? "ILS" : "USD";

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: appName,
    applicationCategory: applicationCategory || "UtilitiesApplication",
    operatingSystem: operatingSystem || "Any (Web Browser)",
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

export function howToLd(args: {
  name: string;
  description: string;
  pathname: string;
  steps: { name: string; text: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: args.name,
    description: args.description,
    url: absoluteUrl(args.pathname),
    step: args.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      url: absoluteUrl(`${args.pathname}#howto-step-${index + 1}`),
    })),
    tool: [{ "@type": "HowToTool", name: "Web browser" }],
  };
}

/** Highlights local, no-upload performance for fast-converter SEO. */
export function localPerformanceAppLd(args: {
  name: string;
  description: string;
  toolPath: string;
  locale?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: args.name,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (Web Browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: args.locale === "he" ? "ILS" : "USD",
      availability: "https://schema.org/InStock",
    },
    isAccessibleForFree: true,
    description: args.description,
    url: absoluteUrl(args.toolPath),
    featureList: [
      ...(args.locale === "he"
        ? [
            "התחלה מיידית ללא העלאה",
            "עיבוד מקומי בדפדפן",
            "עובד אופליין אחרי טעינת הדף",
            "עיבוד אצווה ללא תור שרת",
            "ללא הגבלת העלאה לענן",
          ]
        : [
            "Instant start with no upload",
            "Local browser processing",
            "Works offline after page load",
            "Batch processing without server queue",
            "No cloud upload limits",
          ]),
    ],
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Processing mode",
        value: "Local-first, client-side",
      },
      {
        "@type": "PropertyValue",
        name: "Performance",
        value: "Zero upload latency; CPU-bound conversion",
      },
    ],
    provider: {
      "@type": "Organization",
      name: getBrandName(args.locale),
      url: absoluteUrl("/"),
    },
  };
}

/** Data-security / privacy-first positioning for local conversion tools. */
export function privacySecurityAppLd(args: {
  name: string;
  description: string;
  toolPath: string;
  locale?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: args.name,
    applicationCategory: "SecurityApplication",
    operatingSystem: "Any (Web Browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: args.locale === "he" ? "ILS" : "USD",
      availability: "https://schema.org/InStock",
    },
    isAccessibleForFree: true,
    description: args.description,
    url: absoluteUrl(args.toolPath),
    featureList: [
      ...(args.locale === "he"
        ? [
            "עיבוד מקומי ללא העלאת קבצים",
            "נתונים נשארים במכשיר המשתמש",
            "מפחית חשיפת מטא-דאטה EXIF",
            "תואם זרימות GDPR",
            "אין שמירת קבצים בשרת",
          ]
        : [
            "Local processing with no file uploads",
            "Data stays on the user device",
            "Reduces EXIF metadata exposure",
            "Supports GDPR-conscious workflows",
            "No server-side file retention",
          ]),
    ],
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Data security",
        value: "Client-side sandbox; no backend transfer for standard conversion",
      },
      {
        "@type": "PropertyValue",
        name: "Privacy model",
        value: "Privacy-first, local-only image conversion",
      },
    ],
    provider: {
      "@type": "Organization",
      name: getBrandName(args.locale),
      url: absoluteUrl("/"),
    },
  };
}

/** Multi-format / technical decode positioning for WebP, HEIC, and mixed-format crop workflows. */
export function technicalFormatAppLd(args: {
  name: string;
  description: string;
  toolPath: string;
  locale?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: args.name,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any (Web Browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: args.locale === "he" ? "ILS" : "USD",
      availability: "https://schema.org/InStock",
    },
    isAccessibleForFree: true,
    description: args.description,
    url: absoluteUrl(args.toolPath),
    featureList: [
      ...(args.locale === "he"
        ? [
            "חיתוך WebP מקומי בדפדפן",
            "תמיכה ב-HEIC/HEIF מאייפון",
            "חיתוך PNG עם שקיפות",
            "ללא המרה מוקדמת ל-JPEG",
            "פענוח מקומי ללא העלאה",
            "ייצוא PNG איכותי",
          ]
        : [
            "Local WebP crop in browser",
            "HEIC/HEIF support from iPhone",
            "PNG crop with transparency preserved",
            "No pre-conversion to JPEG required",
            "Client-side decode without upload",
            "High-quality PNG export",
          ]),
    ],
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Supported input formats",
        value: "JPEG, PNG, WebP, HEIC, HEIF, GIF",
      },
      {
        "@type": "PropertyValue",
        name: "Processing mode",
        value: "Browser-native decode; format-agnostic crop",
      },
    ],
    provider: {
      "@type": "Organization",
      name: getBrandName(args.locale),
      url: absoluteUrl("/"),
    },
  };
}

/** Lossless-quality / no server compression positioning for local image rotation workflows. */
export function losslessQualityAppLd(args: {
  name: string;
  description: string;
  toolPath: string;
  locale?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: args.name,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any (Web Browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: args.locale === "he" ? "ILS" : "USD",
      availability: "https://schema.org/InStock",
    },
    isAccessibleForFree: true,
    description: args.description,
    url: absoluteUrl(args.toolPath),
    featureList: [
      ...(args.locale === "he"
        ? [
            "סיבוב תמונה ללא אובדן איכות מקומי",
            "ללא דחיסה כפויה בשרת",
            "שמירה על PNG, WebP ו-HEIC",
            "ללא קידוד מחדש סמוי",
            "שליטה במטא-דאטה ופרופיל צבע",
            "עיבוד מקומי בדפדפן",
          ]
        : [
            "Local lossless image rotation",
            "No forced server-side compression",
            "Preserve PNG, WebP, and HEIC quality",
            "No hidden re-encode on export",
            "Metadata and color profile control",
            "Client-side browser processing",
          ]),
    ],
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Quality model",
        value: "Local-first; avoids generational loss from cloud re-encoding",
      },
      {
        "@type": "PropertyValue",
        name: "Processing mode",
        value: "Browser-native rotation without server bandwidth compression",
      },
    ],
    provider: {
      "@type": "Organization",
      name: getBrandName(args.locale),
      url: absoluteUrl("/"),
    },
  };
}
