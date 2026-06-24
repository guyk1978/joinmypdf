"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { buildSiteSearchIndex, filterSearchIndex } from "@/lib/site-search";
import type { SearchEntry } from "@/lib/site-search";
import type { BlogRegistry, SiteRegistry } from "@/lib/types";

type SiteSearchProps = {
  variant: "hero" | "header" | "header-bar";
  registry: SiteRegistry;
  blog: BlogRegistry;
};

function toolSlugFromHref(href: string): string | undefined {
  const match = href.match(/\/tools\/([^/]+)/);
  return match?.[1];
}

function localizeSearchEntry(entry: SearchEntry, tTools: ReturnType<typeof useTranslations>): SearchEntry {
  if (entry.type !== "tool") return entry;

  const slug = toolSlugFromHref(entry.href);
  if (!slug) return entry;

  const title = translateToolItem(tTools, slug, entry.title);
  return {
    ...entry,
    title,
    keywords: `${entry.keywords} ${title}`,
  };
}

function SearchIcon({ className }: { className?: string }) {
  return <Search className={className ?? "site-search__icon-svg"} strokeWidth={2} aria-hidden="true" />;
}

type ResultsPanelProps = {
  results: ReturnType<typeof filterSearchIndex>;
  query: string;
  listId: string;
  inHeaderPanel?: boolean;
};

