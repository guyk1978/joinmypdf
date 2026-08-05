"use client";

import { clsx } from "clsx";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useOptionalToolModal } from "@/components/tool-modal/tool-modal-context";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { findToolsDataByPathname } from "@/data/tools-data";
import { normalizeHubPath } from "@/lib/tool-hierarchy";
import { useSearch, type ScoredSearchResult } from "@/hooks/useSearch";

type HeaderSearchProps = {
  /** `inline` = always-visible field (mobile drawer). `toggle` = icon → expand in header. */
  variant: "inline" | "toggle";
  /** Listen for Ctrl/Cmd+K and `/` when this media query matches (avoids dual mounts). */
  shortcutWhen?: string;
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
        <p className="site-search__hint">{t("pressEnterHint")}</p>
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
                result.type === "Tool"
                  ? "site-search__result-tag--tool"
                  : "site-search__result-tag--article",
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
      <p className="site-search__hint">{t("pressEnterHint")}</p>
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
  fieldClassName,
}: {
  inputId: string;
  resultsId: string;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  className?: string;
  autoFocus?: boolean;
  fieldClassName?: string;
}) {
  const t = useTranslations("Header.search");
  const router = useRouter();
  const toolModal = useOptionalToolModal();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [resultsOpen, setResultsOpen] = useState(false);
  const { flat, hasQuery } = useSearch(query);

  const navigateTo = useCallback(
    (result: ScoredSearchResult) => {
      onQueryChange("");
      setActiveIndex(-1);
      setResultsOpen(false);
      onClose();

      if (result.type === "Tool" && toolModal) {
        const matched = findToolsDataByPathname(result.path);
        if (matched) {
          toolModal.openToolModal({
            slug: matched.id,
            href: matched.href,
            title: matched.title || result.title,
            description: matched.description || result.description,
            categoryId: matched.category as InventoryCategoryId | undefined,
            returnHref: matched.category
              ? normalizeHubPath(matched.category as InventoryCategoryId)
              : "/",
          });
          return;
        }
      }

      router.push(result.path);
    },
    [onClose, onQueryChange, router, toolModal],
  );

  const navigateToSearchPage = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    onQueryChange("");
    setActiveIndex(-1);
    setResultsOpen(false);
    onClose();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }, [onClose, onQueryChange, query, router]);

  useEffect(() => {
    if (!autoFocus) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [autoFocus]);

  useEffect(() => {
    if (!resultsOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setResultsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [resultsOpen]);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      onQueryChange("");
      setActiveIndex(-1);
      setResultsOpen(false);
      inputRef.current?.blur();
      onClose();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && flat[activeIndex]) {
        navigateTo(flat[activeIndex]);
        return;
      }
      navigateToSearchPage();
      return;
    }

    if (!hasQuery || !flat.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flat.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? flat.length - 1 : prev - 1));
    }
  };

  return (
    <div ref={wrapRef} className={clsx("site-search__wrap", className)}>
      <label className="site-search__label" htmlFor={inputId}>
        {t("label")}
      </label>
      <div className={clsx("site-search__field", fieldClassName)}>
        <span className="site-search__icon" aria-hidden>
          <Search className="site-search__icon-svg" strokeWidth={2} />
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
          aria-expanded={resultsOpen && hasQuery}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setActiveIndex(-1);
            setResultsOpen(true);
          }}
          onFocus={() => setResultsOpen(true)}
          onKeyDown={onInputKeyDown}
        />
      </div>
      {resultsOpen ? (
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

/**
 * Header search — toggle icon expands a clean inline field (no Ctrl+K chrome).
 */
export function HeaderSearch({ variant, shortcutWhen }: HeaderSearchProps) {
  const t = useTranslations("Header.search");
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const resultsId = `${baseId}-results`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      if (prev) {
        setQuery("");
        return false;
      }
      return true;
    });
  }, []);

  useEffect(() => {
    if (!open || variant !== "toggle") return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [close, open, variant]);

  useEffect(() => {
    if (!shortcutWhen || variant !== "toggle") return;

    const media = window.matchMedia(shortcutWhen);

    const onKeyDown = (event: KeyboardEvent) => {
      if (!media.matches) return;

      const target = event.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((event.key === "k" || event.key === "K") && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (inField) return;
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [shortcutWhen, variant]);

  if (variant === "inline") {
    return (
      <div className="site-search site-search--header site-search--drawer" data-react-search="true">
        <SearchField
          inputId={inputId}
          resultsId={resultsId}
          query={query}
          onQueryChange={setQuery}
          onClose={() => setQuery("")}
          fieldClassName="site-search__field--drawer"
        />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={clsx(
        "site-search",
        "site-search--header",
        "site-search--icon-toggle",
        open && "site-search--icon-toggle-open",
      )}
      data-react-search="true"
    >
      <button
        type="button"
        className={clsx("site-search__toggle", open && "site-search__toggle--active")}
        aria-label={open ? t("close") : t("open")}
        aria-expanded={open}
        aria-controls={open ? `${baseId}-panel` : undefined}
        onClick={toggle}
      >
        {open ? (
          <X className="site-search__toggle-icon" aria-hidden strokeWidth={2} />
        ) : (
          <Search className="site-search__toggle-icon" aria-hidden strokeWidth={2} />
        )}
      </button>

      {open ? (
        <div id={`${baseId}-panel`} className="site-search__expand-panel">
          <SearchField
            inputId={inputId}
            resultsId={resultsId}
            query={query}
            onQueryChange={setQuery}
            onClose={close}
            autoFocus
            fieldClassName="site-search__field--expand"
          />
        </div>
      ) : null}
    </div>
  );
}
