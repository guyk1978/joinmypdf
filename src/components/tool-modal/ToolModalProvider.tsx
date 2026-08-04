"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import {
  createTranslator,
  useLocale,
  useTranslations,
  type AbstractIntlMessages,
} from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { ToolModalWrapper } from "@/components/tool-modal/ToolModalWrapper";
import {
  ToolModalCalcFrame,
  ToolModalDocsPanel,
  ToolModalRelatedPanel,
} from "@/components/tool-modal/ToolModalPanels";
import {
  ToolModalContext,
  EMPTY_TOOL_MODAL_ACTIONS,
  type OpenToolModalOptions,
  type ToolModalActions,
} from "@/components/tool-modal/tool-modal-context";
import type { ToolModalSessionValue, ToolModalTab } from "@/components/tool-modal/tool-modal-session-context";
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
import { toolPagePaneRailClassName } from "@/lib/tool-ui";
import { localizeToolPresentation } from "@/lib/localize-tool-presentation";
import { resolveCanonicalToolSlug } from "@/lib/locale-tool-slugs";
import {
  normalizeHubPath,
  parseToolHierarchyPath,
  resolveToolHref,
} from "@/lib/tool-hierarchy";
import { resolveToolAccentCategoryId, resolveToolCategoryId } from "@/lib/category-accent-colors";
import { toolRequiresUpload } from "@/lib/tool-interaction-mode";
import type { ToolPageTranslator } from "@/lib/i18n-tool-page";

export type { OpenToolModalOptions } from "@/components/tool-modal/tool-modal-context";
export {
  useOptionalToolModal,
  useToolModal,
} from "@/components/tool-modal/tool-modal-context";

const CommunityReviews = dynamic(
  () =>
    import("@/components/CommunityReviews").then((mod) => mod.CommunityReviews),
  { ssr: false },
);

function isEmbedRequest(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("embed") === "1";
}

