"use client";

import { clsx } from "clsx";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FolderOpen, LayoutGrid, Play, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ToolListIcon } from "@/components/ToolListIcon";
import { useSavedProjects } from "@/hooks/useSavedProjects";
import { imBtnCta } from "@/lib/design-system";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { registry } from "@/lib/registry";

function formatDate(timestamp: number, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

export function ProjectsGrid({ locale }: { locale: string }) {
  const t = useTranslations("Projects");
  const tTools = useTranslations("Tools");
  const { projects, hydrated, removeProject } = useSavedProjects();

  const toolLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projects) {
      if (map.has(project.toolSlug)) continue;
      const tool = registry.tools.find((item) => item.slug === project.toolSlug);
      map.set(
        project.toolSlug,
        translateToolItem(tTools, project.toolSlug, tool?.title ?? project.toolSlug),
      );
    }
    return map;
  }, [projects, tTools]);

  if (!hydrated) {
    return <p className="product-page-meta text-center">{t("loading")}</p>;
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderOpen strokeWidth={1.75} />}
        title={t("emptyTitle")}
        description={t("emptyState")}
      >
        <Link href="/tools/" className={clsx(imBtnCta, "im-btn-cta--rounded inline-flex gap-2")} prefetch={false}>
          <LayoutGrid className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          {t("exploreAllTools")}
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="product-page-dashboard w-full">
      <p className="product-page-meta" aria-live="polite">
        {t("savedCount", { count: projects.length })}
      </p>

      <div className="projects-grid">
        {projects.map((project) => {
          const toolLabel = toolLabels.get(project.toolSlug) ?? project.toolSlug;
          return (
            <article key={project.id} className="project-card">
              <div className="project-card__header">
                <div className="project-card__icon" aria-hidden>
                  <ToolListIcon slug={project.toolSlug} label={toolLabel} />
                </div>
                <p className="project-card__tool">{toolLabel}</p>
                <h2 className="project-card__title">{project.name}</h2>
                <p className="project-card__meta">
                  {t("lastModified", { date: formatDate(project.updatedAt, locale) })}
                </p>
                <p className="project-card__files">
                  {t("fileCount", { count: project.fileRefs.length })}
                </p>
              </div>

              <div className="project-card__actions">
                <Link
                  href={`/tools/${project.toolSlug}/?project=${project.id}`}
                  className="project-card__resume"
                  prefetch={false}
                >
                  <Play className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  {t("resume")}
                </Link>
                <button
                  type="button"
                  className="project-card__delete"
                  aria-label={t("deleteProject", { name: project.name })}
                  onClick={() => void removeProject(project.id)}
                >
                  <Trash2 className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  {t("delete")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
