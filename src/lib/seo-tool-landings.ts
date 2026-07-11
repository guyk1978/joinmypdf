import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export type SeoLandingWorkspaceSlug =
  | "png-to-pdf"
  | "pdf-to-png"
  | "add-page-numbers"
  | "sign-pdf"
  | "protect-pdf"
  | "delete-pdf-pages";

export type SeoRelatedLabelKey =
  | "jpgToPdf"
  | "pdfToPng"
  | "pngToPdf"
  | "pdfToJpg"
  | "mergePdf"
  | "splitPdf"
  | "pdfCompressor"
  | "addPageNumbers"
  | "signPdf"
  | "protectPdf"
  | "deletePdfPages";

export type SeoToolLandingDef = {
  slug: string;
  workspaceSlug: SeoLandingWorkspaceSlug;
  related: readonly { href: string; labelKey: SeoRelatedLabelKey }[];
};

const PNG_TO_PDF_RELATED = [
  { href: "/tools/jpg-to-pdf/", labelKey: "jpgToPdf" },
  { href: "/tools/pdf-to-png/", labelKey: "pdfToPng" },
  { href: "/tools/pdf-merge/", labelKey: "mergePdf" },
] as const satisfies SeoToolLandingDef["related"];

const PDF_TO_PNG_RELATED = [
  { href: "/tools/pdf-to-jpg/", labelKey: "pdfToJpg" },
  { href: "/tools/png-to-pdf/", labelKey: "pngToPdf" },
  { href: "/tools/pdf-compress/", labelKey: "pdfCompressor" },
] as const satisfies SeoToolLandingDef["related"];

const ADD_PAGE_NUMBERS_RELATED = [
  { href: "/tools/add-page-numbers/", labelKey: "addPageNumbers" },
  { href: "/tools/pdf-merge/", labelKey: "mergePdf" },
  { href: "/tools/pdf-split/", labelKey: "splitPdf" },
] as const satisfies SeoToolLandingDef["related"];

const SIGN_PDF_RELATED = [
  { href: "/tools/sign-pdf/", labelKey: "signPdf" },
  { href: "/tools/protect-pdf/", labelKey: "protectPdf" },
  { href: "/tools/pdf-merge/", labelKey: "mergePdf" },
] as const satisfies SeoToolLandingDef["related"];

const PROTECT_PDF_RELATED = [
  { href: "/tools/protect-pdf/", labelKey: "protectPdf" },
  { href: "/tools/sign-pdf/", labelKey: "signPdf" },
  { href: "/tools/pdf-compress/", labelKey: "pdfCompressor" },
] as const satisfies SeoToolLandingDef["related"];

const DELETE_PAGES_RELATED = [
  { href: "/tools/delete-pdf-pages/", labelKey: "deletePdfPages" },
  { href: "/tools/pdf-split/", labelKey: "splitPdf" },
  { href: "/tools/pdf-merge/", labelKey: "mergePdf" },
] as const satisfies SeoToolLandingDef["related"];

