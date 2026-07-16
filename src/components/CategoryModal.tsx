"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { Link, usePathname } from "@/i18n/navigation";
import { ToolListIcon } from "@/components/ToolListIcon";
import { isNavItemActive } from "@/lib/nav-config";
import {
  buildAllToolsNav,
  buildCategoryNav,
  getCategoryTitleKey,
  type HeaderCategoryId,
} from "@/lib/tool-registry";

type CategoryModalProps = {
  open: boolean;
  activeCategory: HeaderCategoryId;
  onClose: () => void;
  onNavigate?: () => void;
};

type ToolBlockColumn = ReturnType<typeof buildCategoryNav>[number]["columns"][number];

/** Number of "core" tools shown before the Show all / Show less toggle appears. */
const DEFAULT_VISIBLE_TOOLS = 7;

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
        "category-modal__link group flex items-center gap-2 rounded-none",
        "text-lg font-mono text-neutral-400 transition-colors hover:text-white",
        isNavItemActive(pathname, item.href) && "is-active text-white",
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
    <section className="category-modal__block rounded-none" ref={sectionRef}>
      <h4 className="category-modal__block-title mb-3 text-base font-mono uppercase tracking-wider text-neutral-600">
        {column.label}
      </h4>
      <ul className="category-modal__list">
        {coreItems.map((item) => (
          <li key={item.slug}>{renderLink(item)}</li>
        ))}
        <AnimatePresence initial={false}>
          {expanded
            ? extraItems.map((item) => (
                <motion.li
                  key={item.slug}
                  className="category-modal__list-extra"
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
          className={clsx(
            "category-modal__toggle mt-4 rounded-none border-0 bg-transparent p-0",
            "text-sm font-mono text-blue-500 transition-colors hover:text-blue-300",
          )}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? `${collapseLabel} (${totalCount})` : `${showAllLabel} (${totalCount})`}
        </button>
      ) : null}
    </section>
  );
}

/**
 * Library side-drawer — slides in from the inline-end edge.
 * Content is the same category tool inventory previously shown as a centered modal.
 */
export function CategoryModal({ open, activeCategory, onClose, onNavigate }: CategoryModalProps) {
  const t = useTranslations("Header");
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const pathname = usePathname() || "/";
  const panelRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);

  const groups = useMemo(
    () => buildCategoryNav((key) => t(key as "nav.image"), activeCategory),
    [t, activeCategory],
  );

  const title = t(getCategoryTitleKey(activeCategory) as "nav.image");
  const isAllView = activeCategory === "all";
  const showAllLabel = t("allTools.showAll");
  const collapseLabel = t("allTools.collapse");

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
        ?.querySelector<HTMLElement>("button.category-modal__close, button, a")
        ?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, entered, activeCategory]);

  if (!mounted) return null;

  const drawer = (
    <div
      className={clsx(
        "category-modal category-modal--drawer",
        open && entered && "is-open",
        reduceMotion && "category-modal--reduce-motion",
      )}
      role="presentation"
      aria-hidden={!open}
    >
      <button
        type="button"
        className="category-modal__backdrop"
        aria-label={t("allTools.close")}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        className="category-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        {...(!open ? { inert: true } : {})}
      >
        <div className="category-modal__panel-header">
          <h2 id={titleId} className="category-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="category-modal__close"
            aria-label={t("allTools.close")}
            tabIndex={open ? 0 : -1}
            onClick={onClose}
          >
            <span className="category-modal__close-glyph" aria-hidden>
              ×
            </span>
          </button>
        </div>
        <div className="category-modal__body">
          <div className="category-modal__grid">
            {groups.map((group) => (
              <Fragment key={group.id}>
                {isAllView ? (
                  <h3
                    id={`${titleId}-${group.id}`}
                    className="category-modal__group-band font-mono uppercase tracking-wider text-neutral-600"
                  >
                    {group.label}
                  </h3>
                ) : null}
                {group.columns.map((column) => (
                  <ToolBlock
                    key={`${group.id}-${column.id}`}
                    column={column}
                    pathname={pathname}
                    showAllLabel={showAllLabel}
                    collapseLabel={collapseLabel}
                    onNavigate={onNavigate}
                    onClose={onClose}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
}

/** Crawlable tool links — always in DOM for SEO. */
export function CategorySeoNav() {
  const t = useTranslations("Header");
  const groups = useMemo(() => buildAllToolsNav((key) => t(key as "nav.image")), [t]);

  return (
    <nav className="sr-only" aria-label={t("allTools.seoNavLabel")}>
      {groups.map((group) => (
        <section key={group.id}>
          <h2>{group.label}</h2>
          {group.columns.map((column) => (
            <div key={column.id}>
              <h3>{column.label}</h3>
              <ul>
                {column.items.map((item) => (
                  <li key={item.slug}>
                    <Link href={item.href} prefetch={false}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </nav>
  );
}
