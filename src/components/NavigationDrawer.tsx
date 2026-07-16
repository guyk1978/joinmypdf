"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bookmark, FolderOpen, LayoutGrid, Play, Trash2, X } from "lucide-react";
import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { Link, usePathname } from "@/i18n/navigation";
import { ToolListIcon } from "@/components/ToolListIcon";
import { useFavorites } from "@/hooks/useFavorites";
import { useSavedProjects } from "@/hooks/useSavedProjects";
import { isNavItemActive } from "@/lib/nav-config";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { registry } from "@/lib/registry";
import {
  buildCategoryNav,
  getCategoryTitleKey,
  type HeaderCategoryId,
} from "@/lib/tool-registry";

export type NavigationDrawerTab = "all-tools" | "favorites" | "projects";

export type NavigationDrawerProps = {
  open: boolean;
  activeTab: NavigationDrawerTab;
  activeCategory?: HeaderCategoryId;
  onTabChange: (tab: NavigationDrawerTab) => void;
  onClose: () => void;
  onNavigate?: () => void;
};

type ToolBlockColumn = ReturnType<typeof buildCategoryNav>[number]["columns"][number];

const DEFAULT_VISIBLE_TOOLS = 7;

const TABS: { id: NavigationDrawerTab; labelKey: "allTools" | "favorites" | "projects" }[] = [
  { id: "all-tools", labelKey: "allTools" },
  { id: "favorites", labelKey: "favorites" },
  { id: "projects", labelKey: "projects" },
];

