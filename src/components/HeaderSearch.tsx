"use client";

import { clsx } from "clsx";
import { Search } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearch, type ScoredSearchResult } from "@/hooks/useSearch";

type HeaderSearchProps = {
  variant: "inline" | "toggle";
};

function SearchResults({
  id,
  query,
  activeIndex,
  onActiveIndexChange,
  onSelect,
}: {
  id: string;
  query: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onSelect: (result: ScoredSearchResult) => void;
}) {
  const t = useTranslations("Header.search");
  const { tools, articles, flat, hasQuery } = useSearch(query);

  if (!hasQuery) return null;

  if (!flat.length) {
    return (
      <div id={id} className="site-search__dropdown site-search__dropdown--open" role="listbox">
        <p className="site-search__empty">{t("emptyWithQuery", { query })}</p>
        <div className="site-search__empty-actions">
          <Link href="/tools/" className="site-search__empty-link" prefetch={false}>
            {t("suggestAllTools")}
          </Link>
          <Link href="/audio-tools/" className="site-search__empty-link" prefetch={false}>
            {t("suggestAudioTools")}
          </Link>
        </div>
      </div>
    );
  }

  let optionIndex = -1;

  const renderResult = (result: ScoredSearchResult) => {
    optionIndex += 1;
    const currentIndex = optionIndex;
    const isActive = currentIndex === activeIndex;

    return (
      <li key={`${result.type}-${result.path}`}>
        <Link
          href={result.path}
          className={clsx("site-search__result", isActive && "is-active")}
          role="option"
          aria-selected={isActive}
          prefetch={false}
          onMouseEnter={() => onActiveIndexChange(currentIndex)}
          onClick={(event) => {
            event.preventDefault();
            onSelect(result);
          }}
        >
          <span className="site-search__result-row">
            <span
              className={clsx(
                "site-search__result-tag",
                result.type === "Tool" ? "site-search__result-tag--tool" : "site-search__result-tag--article",
              )}
            >
              {result.type === "Tool" ? t("toolTag") : t("articleTag")}
            </span>
            <span className="site-search__result-title">{result.title}</span>
          </span>
          {result.description ? (
            <span className="site-search__result-desc">{result.description}</span>
          ) : (
            <span className="site-search__result-desc">{result.category}</span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <div id={id} className="site-search__dropdown site-search__dropdown--open" role="listbox">
      {tools.length ? (
        <div className="site-search__group">
          <p className="site-search__group-title">{t("toolsGroup")}</p>
          <ul className="site-search__list">{tools.map(renderResult)}</ul>
        </div>
      ) : null}
      {articles.length ? (
        <div className="site-search__group">
          <p className="site-search__group-title">{t("articlesGroup")}</p>
          <ul className="site-search__list">{articles.map(renderResult)}</ul>
        </div>
      ) : null}
    </div>
  );
}

function SearchField({
  inputId,
  resultsId,
  query,
  onQueryChange,
  onClose,
  className,
  autoFocus,
}: {
  inputId: string;
  resultsId: string;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  className?: string;
  autoFocus?: boolean;
}) {
  const t = useTranslations("Header.search");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [expanded, setExpanded] = useState(false);
  const { flat, hasQuery } = useSearch(query);

  const navigateTo = useCallback(
    (result: ScoredSearchResult) => {
      onQueryChange("");
      setActiveIndex(-1);
      setExpanded(false);
      onClose();
      router.push(result.path);
    },
    [onClose, onQueryChange, router],
  );

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setExpanded(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [expanded]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
      setExpanded(true);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      onQueryChange("");
      setActiveIndex(-1);
      setExpanded(false);
      inputRef.current?.blur();
      onClose();
      return;
    }

    if (!hasQuery || !flat.length) {
      if (event.key === "Enter") event.preventDefault();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flat.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? flat.length - 1 : prev - 1));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const target = activeIndex >= 0 ? flat[activeIndex] : flat[0];
      if (target) navigateTo(target);
    }
  };

  return (
    <div ref={wrapRef} className={clsx("site-search__wrap", className)}>
      <label className="site-search__label" htmlFor={inputId}>
        {t("label")}
      </label>
      <div className="site-search__field site-search__field--header-bar">
        <span className="site-search__icon" aria-hidden>
          <Search className="site-search__icon-svg" />
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
          enterKeyHint="search"
          aria-autocomplete="list"
          aria-controls={resultsId}
          aria-expanded={expanded && hasQuery}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setActiveIndex(-1);
            setExpanded(true);
          }}
          onFocus={() => setExpanded(true)}
          onKeyDown={onInputKeyDown}
        />
        <kbd className="site-search__kbd" aria-hidden>
          /
        </kbd>
      </div>
      {expanded ? (
        <SearchResults
          id={resultsId}
          query={query}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          onSelect={navigateTo}
        />
      ) : null}
    </div>
  );
}

export function HeaderSearch({ variant }: HeaderSearchProps) {
  const t = useTranslations("Header.search");
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const resultsId = `${baseId}-results`;
  const [query, setQuery] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    if (!paletteOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("site-search-open");
    return () => {
      document.body.style.overflow = previous;
      document.body.classList.remove("site-search-open");
    };
  }, [paletteOpen]);

  if (variant === "inline") {
    return (
      <div className="site-search site-search--header site-search--header-bar" data-react-search="true">
        <SearchField
          inputId={inputId}
          resultsId={resultsId}
          query={query}
          onQueryChange={setQuery}
          onClose={() => undefined}
        />
      </div>
    );
  }

  return (
    <div className="site-search site-search--header" data-react-search="true">
      <button
        type="button"
        className={clsx("site-search__toggle", paletteOpen && "site-search__toggle--active")}
        aria-label={t("open")}
        aria-expanded={paletteOpen}
        aria-controls={`${baseId}-palette`}
        onClick={() => setPaletteOpen((open) => !open)}
      >
        <Search className="site-search__toggle-icon" aria-hidden />
      </button>
      {paletteOpen ? (
        <>
          <button
            type="button"
            className="site-search__backdrop"
            aria-label={t("close")}
            onClick={() => {
              setPaletteOpen(false);
              setQuery("");
            }}
          />
          <div id={`${baseId}-palette`} className="site-search__palette site-search__palette--open" role="dialog" aria-modal="true">
            <div className="site-search__palette-card">
              <SearchField
                inputId={inputId}
                resultsId={resultsId}
                query={query}
                onQueryChange={setQuery}
                onClose={() => setPaletteOpen(false)}
                autoFocus
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
