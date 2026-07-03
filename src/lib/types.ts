export type ToolFaq = { q: string; a: string };

export type ToolVariant = {
  slug: string;
  keyword: string;
  modifier?: string;
  angle?: string;
  source?: string;
};

export type ToolDefinition = {
  slug: string;
  category: string;
  operation: string;
  title: string;
  primaryKeyword: string;
  intent: string;
  description: string;
  secondaryKeywords?: string[];
  useCases?: string[];
  relatedTools?: string[];
  faq?: ToolFaq[];
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
  cluster?: string;
  intent?: string;
  intentType?: string;
  publishDate?: string;
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
  };
};

export type BlogRegistry = { blog: BlogPost[] };
