"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createTranslator,
  useLocale,
  useTranslations,
  type AbstractIntlMessages,
} from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ToolModalWrapper } from "@/components/tool-modal/ToolModalWrapper";
import {
  ToolModalCalcFrame,
  ToolModalDocsPanel,
  ToolModalRelatedPanel,
} from "@/components/tool-modal/ToolModalPanels";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import {
  findToolsDataByPathname,
  getToolModalPath,
  getToolsDataEntry,
  normalizeToolPath,
} from "@/data/tools-data";
import {
  buildToolEmbedHref,
  getToolModalDocModel,
  getToolModalRelatedArticles,
  getToolModalRelatedTools,
  type ToolModalRelatedTool,
} from "@/lib/tool-modal-catalog";
import { localizeToolPresentation } from "@/lib/localize-tool-presentation";
import { resolveCanonicalToolSlug } from "@/lib/locale-tool-slugs";
import {
  normalizeHubPath,
  parseToolHierarchyPath,
  resolveToolHref,
} from "@/lib/tool-hierarchy";
import { resolveToolCategoryId } from "@/lib/category-accent-colors";
import type { ToolPageTranslator } from "@/lib/i18n-tool-page";

export type OpenToolModalOptions = {
  slug: string;
  href: string;
  title: string;
  description?: string;
  /** Parent category that opened this tool — drives accent theming. */
  categoryId?: InventoryCategoryId;
  /** Category hub (or other) URL to restore when closing. */
  returnHref?: string;
  calc?: ReactNode;
  docs?: ReactNode;
  related?: ReactNode;
  skipUrlSync?: boolean;
};

type ToolModalContextValue = {
  openToolModal: (options: OpenToolModalOptions) => void;
  closeToolModal: () => void;
  isOpen: boolean;
};

const ToolModalContext = createContext<ToolModalContextValue | null>(null);

export function useToolModal(): ToolModalContextValue {
  const ctx = useContext(ToolModalContext);
  if (!ctx) {
    throw new Error("useToolModal must be used within ToolModalProvider");
  }
  return ctx;
}

export function useOptionalToolModal(): ToolModalContextValue | null {
  return useContext(ToolModalContext);
}

function isEmbedRequest(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("embed") === "1";
}

/** Locale-prefixed path for the History API (no Next navigation). */
function toWindowPath(locale: string, appPath: string): string {
  const normalized = normalizeToolPath(appPath).replace(/\/$/, "") || "";
  return `/${locale}${normalized}`;
}

function homeWindowPath(locale: string): string {
  return `/${locale}`;
}

function resolveReturnAppPath(options: OpenToolModalOptions | null): string {
  if (options?.returnHref) return normalizeToolPath(options.returnHref);
  if (options?.categoryId) return normalizeHubPath(options.categoryId);
  return "/";
}

function toOpenOptionsFromSlug(
  slug: string,
  locale?: string,
): OpenToolModalOptions | null {
  const entry = getToolsDataEntry(slug);
  if (!entry) return null;
  const categoryId = resolveToolCategoryId(slug);
  return {
    slug: entry.id,
    href: categoryId
      ? resolveToolHref(entry.id, categoryId, locale)
      : getToolModalPath(entry),
    title: entry.title,
    description: entry.description || undefined,
    categoryId,
    returnHref: categoryId ? normalizeHubPath(categoryId) : undefined,
  };
}

function maskBackground(on: boolean) {
  if (typeof document === "undefined") return;
  if (on) document.documentElement.setAttribute("data-tool-modal-open", "1");
  else document.documentElement.removeAttribute("data-tool-modal-open");
}

