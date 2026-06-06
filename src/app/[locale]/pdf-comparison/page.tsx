import type { Metadata } from "next";
import { PdfHubPage } from "@/components/PdfHubPage";
import { hubByPath } from "@/lib/pdf-hubs";

const hub = hubByPath("/pdf-comparison/")!;

export const metadata: Metadata = {
  title: hub.title,
  description: hub.description,
  alternates: { canonical: hub.path },
};

export default function PdfComparisonHub() {
  return <PdfHubPage hub={hub} />;
}