/** Batch SEO landing pages for privacy-first PDF tool variants. */
export const SEO_TOOL_LANDINGS = [
  { slug: "png-to-pdf-online", workspaceSlug: "png-to-pdf", related: PNG_TO_PDF_RELATED },
  { slug: "png-to-pdf-high-quality", workspaceSlug: "png-to-pdf", related: PNG_TO_PDF_RELATED },
  { slug: "add-page-numbers-instant", workspaceSlug: "add-page-numbers", related: ADD_PAGE_NUMBERS_RELATED },
  { slug: "png-to-pdf-large-files", workspaceSlug: "png-to-pdf", related: PNG_TO_PDF_RELATED },
  { slug: "pdf-to-png-large-files", workspaceSlug: "pdf-to-png", related: PDF_TO_PNG_RELATED },
  { slug: "sign-pdf-no-signup", workspaceSlug: "sign-pdf", related: SIGN_PDF_RELATED },
  { slug: "add-page-numbers-mobile", workspaceSlug: "add-page-numbers", related: ADD_PAGE_NUMBERS_RELATED },
  { slug: "add-page-numbers-fast", workspaceSlug: "add-page-numbers", related: ADD_PAGE_NUMBERS_RELATED },
  { slug: "pdf-to-png-high-quality", workspaceSlug: "pdf-to-png", related: PDF_TO_PNG_RELATED },
  { slug: "png-to-pdf-mobile", workspaceSlug: "png-to-pdf", related: PNG_TO_PDF_RELATED },
  { slug: "pdf-to-png-free", workspaceSlug: "pdf-to-png", related: PDF_TO_PNG_RELATED },
  { slug: "pdf-to-png-secure", workspaceSlug: "pdf-to-png", related: PDF_TO_PNG_RELATED },
  { slug: "add-page-numbers-high-quality", workspaceSlug: "add-page-numbers", related: ADD_PAGE_NUMBERS_RELATED },
  { slug: "add-page-numbers-secure", workspaceSlug: "add-page-numbers", related: ADD_PAGE_NUMBERS_RELATED },
  { slug: "png-to-pdf-no-upload", workspaceSlug: "png-to-pdf", related: PNG_TO_PDF_RELATED },
  { slug: "sign-pdf-fast", workspaceSlug: "sign-pdf", related: SIGN_PDF_RELATED },
  { slug: "add-page-numbers-no-signup", workspaceSlug: "add-page-numbers", related: ADD_PAGE_NUMBERS_RELATED },
  { slug: "sign-pdf-mobile", workspaceSlug: "sign-pdf", related: SIGN_PDF_RELATED },
  { slug: "protect-pdf-fast", workspaceSlug: "protect-pdf", related: PROTECT_PDF_RELATED },
  { slug: "sign-pdf-high-quality", workspaceSlug: "sign-pdf", related: SIGN_PDF_RELATED },
  { slug: "sign-pdf-instant", workspaceSlug: "sign-pdf", related: SIGN_PDF_RELATED },
  { slug: "pdf-to-png-mobile", workspaceSlug: "pdf-to-png", related: PDF_TO_PNG_RELATED },
  { slug: "pdf-to-png-online", workspaceSlug: "pdf-to-png", related: PDF_TO_PNG_RELATED },
  { slug: "sign-pdf-online", workspaceSlug: "sign-pdf", related: SIGN_PDF_RELATED },
  { slug: "sign-pdf-secure", workspaceSlug: "sign-pdf", related: SIGN_PDF_RELATED },
  { slug: "add-page-numbers-no-upload", workspaceSlug: "add-page-numbers", related: ADD_PAGE_NUMBERS_RELATED },
  { slug: "sign-pdf-free", workspaceSlug: "sign-pdf", related: SIGN_PDF_RELATED },
  { slug: "pdf-to-png-no-signup", workspaceSlug: "pdf-to-png", related: PDF_TO_PNG_RELATED },
  { slug: "delete-pdf-pages-no-signup", workspaceSlug: "delete-pdf-pages", related: DELETE_PAGES_RELATED },
] as const satisfies readonly SeoToolLandingDef[];

export type SeoToolLandingSlug = (typeof SEO_TOOL_LANDINGS)[number]["slug"];

export function getSeoToolLanding(slug: string): SeoToolLandingDef | undefined {
  return SEO_TOOL_LANDINGS.find((entry) => entry.slug === slug);
}

export function seoToolLandingPath(slug: string): string {
  return `/tools/${slug}/`;
}

export async function generateSeoToolLandingMetadata(slug: string, locale: string): Promise<Metadata> {
  const path = seoToolLandingPath(slug);
  const t = await getTranslations({ locale, namespace: "SeoToolLandings" });

  return {
    title: t(`${slug}.metaTitle`),
    description: t(`${slug}.metaDescription`),
    alternates: {
      canonical: `/${locale}${path}`,
      languages: Object.fromEntries(routing.locales.map((item) => [item, `/${item}${path}`])),
    },
  };
}
