import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PdfHubPage } from "@/components/PdfHubPage";
import { buildPdfHubMetadata, hubByPath } from "@/lib/pdf-hubs";

const hub = hubByPath("/pdf-comparison/")!;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPdfHubMetadata(hub, locale);
}

export default async function PdfComparisonHub({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PdfHubPage hub={hub} locale={locale} />;
}
