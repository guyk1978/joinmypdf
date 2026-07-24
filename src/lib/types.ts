export type ToolFaq = { q: string; a: string };

export type ToolDocumentationFaq = {
  question: string;
  answer: string;
};

/** Long-form educational copy owned by the tool definition, not the interaction UI. */
export type ToolDocumentation = {
  /** Why this tool matters — editorial / SEO prose. */
  whyItMatters: string;
  faq: ToolDocumentationFaq[];
};

export type ToolVariant = {
  slug: string;
  keyword: string;
  modifier?: string;
  angle?: string;
  source?: string;
};

export type ImageToolSubCategory = "transform" | "convert" | "optimize";

export type ToolDefinition = {
  slug: string;
  category: string;
  subCategory?: ImageToolSubCategory;
  operation: string;
  title: string;
  primaryKeyword: string;
  intent: string;
  description: string;
  secondaryKeywords?: string[];
  useCases?: string[];
  relatedTools?: string[];
  /**
   * When false, the tool is an interactive generator (text/color/canvas) and
   * must open with the tool-specific active header — no upload gate.
   * When true/omitted, standard upload tools stay in clean phase until a file is present.
   */
  requiresUpload?: boolean;
  /**
   * @deprecated Prefer `documentation.faq`. Kept in sync for older consumers
   * that still read `q` / `a` pairs.
   */
  faq?: ToolFaq[];
  /** Educational copy + FAQ — single source of truth for tool docs. */
  documentation?: ToolDocumentation;
  longTailPages?: { slug: string; keyword: string; angle?: string; modifier?: string }[];
  skipClusterVariants?: boolean;
  priority?: number | null;
  longTailPriority?: number | null;
  updatedAt?: string;
};

export type CategoryDefinition = {
  slug: string;
  label: string;
  description: string;
};

export type SiteRegistry = {
  site: {
    name: string;
    baseUrl: string;
    defaultTitle?: string;
    defaultDescription?: string;
  };
  clusterDefaults?: {
    targetVariantCount?: number;
    modifiers?: string[];
  };
  categories: CategoryDefinition[];
  tools: ToolDefinition[];
};

export type BlogSection = {
  id: string;
  heading: string;
  level?: 2 | 3;
  type?: "methodology" | "workflow";
  paragraphs?: string[];
  list?: string[];
  limitations?: string[];
  table?: { headers: string[]; rows: string[][] };
};

export type BlogInternalLink = { href: string; anchor: string };

export type BlogAuthorMeta = {
  name?: string;
  role?: string;
  verifiedLabel?: string;
  avatarUrl?: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  keyword?: string;
  category?: string;
  /** Canonical sub-topic id, normally the primary related tool slug. */
  subCategory?: string;
  cluster?: string;
  intent?: string;
  intentType?: string;
  publishDate?: string;
  /** ISO date shown as Last Updated / dateModified when content is refreshed */
  updatedDate?: string;
  readTime?: string;
  coverImage?: string;
  author?: BlogAuthorMeta;
  tier1?: boolean;
  relatedTools?: string[];
  relatedBlogs?: string[];
  seo?: { metaTitle?: string; metaDescription?: string; keywords?: string };
  description?: string;
  contentBlocks?: {
    intro?: string;
    body?: string | string[];
    sections?: BlogSection[];
    faq?: ToolFaq[];
    internalLinks?: BlogInternalLink[];
    bestFor?: string;
    primaryTool?: string;
    primaryToolCtaLabel?: string;
    bottomCtaLabel?: string;
    editorialNote?: string;
    wordCount?: number;
    howTo?: {
      name?: string;
      description?: string;
      steps: { name: string; text: string }[];
    };
    privacySecuritySchema?: boolean;
    /** Emits SoftwareApplication schema highlighting multi-format local decode (WebP, HEIC, etc.). */
    technicalSoftwareSchema?: boolean;
    /** Emits SoftwareApplication schema highlighting lossless local rotation without server re-compression. */
    losslessQualitySchema?: boolean;
    /** Emits Article schema for format/workflow comparison content (e.g. HEIC vs JPG). */
    comparisonArticleSchema?: boolean;
    /** Emits TechArticle schema for developer-focused technical guides. */
    techArticleSchema?: boolean;
    /** Emits SoftwareApplication schema for developer utility tools (UA parser, JWT, etc.). */
    developerSoftwareSchema?: boolean;
  };
};

export type BlogRegistry = { blog: BlogPost[] };