/** Locale-prefixed path for the History API (no Next navigation). */
function toWindowPath(locale: string, appPath: string): string {
  const normalized = normalizeToolPath(appPath).replace(/\/$/, "") || "";
  return `/${locale}${normalized}`;
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

export function ToolModalProvider({
  children,
  pendingOpen = null,
}: {
  children: ReactNode;
  /** Queued open from DeferredToolModalProvider stub before this chunk loaded. */
  pendingOpen?: OpenToolModalOptions | null;
}) {
  const locale = useLocale();
  const t = useTranslations("ToolModal");
  const tTools = useTranslations("Tools");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  /** Library → Resume passes ?project= on the shell URL; forward into the CALC iframe. */
  const resumeProjectId = searchParams.get("project");
  const [active, setActive] = useState<OpenToolModalOptions | null>(null);
  const [visible, setVisible] = useState(false);
  const [sessionEpoch, setSessionEpoch] = useState(0);
  const [activeTab, setActiveTab] = useState<ToolModalTab>("calc");
  const sessionRef = useRef<ToolModalSessionValue | null>(null);
  const actionsRef = useRef<ToolModalActions>(EMPTY_TOOL_MODAL_ACTIONS);
  const [contentReady, setContentReadyState] = useState(false);
  /** Sticky ready for the current slug — ignore false flashes from iframe remounts. */
  const contentReadyStickyRef = useRef(false);
  const [toolPageBundle, setToolPageBundle] = useState<{
    locale: string;
    messages: AbstractIntlMessages;
  } | null>(null);
  const closingRef = useRef(false);
  /** Soft History URL ownership — true when we pushed tool URL without Next navigation. */
  const softUrlRef = useRef(false);
  const returnHrefRef = useRef<string>("/");
  /** Avoid resetting CALC ready state when deep-link / localize re-applies the same tool. */
  const activeSlugRef = useRef<string | null>(null);

  const resetContentReady = useCallback((ready = false) => {
    contentReadyStickyRef.current = ready;
    setContentReadyState(ready);
  }, []);

  const setContentReady = useCallback((ready: boolean) => {
    if (ready) {
      contentReadyStickyRef.current = true;
      setContentReadyState(true);
      return;
    }
    // Once the current tool has painted, ignore transient "not ready" from
    // CalcFrame src effects / visibility — prevents permanent "Loading tool…".
    if (contentReadyStickyRef.current) return;
    setContentReadyState(false);
  }, []);

  useEffect(() => {
    if (!active?.slug || toolPageBundle?.locale === locale) return;
    const controller = new AbortController();

    fetch(`/i18n/${locale}/tool-page.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`ToolPage locale asset returned ${response.status}`);
        }
        return response.json() as Promise<AbstractIntlMessages>;
      })
      .then((messages) => {
        setToolPageBundle((prev) => {
          if (prev?.locale === locale) return prev;
          return { locale, messages };
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Unable to load ToolPage locale asset", error);
      });

    return () => controller.abort();
  }, [active?.slug, locale, toolPageBundle?.locale]);

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
      const slugChanged = activeSlugRef.current !== localized.slug;
      activeSlugRef.current = localized.slug;
      setActive((prev) => {
        if (
          prev &&
          prev.slug === localized.slug &&
          prev.title === localized.title &&
          prev.href === localized.href &&
          prev.description === localized.description &&
          prev.returnHref === returnHref &&
          prev.categoryId === localized.categoryId
        ) {
          return prev;
        }
        return { ...localized, returnHref };
      });
      // Only clear ready when opening a different tool — re-applying the same
      // slug (pathname effect / localize refresh) must not flash "Loading tool…".
      if (slugChanged) {
        resetContentReady(Boolean(localized.calc));
        setActiveTab("calc");
      }
      setVisible(true);
      maskBackground(true);
      if (typeof document !== "undefined" && localized.title) {
        document.title = `${localized.title} | JoinMyPDF`;
      }
    },
    [localizeOptions, resetContentReady],
  );

  const softPushToolUrl = useCallback(
    (href: string, slug: string, returnHref: string) => {
      if (typeof window === "undefined") return;
      const nextUrl = toWindowPath(locale, href);
      const current = window.location.pathname.replace(/\/$/, "");
      if (current === nextUrl.replace(/\/$/, "")) return;
      // Keep Library → Resume ?project= when swapping soft tool URLs.
      const project = new URLSearchParams(window.location.search).get("project");
      const target =
        project && !nextUrl.includes("project=")
          ? `${nextUrl}${nextUrl.includes("?") ? "&" : "?"}project=${encodeURIComponent(project)}`
          : nextUrl;
      window.history.pushState(
        { toolModal: slug, returnHref },
        "",
        target,
      );
      softUrlRef.current = true;
    },
    [locale],
  );

  const closeToolModal = useCallback(
    (options?: { href?: string }) => {
      closingRef.current = true;
      activeSlugRef.current = null;
      setVisible(false);
      resetContentReady(false);
      maskBackground(false);
      softUrlRef.current = false;

      const returnHref = options?.href || returnHrefRef.current || "/home";
      const destApp = returnHref === "/" ? "/home" : returnHref;
      const onHardToolRoute = findToolsDataByPathname(pathname) != null;
      const hasProjectQuery =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).has("project");

      if (typeof window === "undefined") return;

      const target =
        destApp.startsWith(`/${locale}/`) || destApp === `/${locale}`
          ? destApp
          : destApp === "/home"
            ? `/${locale}/home`
            : toWindowPath(locale, destApp);
      const normalizedTarget = target.includes("?")
        ? target
        : target.endsWith("/")
          ? target
          : `${target}/`;
      const currentPath = window.location.pathname.replace(/\/$/, "");
      const targetPath = normalizedTarget.split("?")[0]!.replace(/\/$/, "");

      // Static Cloudflare export: next-intl router.replace often cannot leave
      // /tools/...?project= — use a real navigation so the resume shell clears.
      if (onHardToolRoute || hasProjectQuery || options?.href) {
        if (currentPath !== targetPath || window.location.search.length > 0) {
          window.location.assign(normalizedTarget);
          return;
        }
      }

      if (currentPath !== targetPath) {
        window.history.replaceState({ toolModal: null }, "", normalizedTarget);
      } else if (window.location.search) {
        window.history.replaceState({ toolModal: null }, "", normalizedTarget);
      }
    },
    [locale, pathname, resetContentReady],
  );

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

  // Handoff from deferred stub (user clicked a tool before the heavy chunk loaded).
  useEffect(() => {
    if (!pendingOpen) return;
    openToolModal(pendingOpen);
    // Intentional mount-only handoff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      resetContentReady(false);
      maskBackground(false);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [applyActiveTool, locale, resetContentReady]);

  // Hard navigation away from a tool route (e.g. in-app link) closes the modal.
  // Soft-URL sessions keep Next pathname on the return route, so also watch the
  // real window location when the address bar / link changes.
  useEffect(() => {
    if (isEmbedRequest()) return;
    if (closingRef.current) return;

    const matched = findToolsDataByPathname(pathname);
    const windowMatched =
      typeof window !== "undefined"
        ? findToolsDataByPathname(window.location.pathname)
        : null;

    if (!matched && !windowMatched && visible) {
      softUrlRef.current = false;
      setVisible(false);
      resetContentReady(false);
      maskBackground(false);
    }
  }, [pathname, visible, resetContentReady]);

  useEffect(() => {
    if (!visible) maskBackground(false);
  }, [visible]);

  const setToolTab = useCallback((tab: ToolModalTab) => {
    if (tab !== "calc" && tab !== "doc" && tab !== "related" && tab !== "reviews") {
      return;
    }
    setActiveTab((prev) => (prev === tab ? prev : tab));
    // Leaving CALC must never keep the boot "Loading tool…" veil over DOC/RELATED.
    if (tab !== "calc") {
      setContentReady(true);
    }
  }, [setContentReady]);

  const registerSession = useCallback((next: ToolModalSessionValue | null) => {
    const prev = sessionRef.current;
    sessionRef.current = next;
    if (next) {
      actionsRef.current = {
        setTab: setToolTab,
        saveProject: () => sessionRef.current?.saveProject(),
        share: () => sessionRef.current?.share(),
        toggleFavorite: () => sessionRef.current?.toggleFavorite(),
        close: () => sessionRef.current?.close(),
      };
    } else {
      actionsRef.current = EMPTY_TOOL_MODAL_ACTIONS;
    }

    // Never store the Wrapper session object in React state — that caused
    // Maximum update depth (#185) when docs elements were recreated each render.
    // Only bump an epoch when display-relevant fields actually change.
    const prevKey = prev
      ? `${prev.open}|${prev.slug}|${prev.tab}|${prev.canSaveProject}|${prev.favorited}|${prev.shareBusy}|${prev.saveProjectLabel}|${prev.shareLabel}|${prev.favoriteLabel}|${prev.closeLabel}`
      : "";
    const nextKey = next
      ? `${next.open}|${next.slug}|${next.tab}|${next.canSaveProject}|${next.favorited}|${next.shareBusy}|${next.saveProjectLabel}|${next.shareLabel}|${next.favoriteLabel}|${next.closeLabel}`
      : "";
    if (prevKey !== nextKey) {
      setSessionEpoch((epoch) => epoch + 1);
    }
  }, [setToolTab]);

  // Provider-owned window hook — OPERATION menu must not depend on Wrapper effects.
  useLayoutEffect(() => {
    if (!visible) return;
    const previous = window.__joinmypdfSetToolModalTab;
    window.__joinmypdfSetToolModalTab = setToolTab;
    return () => {
      if (window.__joinmypdfSetToolModalTab === setToolTab) {
        window.__joinmypdfSetToolModalTab = previous;
      }
    };
  }, [visible, setToolTab]);

  const actions = useMemo<ToolModalActions>(
    () => ({
      setTab: setToolTab,
      saveProject: () => actionsRef.current.saveProject(),
      share: () => actionsRef.current.share(),
      toggleFavorite: () => actionsRef.current.toggleFavorite(),
      close: () => actionsRef.current.close(),
    }),
    [setToolTab],
  );

  const bridgedSession = useMemo<ToolModalSessionValue | null>(() => {
    if (!visible) return null;
    const live = sessionRef.current;
    return {
      open: true,
      slug: active?.slug ?? live?.slug,
      tab: activeTab,
      setTab: setToolTab,
      availableTabs: live?.availableTabs ?? ["calc", "doc", "related", "reviews"],
      tabLabels: live?.tabLabels ?? {},
      canSaveProject: live?.canSaveProject ?? false,
      saveProject: () => sessionRef.current?.saveProject(),
      saveProjectLabel: live?.saveProjectLabel ?? "Save Project",
      share: () => sessionRef.current?.share(),
      shareBusy: live?.shareBusy ?? false,
      shareLabel: live?.shareLabel ?? "Share",
      favorited: live?.favorited ?? false,
      toggleFavorite: () => sessionRef.current?.toggleFavorite(),
      favoriteLabel: live?.favoriteLabel ?? "Add to favorites",
      close: () => sessionRef.current?.close() ?? closeToolModal(),
      closeLabel: live?.closeLabel ?? "Close",
    };
    // sessionEpoch forces a refresh when registerSession reports real field changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, active?.slug, activeTab, setToolTab, closeToolModal, sessionEpoch]);

  const value = useMemo(
    () => ({
      openToolModal,
      closeToolModal,
      isOpen: visible,
      session: bridgedSession,
      registerSession,
      actions,
    }),
    [openToolModal, closeToolModal, visible, bridgedSession, registerSession, actions],
  );

  const docModel = useMemo(
    () =>
      active
        ? getToolModalDocModel(active.slug, active.title, {
            locale,
            t: tPage,
            tTools,
            title: active.title,
            description: active.description,
          })
        : null,
    // Do not depend on tPage/tTools identities — next-intl translators are often
    // new function references each render and were recreating docModel forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active?.slug, active?.title, active?.description, locale],
  );
  const relatedTools = useMemo(
    () =>
      active
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
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- active/tTools identities are unstable
    [active?.slug, active?.categoryId, locale],
  );
  const relatedArticles = useMemo(
    () => (active ? getToolModalRelatedArticles(active.slug) : []),
    [active?.slug],
  );
  const embedSrc = useMemo(
    () =>
      active
        ? buildToolEmbedHref(active.href, locale, {
            project: resumeProjectId,
            category:
              resolveToolAccentCategoryId(active.slug, active.categoryId) ??
              active.categoryId,
          })
        : "",
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active?.slug, active?.href, active?.categoryId, locale, resumeProjectId],
  );

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
  const activeRequiresUpload = active
    ? toolRequiresUpload({
        slug: active.slug,
        operation: active.slug,
      })
    : true;

  return (
    <ToolModalContext.Provider value={value}>
      {children}
      {active && docModel ? (
        <ToolModalWrapper
          open={visible}
          title={active.title}
          description={active.description}
          slug={active.slug}
          requiresUpload={activeRequiresUpload}
          categoryId={active.categoryId}
          onClose={closeToolModal}
          onExitComplete={handleExitComplete}
          contentReady={contentReady || Boolean(active.calc)}
          tab={activeTab}
          onTabChange={setToolTab}
          labels={{
            calc: t("calc"),
            doc: t("doc"),
            related: t("related"),
            reviews: t.has("reviews") ? t("reviews") : "REVIEWS",
            close: t("close"),
            share: t.has("share") ? t("share") : "Share",
            loading: loadingLabel,
            addFavorite: t("addFavorite"),
            removeFavorite: t("removeFavorite"),
            ratings: t("ratings", { count: "{count}" }),
            thankYou: t("thankYou"),
            rateAria: t("rateAria"),
            yourRatingAria: t("yourRatingAria", { rating: "{rating}" }),
            viewsNav: t("viewsNav"),
            showMagnifier: t("showMagnifier"),
            hideMagnifier: t("hideMagnifier"),
            inspectPreview: t.has("inspectPreview") ? t("inspectPreview") : "Inspect preview",
            magnifierSizeGroup: t.has("magnifierSizeGroup")
              ? t("magnifierSizeGroup")
              : "Magnifier size",
            magnifierSizeOff: t.has("magnifierSizeOff") ? t("magnifierSizeOff") : "Off",
            magnifierSizeSmall: t.has("magnifierSizeSmall") ? t("magnifierSizeSmall") : "Small",
            magnifierSizeMedium: t.has("magnifierSizeMedium")
              ? t("magnifierSizeMedium")
              : "Medium",
            magnifierSizeHuge: t.has("magnifierSizeHuge") ? t("magnifierSizeHuge") : "Huge",
            pin: t("pin"),
            unpin: t("unpin"),
            saveProject: t.has("saveProject") ? t("saveProject") : "Save Project",
          }}
          calc={
            active.calc ?? (
              <ToolModalCalcFrame
                key={`${active.slug}:${resumeProjectId ?? ""}`}
                src={embedSrc}
                title={active.title}
                loadingLabel={loadingLabel}
                onReadyChange={setContentReady}
              />
            )
          }
          docs={
            active.docs ?? (
              <div className={toolPagePaneRailClassName}>
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
              </div>
            )
          }
          related={
            active.related ?? (
              <div className={`${toolPagePaneRailClassName} tool-page-related-pane`}>
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
              </div>
            )
          }
          reviews={
            <div className={toolPagePaneRailClassName}>
              <CommunityReviews
                mode="tool"
                compact
                toolSlug={active.slug}
                toolTitle={active.title}
              />
            </div>
          }
        />
      ) : null}
    </ToolModalContext.Provider>
  );
}

export { toOpenOptionsFromSlug };