function formatProjectDate(timestamp: number, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

function ToolBlock({
  column,
  pathname,
  showAllLabel,
  collapseLabel,
  onNavigate,
  onClose,
}: {
  column: ToolBlockColumn;
  pathname: string;
  showAllLabel: string;
  collapseLabel: string;
  onNavigate?: () => void;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const wasExpanded = useRef(false);

  const hasOverflow = column.items.length > DEFAULT_VISIBLE_TOOLS;
  const coreItems = hasOverflow ? column.items.slice(0, DEFAULT_VISIBLE_TOOLS) : column.items;
  const extraItems = hasOverflow ? column.items.slice(DEFAULT_VISIBLE_TOOLS) : [];
  const totalCount = column.items.length;

  useEffect(() => {
    if (wasExpanded.current && !expanded) {
      sectionRef.current?.scrollIntoView({
        block: "nearest",
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
    wasExpanded.current = expanded;
  }, [expanded, reduceMotion]);

  const renderLink = (item: ToolBlockColumn["items"][number]) => (
    <Link
      href={item.href}
      className={clsx(
        "nav-drawer__tool-link",
        isNavItemActive(pathname, item.href) && "is-active",
      )}
      prefetch={false}
      onClick={() => {
        onNavigate?.();
        onClose();
      }}
    >
      <ToolListIcon slug={item.slug} label={item.label} />
      <span>{item.label}</span>
    </Link>
  );

  return (
    <section className="nav-drawer__block" ref={sectionRef}>
      <h4 className="nav-drawer__block-title">{column.label}</h4>
      <ul className="nav-drawer__list">
        {coreItems.map((item) => (
          <li key={item.slug}>{renderLink(item)}</li>
        ))}
        <AnimatePresence initial={false}>
          {expanded
            ? extraItems.map((item) => (
                <motion.li
                  key={item.slug}
                  className="nav-drawer__list-extra"
                  initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                  animate={reduceMotion ? undefined : { opacity: 1, height: "auto" }}
                  exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {renderLink(item)}
                </motion.li>
              ))
            : null}
        </AnimatePresence>
      </ul>
      {hasOverflow ? (
        <button
          type="button"
          className="nav-drawer__toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? `${collapseLabel} (${totalCount})` : `${showAllLabel} (${totalCount})`}
        </button>
      ) : null}
    </section>
  );
}

function AllToolsPanel({
  category,
  onNavigate,
  onClose,
}: {
  category: HeaderCategoryId;
  onNavigate?: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("Header");
  const pathname = usePathname() || "/";
  const titleId = useId();
  const groups = useMemo(
    () => buildCategoryNav((key) => t(key as "nav.image"), category),
    [t, category],
  );
  const isAllView = category === "all";

  return (
    <div className="nav-drawer__panel-body">
      {category !== "all" ? (
        <p className="nav-drawer__section-label">
          {t(getCategoryTitleKey(category) as "nav.image")}
        </p>
      ) : null}
      <div className="nav-drawer__grid">
        {groups.map((group) => (
          <Fragment key={group.id}>
            {isAllView ? (
              <h3 id={`${titleId}-${group.id}`} className="nav-drawer__group-band">
                {group.label}
              </h3>
            ) : null}
            {group.columns.map((column) => (
              <ToolBlock
                key={`${group.id}-${column.id}`}
                column={column}
                pathname={pathname}
                showAllLabel={t("allTools.showAll")}
                collapseLabel={t("allTools.collapse")}
                onNavigate={onNavigate}
                onClose={onClose}
              />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function FavoritesPanel({
  onNavigate,
  onClose,
}: {
  onNavigate?: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("Favorites");
  const tTools = useTranslations("Tools");
  const { favoriteIds, hydrated, removeFavorite } = useFavorites();

  const items = useMemo(() => {
    return favoriteIds
      .map((slug) => {
        const tool = registry.tools.find((entry) => entry.slug === slug);
        if (!tool) return null;
        return {
          slug,
          href: `/tools/${slug}/`,
          label: translateToolItem(tTools, slug, tool.title),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item != null);
  }, [favoriteIds, tTools]);

  if (!hydrated) {
    return <p className="nav-drawer__empty-meta">{t("loading")}</p>;
  }

  if (!items.length) {
    return (
      <div className="nav-drawer__empty">
        <Bookmark className="nav-drawer__empty-icon" aria-hidden strokeWidth={1.5} />
        <p className="nav-drawer__empty-title">{t("emptyTitle")}</p>
        <p className="nav-drawer__empty-text">{t("emptyState")}</p>
      </div>
    );
  }

  return (
    <div className="nav-drawer__panel-body">
      <p className="nav-drawer__section-label" aria-live="polite">
        {t("savedCount", { count: items.length })}
      </p>
      <ul className="nav-drawer__list nav-drawer__list--favorites">
        {items.map((item) => (
          <li key={item.slug} className="nav-drawer__favorite-row">
            <Link
              href={item.href}
              className="nav-drawer__tool-link"
              prefetch={false}
              onClick={() => {
                onNavigate?.();
                onClose();
              }}
            >
              <ToolListIcon slug={item.slug} label={item.label} />
              <span>{item.label}</span>
            </Link>
            <button
              type="button"
              className="nav-drawer__icon-btn"
              aria-label={t("removeFromList")}
              onClick={() => removeFavorite(item.slug)}
            >
              <Trash2 size={14} strokeWidth={1.75} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectsPanel({
  onNavigate,
  onClose,
}: {
  onNavigate?: () => void;
  onClose: () => void;
}) {
  const locale = useLocale();
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
    return <p className="nav-drawer__empty-meta">{t("loading")}</p>;
  }

  if (!projects.length) {
    return (
      <div className="nav-drawer__empty">
        <FolderOpen className="nav-drawer__empty-icon" aria-hidden strokeWidth={1.5} />
        <p className="nav-drawer__empty-title">{t("emptyTitle")}</p>
        <p className="nav-drawer__empty-text">{t("emptyState")}</p>
      </div>
    );
  }

  return (
    <div className="nav-drawer__panel-body">
      <p className="nav-drawer__section-label" aria-live="polite">
        {t("savedCount", { count: projects.length })}
      </p>
      <ul className="nav-drawer__list nav-drawer__list--projects">
        {projects.map((project) => {
          const toolLabel = toolLabels.get(project.toolSlug) ?? project.toolSlug;
          return (
            <li key={project.id} className="nav-drawer__project-card">
              <div className="nav-drawer__project-head">
                <ToolListIcon slug={project.toolSlug} label={toolLabel} />
                <div className="nav-drawer__project-copy">
                  <p className="nav-drawer__project-tool">{toolLabel}</p>
                  <p className="nav-drawer__project-name">{project.name}</p>
                  <p className="nav-drawer__project-meta">
                    {t("lastModified", { date: formatProjectDate(project.updatedAt, locale) })}
                  </p>
                </div>
              </div>
              <div className="nav-drawer__project-actions">
                <Link
                  href={`/tools/${project.toolSlug}/?project=${project.id}`}
                  className="nav-drawer__project-resume"
                  prefetch={false}
                  onClick={() => {
                    onNavigate?.();
                    onClose();
                  }}
                >
                  <Play size={14} strokeWidth={1.75} aria-hidden />
                  {t("resume")}
                </Link>
                <button
                  type="button"
                  className="nav-drawer__icon-btn"
                  aria-label={t("deleteProject", { name: project.name })}
                  onClick={() => void removeProject(project.id)}
                >
                  <Trash2 size={14} strokeWidth={1.75} aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Unified site NavigationDrawer — All Tools / Favorites / Projects.
 * Industrial Matte side panel toggled from Header Library.
 */
export function NavigationDrawer({
  open,
  activeTab,
  activeCategory = "all",
  onTabChange,
  onClose,
  onNavigate,
}: NavigationDrawerProps) {
  const t = useTranslations("Header");
  const tDrawer = useTranslations("Header.drawer");
  const titleId = useId();
  const tabsId = useId();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setEntered(true));
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !entered) return;
    const frame = window.requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>(".nav-drawer__close, button, a")
        ?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, entered, activeTab]);

  if (!mounted) return null;

  const drawer = (
    <div
      className={clsx(
        "nav-drawer",
        open && entered && "is-open",
        reduceMotion && "nav-drawer--reduce-motion",
      )}
      role="presentation"
      aria-hidden={!open}
    >
      <button
        type="button"
        className="nav-drawer__backdrop"
        aria-label={t("allTools.close")}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        className="nav-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        {...(!open ? { inert: true } : {})}
      >
        <div className="nav-drawer__header">
          <div className="nav-drawer__header-row">
            <h2 id={titleId} className="nav-drawer__title">
              {tDrawer("title")}
            </h2>
            <button
              type="button"
              className="nav-drawer__close"
              aria-label={t("allTools.close")}
              tabIndex={open ? 0 : -1}
              onClick={onClose}
            >
              <X size={20} strokeWidth={2} aria-hidden />
            </button>
          </div>

          <div className="nav-drawer__tabs" role="tablist" aria-label={tDrawer("tabsLabel")}>
            {TABS.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`${tabsId}-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`${tabsId}-panel`}
                  className={clsx("nav-drawer__tab", selected && "is-active")}
                  tabIndex={open ? (selected ? 0 : -1) : -1}
                  onClick={() => onTabChange(tab.id)}
                >
                  {tab.id === "all-tools" ? (
                    <LayoutGrid size={14} strokeWidth={1.75} aria-hidden />
                  ) : null}
                  {tab.id === "favorites" ? (
                    <Bookmark size={14} strokeWidth={1.75} aria-hidden />
                  ) : null}
                  {tab.id === "projects" ? (
                    <FolderOpen size={14} strokeWidth={1.75} aria-hidden />
                  ) : null}
                  <span>{tDrawer(tab.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          id={`${tabsId}-panel`}
          className="nav-drawer__body"
          role="tabpanel"
          aria-labelledby={`${tabsId}-${activeTab}`}
        >
          {activeTab === "all-tools" ? (
            <AllToolsPanel
              category={activeCategory}
              onNavigate={onNavigate}
              onClose={onClose}
            />
          ) : null}
          {activeTab === "favorites" ? (
            <FavoritesPanel onNavigate={onNavigate} onClose={onClose} />
          ) : null}
          {activeTab === "projects" ? (
            <ProjectsPanel onNavigate={onNavigate} onClose={onClose} />
          ) : null}
        </div>
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
}