function ResultsPanel({ results, query, listId, inHeaderPanel }: ResultsPanelProps) {
  const t = useTranslations("Search");
  const hasTools = results.tools.length > 0;
  const hasGuides = results.guides.length > 0;

  if (query.trim().length < 2) return null;

  const dropdownClass = inHeaderPanel
    ? "site-search__dropdown site-search__dropdown--integrated site-search__dropdown--open"
    : "site-search__dropdown site-search__dropdown--open";

  if (!hasTools && !hasGuides) {
    return (
      <div className={dropdownClass} role="listbox" id={listId}>
        <p className="site-search__empty">{t("noResults")}</p>
      </div>
    );
  }

  return (
    <div className={dropdownClass} role="listbox" id={listId}>
      {hasTools ? (
        <div className="site-search__group">
          <p className="site-search__group-title">{t("toolsGroup")}</p>
          <ul className="site-search__list">
            {results.tools.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="site-search__result" role="option">
                  <span className="site-search__result-title">{item.title}</span>
                  {item.description ? (
                    <span className="site-search__result-desc">{item.description}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {hasGuides ? (
        <div className="site-search__group">
          <p className="site-search__group-title">{t("guidesGroup")}</p>
          <ul className="site-search__list">
            {results.guides.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="site-search__result" role="option">
                  <span className="site-search__result-title">{item.title}</span>
                  {item.description ? (
                    <span className="site-search__result-desc">{item.description}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function SiteSearch({ variant, registry, blog }: SiteSearchProps) {
  const t = useTranslations("Search");
  const tTools = useTranslations("Tools");
  const pathname = usePathname() || "/";

  const uid = useId().replace(/:/g, "");
  const inputId = `site-search-input-${variant}-${uid}`;
  const listId = `site-search-results-${variant}-${uid}`;
  const panelId = `site-search-panel-${variant}-${uid}`;

  const index = useMemo(() => {
    const base = buildSiteSearchIndex(registry, blog);
    return base.map((entry) => localizeSearchEntry(entry, tTools));
  }, [registry, blog, tTools]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [resultsOpen, setResultsOpen] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [mounted, setMounted] = useState(false);

  const results = useMemo(() => filterSearchIndex(index, query), [index, query]);
  const isInlineBar = variant === "header-bar";
  const showResults =
    query.trim().length >= 2 &&
    resultsOpen &&
    (variant === "hero" || isInlineBar || headerOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearResults = useCallback(() => {
    setResultsOpen(false);
    if (inputRef.current) inputRef.current.setAttribute("aria-expanded", "false");
  }, []);

  const closeAll = useCallback(() => {
    setQuery("");
    setResultsOpen(false);
    setHeaderOpen(false);
    setInputFocused(false);
    if (inputRef.current) inputRef.current.setAttribute("aria-expanded", "false");
  }, []);

  const openHeader = useCallback(() => {
    setHeaderOpen(true);
  }, []);

  const focusInput = useCallback(() => {
    if (variant === "header") {
      openHeader();
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      inputRef.current?.focus();
    }
  }, [variant, openHeader]);

  useEffect(() => {
    closeAll();
  }, [pathname, closeAll]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const editable = target?.isContentEditable;

      if (event.key === "Escape") {
        closeAll();
        return;
      }

      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (tag === "input" || tag === "textarea" || tag === "select" || editable) return;

      event.preventDefault();
      focusInput();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeAll, focusInput]);

  useEffect(() => {
    if (variant !== "header-bar") return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapRef.current?.contains(target)) return;
      clearResults();
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [variant, clearResults]);

  useEffect(() => {
    if (variant !== "header" || !headerOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      closeAll();
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [variant, headerOpen, closeAll]);

  useEffect(() => {
    if (variant !== "header") return;
    document.body.classList.toggle("site-search-open", headerOpen);
    return () => document.body.classList.remove("site-search-open");
  }, [variant, headerOpen]);

  const onInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (variant === "header") setHeaderOpen(true);
      const shouldShowResults = value.trim().length >= 2;
      setResultsOpen(shouldShowResults);
      if (inputRef.current) {
        inputRef.current.setAttribute("aria-expanded", shouldShowResults ? "true" : "false");
      }
    },
    [variant],
  );

  const onInputFocus = useCallback(() => {
    if (variant === "header") setHeaderOpen(true);
    if (query.trim().length >= 2) setResultsOpen(true);
  }, [variant, query]);

  const field = (inHeaderPanel?: boolean) => (
    <div className="site-search__wrap">
      <label className="site-search__label" htmlFor={inputId}>
        {t("label")}
      </label>
      <div
        className={`site-search__field site-search__field--glass${inHeaderPanel ? " site-search__field--palette" : ""}${isInlineBar ? " site-search__field--header-bar" : ""}`}
      >
        <span className="site-search__icon">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          id={inputId}
          className="site-search__input"
          type="search"
          value={query}
          placeholder={t("placeholder")}
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showResults}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={() => {
            setInputFocused(true);
            onInputFocus();
          }}
          onBlur={() => setInputFocused(false)}
        />
        {!query && !inputFocused ? (
          <kbd className="site-search__kbd" aria-hidden="true">
            /
          </kbd>
        ) : null}
      </div>
      {showResults ? (
        <ResultsPanel results={results} query={query} listId={listId} inHeaderPanel={inHeaderPanel} />
      ) : null}
    </div>
  );

  if (variant === "hero") {
    return (
      <div
        ref={wrapRef}
        className="site-search site-search--hero w-full max-w-full min-w-0"
        data-site-search
        data-react-search="true"
        data-variant="hero"
      >
        {field()}
      </div>
    );
  }

  if (variant === "header-bar") {
    return (
      <div
        ref={wrapRef}
        className="site-search site-search--header-bar w-full min-w-0"
        data-site-search
        data-react-search="true"
        data-variant="header-bar"
      >
        {field()}
      </div>
    );
  }

  const headerPanel =
    headerOpen && mounted
      ? createPortal(
          <>
            <button
              type="button"
              className="site-search__backdrop"
              aria-label={t("closeSearch")}
              onClick={closeAll}
            />
            <div
              ref={panelRef}
              id={panelId}
              className="site-search__palette site-search__palette--open"
              role="dialog"
              aria-modal="true"
              aria-label={t("label")}
            >
              <div className="site-search__palette-card">{field(true)}</div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        ref={wrapRef}
        className="site-search site-search--header relative flex h-full items-center"
        data-site-search
        data-react-search="true"
        data-variant="header"
      >
        <button
          type="button"
          className={`site-search__toggle${headerOpen ? " site-search__toggle--active" : ""}`}
          aria-label={headerOpen ? t("closeSearch") : t("openSearch")}
          aria-expanded={headerOpen}
          aria-controls={panelId}
          onClick={() => {
            if (headerOpen) {
              closeAll();
            } else {
              openHeader();
              requestAnimationFrame(() => inputRef.current?.focus());
            }
          }}
        >
          <SearchIcon className="site-search__toggle-icon" />
        </button>
      </div>
      {headerPanel}
    </>
  );
}
