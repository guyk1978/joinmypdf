import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PdfHubPage } from "@/components/PdfHubPage";
import { hubByPath } from "@/lib/pdf-hubs";

const hub = hubByPath("/pdf-privacy/")!;

export const metadata: Metadata = {
  title: hub.title,
  description: hub.description,
  alternates: { canonical: hub.path },
};

type Props = { params: Promise<{ locale: string }> };

export default async function PdfPrivacyHub({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PdfHubPage hub={hub} locale={locale} />;
}
