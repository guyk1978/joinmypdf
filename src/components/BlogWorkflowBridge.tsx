import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { ToolIconBadge } from "@/lib/tool-icons";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { registry } from "@/lib/registry";
import { imBtnCta } from "@/lib/design-system";
import type { BlogPost } from "@/lib/types";

type BlogWorkflowBridgeProps = {
  post: BlogPost;
};

export async function BlogWorkflowBridge({ post }: BlogWorkflowBridgeProps) {
  const t = await getTranslations("Blog");
  const tTools = await getTranslations("Tools");

  const primarySlug = post.contentBlocks?.primaryTool || post.relatedTools?.[0];
  if (!primarySlug) return null;

  const tool = registry.tools.find((entry) => entry.slug === primarySlug);
  if (!tool) return null;

  const toolLabel = translateToolItem(tTools, tool.slug, tool.title);
  const description =
    tool.description?.trim() ||
    post.contentBlocks?.intro?.trim() ||
    post.description?.trim() ||
    "";

  return (
    <section className="blog-workflow-bridge" aria-labelledby="blog-workflow-bridge-title">
      <div className="blog-workflow-bridge__inner">
        <div className="blog-workflow-bridge__copy">
          <p className="blog-workflow-bridge__eyebrow">{t("workflowBridgeEyebrow")}</p>
          <h2 id="blog-workflow-bridge-title" className="blog-workflow-bridge__title">
            {t("workflowBridgeTitle", { tool: toolLabel })}
          </h2>
          {description ? <p className="blog-workflow-bridge__desc">{description}</p> : null}
        </div>

        <Link
          href={`/tools/${tool.slug}/`}
          className={clsx(imBtnCta, "im-btn-cta--rounded blog-workflow-bridge__cta group flex items-center gap-2")}
          prefetch={false}
        >
          <ToolIconBadge slug={tool.slug} label={toolLabel} size="sm" className="blog-workflow-bridge__icon" />
          <span>{t("workflowBridgeCta", { tool: toolLabel })}</span>
          <ArrowUpRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
