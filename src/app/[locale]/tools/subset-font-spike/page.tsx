import type { Metadata } from "next";
import { AppPageShell } from "@/components/AppPageShell";
import { FontSubsetter } from "@/components/FontSubsetter";

export const metadata: Metadata = {
  title: "Font Subsetter Spike",
  description: "Internal spike page for client-side font subsetting with opentype.js.",
  robots: { index: false, follow: false },
};

export default function SubsetFontSpikePage() {
  return (
    <AppPageShell mainClassName="mx-auto max-w-7xl px-4 py-10 md:px-4 md:py-12">
      <FontSubsetter />
    </AppPageShell>
  );
}
