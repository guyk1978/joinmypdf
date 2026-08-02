import type { Metadata } from "next";
import { SeoToolLandingPage } from "@/components/SeoToolLandingPage";
import { generateSeoToolLandingMetadata } from "@/lib/seo-tool-landings";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateSeoToolLandingMetadata("sign-pdf-high-quality", locale);
}

export default function Page({ params }: PageProps) {
  return <SeoToolLandingPage slug="sign-pdf-high-quality" params={params} />;
}