export function ToolModalProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const t = useTranslations("ToolModal");
  const tTools = useTranslations("Tools");
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState<OpenToolModalOptions | null>(null);
  const [visible, setVisible] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [toolPageBundle, setToolPageBundle] = useState<{
    locale: string;
    messages: AbstractIntlMessages;
  } | null>(null);
  const closingRef = useRef(false);
  /** Soft History URL ownership — true when we pushed tool URL without Next navigation. */
  const softUrlRef = useRef(false);
  const returnHrefRef = useRef<string>("/");

  useEffect(() => {
    if (!active || toolPageBundle?.locale === locale) return;
    const controller = new AbortController();

    fetch(`/i18n/${locale}/tool-page.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`ToolPage locale asset returned ${response.status}`);
        }
        return response.json() as Promise<AbstractIntlMessages>;
      })
      .then((messages) => setToolPageBundle({ locale, messages }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Unable to load ToolPage locale asset", error);
      });

    return () => controller.abort();
  }, [active, locale, toolPageBundle?.locale]);

  const tPage = useMemo<ToolPageTranslator | undefined>(() => {
    if (!toolPageBundle || toolPageBundle.locale !== locale) return undefined;
    return createTranslator({
      locale,
      messages: { ToolPage: toolPageBundle.messages },
      namespace: "ToolPage",
    }) as ToolPageTranslator;
  }, [locale, toolPageBundle]);

  const localizeOptions = useCallback(
    (options: OpenToolModalOptions): OpenToolModalOptions => {
      const canonicalSlug = resolveCanonicalToolSlug(options.slug);
      const localized = localizeToolPresentation(canonicalSlug, tTools, {
        title: options.title,
        description: options.description,
      });
      const categoryId =
        options.categoryId ??
        parseToolHierarchyPath(options.href)?.categoryId ??
        resolveToolCategoryId(canonicalSlug);
      const href = normalizeToolPath(
        options.href ||
          (categoryId
            ? resolveToolHref(canonicalSlug, categoryId, locale)
            : `/tools/${canonicalSlug}/`),
      );
      return {
        ...options,
        slug: canonicalSlug,
        title: localized.title,
        description: localized.description || options.description,
        categoryId,
        href,
      };
    },
    [locale, tTools],
  );

  const applyActiveTool = useCallback(
    (options: OpenToolModalOptions) => {
      const localized = localizeOptions(options);
      const returnHref = resolveReturnAppPath(localized);
      returnHrefRef.current = returnHref;
      setActive({ ...localized, returnHref });
      setContentReady(Boolean(localized.calc));
      setVisible(true);
      maskBackground(true);
      if (typeof document !== "undefined" && localized.title) {
        document.title = `${localized.title} | JoinMyPDF`;
      }
    },
    [localizeOptions],
  );

  const softPushToolUrl = useCallback(
    (href: string, slug: string, returnHref: string) => {
      if (typeof window === "undefined") return;
      const nextUrl = toWindowPath(locale, href);
      const current = window.location.pathname.replace(/\/$/, "");
      if (current === nextUrl.replace(/\/$/, "")) return;
      window.history.pushState(
        { toolModal: slug, returnHref },
        "",
        nextUrl,
      );
      softUrlRef.current = true;
    },
    [locale],
  );

  const closeToolModal = useCallback(() => {
    closingRef.current = true;
    setVisible(false);
    setContentReady(false);
    maskBackground(false);

    const returnHref = returnHrefRef.current || "/";
    const onHardToolRoute = findToolsDataByPathname(pathname) != null;

    if (onHardToolRoute) {
      softUrlRef.current = false;
      router.replace(returnHref === "/" ? "/" : returnHref, { scroll: false });
      return;
    }

    if (typeof window !== "undefined") {
      const target =
        returnHref === "/"
          ? homeWindowPath(locale)
          : toWindowPath(locale, returnHref);
      if (window.location.pathname.replace(/\/$/, "") !== target.replace(/\/$/, "")) {
        window.history.replaceState({ toolModal: null }, "", target);
      }
    }
    softUrlRef.current = false;
  }, [locale, pathname, router]);

  const openToolModal = useCallback(
    (options: OpenToolModalOptions) => {
      if (isEmbedRequest()) return;
      closingRef.current = false;
      const localized = localizeOptions(options);
      applyActiveTool(localized);
      if (!localized.skipUrlSync) {
        softPushToolUrl(localized.href, localized.slug, resolveReturnAppPath(localized));
      }
    },
    [applyActiveTool, localizeOptions, softPushToolUrl],
  );

  const handleExitComplete = useCallback(() => {
    if (!visible) {
      setActive(null);
      closingRef.current = false;
    }
  }, [visible]);

  // Deep link: mask + open before paint to avoid background flash.
  useLayoutEffect(() => {
    if (isEmbedRequest()) return;
    const matched = findToolsDataByPathname(pathname);
    if (!matched) return;
    const hierarchy = parseToolHierarchyPath(pathname);
    const categoryId =
      hierarchy?.categoryId ?? resolveToolCategoryId(matched.id);
    maskBackground(true);
    closingRef.current = false;
    softUrlRef.current = false;
    applyActiveTool({
      slug: matched.id,
      href: categoryId
        ? resolveToolHref(matched.id, categoryId, locale)
        : getToolModalPath(matched),
      title: matched.title,
      description: matched.description || undefined,
      categoryId,
      returnHref: categoryId ? normalizeHubPath(categoryId) : "/",
    });
  }, [pathname, applyActiveTool]);

  // Browser back/forward while soft URL is in history.
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      if (isEmbedRequest()) return;
      const matched = findToolsDataByPathname(window.location.pathname);
      if (matched) {
        closingRef.current = false;
        const hierarchy = parseToolHierarchyPath(window.location.pathname);
        const categoryId =
          hierarchy?.categoryId ?? resolveToolCategoryId(matched.id);
        const stateReturn =
          event.state && typeof event.state === "object" && "returnHref" in event.state
            ? String((event.state as { returnHref?: string }).returnHref || "")
            : "";
        applyActiveTool({
          slug: matched.id,
          href: categoryId
            ? resolveToolHref(matched.id, categoryId, locale)
            : getToolModalPath(matched),
          title: matched.title,
          description: matched.description || undefined,
          categoryId,
          returnHref:
            stateReturn ||
            (categoryId ? normalizeHubPath(categoryId) : "/"),
        });
        softUrlRef.current = true;
        return;
      }
      closingRef.current = true;
      softUrlRef.current = false;
      setVisible(false);
      setContentReady(false);
      maskBackground(false);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [applyActiveTool]);

  // Hard navigation away from a tool route (e.g. in-app link) closes the modal.
  useEffect(() => {
    if (isEmbedRequest()) return;
    if (softUrlRef.current) return;
    if (closingRef.current) return;

    const matched = findToolsDataByPathname(pathname);
    if (!matched && visible) {
      setVisible(false);
      setContentReady(false);
      maskBackground(false);
    }
  }, [pathname, visible]);

  useEffect(() => {
    if (!visible) maskBackground(false);
  }, [visible]);

  const value = useMemo(
    () => ({
      openToolModal,
      closeToolModal,
      isOpen: visible,
    }),
    [openToolModal, closeToolModal, visible],
  );

  const docModel = active
    ? getToolModalDocModel(active.slug, active.title, {
        locale,
        t: tPage,
        tTools,
        title: active.title,
        description: active.description,
      })
    : null;
  const relatedTools = active
    ? getToolModalRelatedTools(active.slug, 8, {
        locale,
        localize: (peerSlug, title, description) => {
          const localized = localizeToolPresentation(peerSlug, tTools, {
            title,
            description,
          });
          return {
            title: localized.title,
            description: localized.description || description,
          };
        },
      }).map((tool) => ({
        ...tool,
        href: resolveToolHref(
          tool.slug,
          active.categoryId ?? resolveToolCategoryId(tool.slug),
          locale,
        ),
      }))
    : [];
  const relatedArticles = active ? getToolModalRelatedArticles(active.slug) : [];
  const embedSrc = active ? buildToolEmbedHref(active.href, locale) : "";

  const openRelatedTool = useCallback(
    (tool: ToolModalRelatedTool) => {
      openToolModal({
        slug: tool.slug,
        href: tool.href,
        title: tool.title,
        description: tool.description,
        categoryId: active?.categoryId,
        returnHref: active?.returnHref,
      });
    },
    [openToolModal, active?.categoryId, active?.returnHref],
  );

  const loadingLabel = t("loading");

  return (
    <ToolModalContext.Provider value={value}>
      {children}
      {active && docModel ? (
        <ToolModalWrapper
          open={visible}
          title={active.title}
          description={active.description}
          slug={active.slug}
          categoryId={active.categoryId}
          onClose={closeToolModal}
          onExitComplete={handleExitComplete}
          contentReady={contentReady || Boolean(active.calc)}
          labels={{
            calc: t("calc"),
            doc: t("doc"),
            related: t("related"),
            close: t("close"),
            loading: loadingLabel,
            addFavorite: t("addFavorite"),
            removeFavorite: t("removeFavorite"),
            ratings: t("ratings", { count: "{count}" }),
            thankYou: t("thankYou"),
            rateAria: t("rateAria"),
            yourRatingAria: t("yourRatingAria", { rating: "{rating}" }),
            viewsNav: t("viewsNav"),
            enterFullScreen: t("enterFullScreen"),
            exitFullScreen: t("exitFullScreen"),
            showMagnifier: t("showMagnifier"),
            hideMagnifier: t("hideMagnifier"),
            inspectPreview: t.has("inspectPreview") ? t("inspectPreview") : "Inspect preview",
            magnifierSizeGroup: t.has("magnifierSizeGroup")
              ? t("magnifierSizeGroup")
              : "Magnifier size",
            magnifierSizeSmall: t.has("magnifierSizeSmall") ? t("magnifierSizeSmall") : "Small",
            magnifierSizeMedium: t.has("magnifierSizeMedium")
              ? t("magnifierSizeMedium")
              : "Medium",
            magnifierSizeHuge: t.has("magnifierSizeHuge") ? t("magnifierSizeHuge") : "Huge",
            pin: t("pin"),
            unpin: t("unpin"),
          }}
          calc={
            active.calc ?? (
              <ToolModalCalcFrame
                key={active.slug}
                src={embedSrc}
                title={active.title}
                loadingLabel={loadingLabel}
                onReadyChange={setContentReady}
              />
            )
          }
          docs={
            active.docs ?? (
              <ToolModalDocsPanel
                model={docModel}
                tPage={tPage}
                categoryId={active.categoryId}
                labels={{
                  overview: t("overview"),
                  howItWorks: t("howItWorks"),
                  useCases: t("useCases"),
                  faq: t("faq"),
                  keyword: t("keyword"),
                  loading: loadingLabel,
                  expandAll: t("expandAll"),
                  collapseAll: t("collapseAll"),
                  comingSoon: t("comingSoon"),
                }}
              />
            )
          }
          related={
            active.related ?? (
              <ToolModalRelatedPanel
                tools={relatedTools}
                articles={relatedArticles}
                onOpenTool={openRelatedTool}
                labels={{
                  toolsHeading: t("alsoCheckOut"),
                  articlesHeading: t("guidesArticles"),
                  empty: t("relatedEmpty"),
                }}
              />
            )
          }
        />
      ) : null}
    </ToolModalContext.Provider>
  );
}

export { toOpenOptionsFromSlug };
