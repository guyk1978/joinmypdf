import type { ToolPageTranslator } from "./i18n-tool-page";
import type { BlogPost } from "./types";

export function getRelatedGuideLinkLabel(post: BlogPost, t: ToolPageTranslator): string {
  const anchorKey = `relatedGuideAnchors.${post.slug}`;
  const topic = t.has(anchorKey) ? t(anchorKey) : post.keyword?.trim() || post.title;
  return t("relatedGuideLink", { topic });
}
