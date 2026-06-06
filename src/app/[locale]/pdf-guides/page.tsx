import type { Metadata } from "next";
export const runtime = "edge";
import { PdfHubPage } from "@/components/PdfHubPage";
import { hubByPath } from "@/lib/pdf-hubs";

const hub = hubByPath("/pdf-guides/")!;

export const metadata: Metadata = {
  title: hub.title,
  description: hub.description,
  alternates: { canonical: hub.path },
};

export default function PdfGuidesHub() {
  return <PdfHubPage hub={hub} />;
}
