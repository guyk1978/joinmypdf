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

export type BlogPost = {
  slug: string;
  title: string;
  keyword?: string;
  publishDate?: string;
  relatedTools?: string[];
  seo?: { metaTitle?: string; metaDescription?: string };
  description?: string;
  contentBlocks?: {
    intro?: string;
    body?: string | string[];
    faq?: ToolFaq[];
  };
};

export type BlogRegistry = { blog: BlogPost[] };
