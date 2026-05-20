import type { BlogPost } from "./types";

export type ArticleAuthor = {
  name: string;
  role: string;
  verifiedLabel: string;
  avatarUrl?: string;
};

export const DEFAULT_ARTICLE_AUTHOR: ArticleAuthor = {
  name: "Tomer",
  role: "Web Tools Engineer",
  verifiedLabel: "Verified for Accuracy: 2026 Core Web Standards",
};

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function resolveArticleAuthor(post?: Pick<BlogPost, "author"> | null): ArticleAuthor & {
  initials: string;
} {
  const merged: ArticleAuthor = {
    ...DEFAULT_ARTICLE_AUTHOR,
    ...post?.author,
  };
  return {
    ...merged,
    initials: initialsFromName(merged.name) || "J",
  };
}
