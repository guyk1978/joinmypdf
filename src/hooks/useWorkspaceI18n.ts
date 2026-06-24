"use client";

import { useTranslations } from "next-intl";

export function useWorkspaceI18n(operation: string) {
  const t = useTranslations("Workspace");
  const tw = useTranslations("Workspaces");
  const common = useTranslations("Workspace.common");
  const twCommon = useTranslations("Workspaces.common");

  function uploadTitle(fallback?: string): string {
    const key = `upload.${operation}.title`;
    if (t.has(key)) return t(key);
    if (fallback) return fallback;
    return t.has("upload.defaultPdf.title") ? t("upload.defaultPdf.title") : "";
  }

  function uploadDescription(fallback?: string): string {
    const key = `upload.${operation}.description`;
    if (t.has(key)) return t(key);
    if (fallback) return fallback;
    return t.has("upload.defaultPdf.description") ? t("upload.defaultPdf.description") : "";
  }

  function buttonLabel(fallback?: string): string {
    const key = `buttons.${operation}`;
    if (t.has(key)) return t(key);
    const wsKey = `${operation}.buttons.convert`;
    if (tw.has(wsKey)) return tw(wsKey);
    return fallback ?? common("run");
  }

  function status(key: string, values?: Record<string, string | number>): string {
    const opKey = `status.${operation}.${key}`;
    if (t.has(opKey)) return t(opKey, values);
    const sharedKey = `status.common.${key}`;
    if (t.has(sharedKey)) return t(sharedKey, values);
    return "";
  }

  function progress(key: string, values?: Record<string, string | number>): string {
    const opKey = `progress.${operation}.${key}`;
    if (t.has(opKey)) return t(opKey, values);
    const sharedKey = `progress.common.${key}`;
    if (t.has(sharedKey)) return t(sharedKey, values);
    return "";
  }

  function wsStatus(key: string, values?: Record<string, string | number>): string {
    const opKey = `${operation}.status.${key}`;
    if (tw.has(opKey)) return tw(opKey, values);
    return status(key, values);
  }

  function wsProgress(key: string, values?: Record<string, string | number>): string {
    const opKey = `${operation}.progress.${key}`;
    if (tw.has(opKey)) return tw(opKey, values);
    return progress(key, values);
  }

  function wsCommon(key: string, values?: Record<string, string | number>): string {
    if (twCommon.has(key)) return twCommon(key, values);
    if (common.has(key)) return common(key, values);
    return "";
  }

  function wsText(key: string, values?: Record<string, string | number>): string {
    const opKey = `${operation}.${key}`;
    if (tw.has(opKey)) return tw(opKey, values);
    return "";
  }

  function wsUi(key: string, values?: Record<string, string | number>): string {
    const opKey = `${operation}.ui.${key}`;
    if (tw.has(opKey)) return tw(opKey, values);
    return "";
  }

  return {
    t,
    tw,
    common,
    uploadTitle,
    uploadDescription,
    buttonLabel,
    status,
    progress,
    wsStatus,
    wsProgress,
    wsCommon,
    wsText,
    wsUi,
    home: common("home"),
    clear: common("clear"),
    uploadNewFile: common("uploadNewFile"),
    processing: common("processing"),
    chooseAnotherFile: common("chooseAnotherFile"),
    clientSideOnly: common("clientSideOnly"),
    securePrefix: common("securePrefix"),
  };
}
