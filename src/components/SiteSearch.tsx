"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { buildSiteSearchIndex, filterSearchIndex } from "@/lib/site-search";
import type { BlogRegistry, SiteRegistry } from "@/lib/types";

type SiteSearchProps = {
  variant: "hero" | "header";
  registry: SiteRegistry;
  blog: BlogRegistry;
};

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

type ResultsPanelProps = {
  results: ReturnType<typeof filterSearchIndex>;
  query: string;
  listId: string;
};

function ResultsPanel({ results, query, listId }: ResultsPanelProps) {
  const hasTools = results.tools.length > 0;
  const hasGuides = results.guides.length > 0;

  if (query.trim().length < 2) return null;

  if (!hasTools && !hasGuides) {
    return (
      <div className="site-search__dropdown site-search__dropdown--open" role="listbox" id={listId}>
        <p className="site-search__empty">No tools found</p>
      </div>
    );
  }

  return (
    <div className="site-search__dropdown site-search__dropdown--open" role="listbox" id={listId}>
      {hasTools ? (
        <div className="site-search__group">
          <p className="site-search__group-title">Tools</p>
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
          <p className="site-search__group-title">Guides &amp; Articles</p>
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
  const uid = useId().replace(/:/g, "");
  const inputId = `site-search-input-${variant}-${uid}`;
  const listId = `site-search-results-${variant}-${uid}`;
  const popoverId = `site-search-popover-${variant}-${uid}`;

  const index = useMemo(() => buildSiteSearchIndex(registry, blog), [registry, blog]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [resultsOpen, setResultsOpen] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(false);

  const results = useMemo(() => filterSearchIndex(index, query), [index, query]);
  const showResults =
    query.trim().length >= 2 && resultsOpen && (variant === "hero" || headerOpen);

  const clearResults = useCallback(() => {
    setResultsOpen(false);
    if (inputRef.current) inputRef.current.setAttribute("aria-expanded", "false");
  }, []);

  const closeAll = useCallback(() => {
    setResultsOpen(false);
    setHeaderOpen(false);
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
    if (variant === "header" && !headerOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const node = wrapRef.current;
      if (node && !node.contains(event.target as Node)) closeAll();
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [variant, headerOpen, closeAll]);

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

  const field = (
    <div className="site-search__wrap">
      <label className="site-search__label" htmlFor={inputId}>
        Search tools and guides
      </label>
      <div className="site-search__field">
        <span className="site-search__icon">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          id={inputId}
          className="site-search__input"
          type="search"
          value={query}
          placeholder="Search tools and guides…"
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showResults}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={onInputFocus}
        />
        <kbd className="site-search__kbd" aria-hidden="true">
          /
        </kbd>
      </div>
      {showResults ? <ResultsPanel results={results} query={query} listId={listId} /> : null}
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
        {field}
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="site-search site-search--header"
      data-site-search
      data-react-search="true"
      data-variant="header"
    >
      <button
        type="button"
        className="site-search__toggle"
        aria-label="Open search"
        aria-expanded={headerOpen}
        aria-controls={popoverId}
        onClick={() => {
          if (headerOpen) {
            setQuery("");
            clearResults();
            closeAll();
          } else {
            openHeader();
            requestAnimationFrame(() => inputRef.current?.focus());
          }
        }}
      >
        <SearchIcon />
      </button>
      <div
        id={popoverId}
        className={`site-search__popover${headerOpen ? " site-search__popover--open" : ""}`}
        aria-hidden={!headerOpen}
      >
        {field}
      </div>
    </div>
  );
}
