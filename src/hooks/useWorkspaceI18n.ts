"use client";

import { useTranslations } from "next-intl";

export function useWorkspaceI18n(operation: string) {
  const t = useTranslations("Workspace");
  const common = useTranslations("Workspace.common");

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

  return {
    t,
    common,
    uploadTitle,
    uploadDescription,
    buttonLabel,
    status,
    progress,
    home: common("home"),
    clear: common("clear"),
    processing: common("processing"),
    chooseAnotherFile: common("chooseAnotherFile"),
    clientSideOnly: common("clientSideOnly"),
    securePrefix: common("securePrefix"),
  };
}
