import type { Metadata } from "next";
export { runtime } from "@/lib/cloudflare-runtime";
import { PdfHubPage } from "@/components/PdfHubPage";
import { hubByPath } from "@/lib/pdf-hubs";

const hub = hubByPath("/pdf-privacy/")!;

export const metadata: Metadata = {
  title: hub.title,
  description: hub.description,
  alternates: { canonical: hub.path },
};

export default function PdfPrivacyHub() {
  return <PdfHubPage hub={hub} />;
}
