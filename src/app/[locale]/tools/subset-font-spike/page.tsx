import type { Metadata } from "next";
import { AppPageShell } from "@/components/AppPageShell";
import { FontSubsetter } from "@/components/FontSubsetter";
import { getToolDocumentation } from "@/lib/registry";

export const metadata: Metadata = {
  title: "Font Subsetter Spike",
  description: "Internal spike page for client-side font subsetting with opentype.js.",
  robots: { index: false, follow: false },
};

export default function SubsetFontSpikePage() {
  const documentation = getToolDocumentation("subset-font-spike");

  return (
    <AppPageShell mainClassName="mx-auto max-w-7xl px-4 py-10 md:px-4 md:py-12">
      <FontSubsetter />
      {documentation ? (
        <section className="mx-auto mt-10 max-w-3xl space-y-6">
          <div className="rounded-none border border-neutral-800 bg-[#0a0a0a] p-6">
            <h2 className="mb-4 text-lg font-semibold text-neutral-100">Why it matters</h2>
            <p className="text-sm leading-relaxed text-neutral-400">{documentation.whyItMatters}</p>
          </div>
          {documentation.faq.length ? (
            <div className="rounded-none border border-neutral-800 bg-[#0a0a0a] p-6">
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-white">Frequently Asked Questions</h2>
              <dl className="space-y-4">
                {documentation.faq.map((item) => (
                  <div key={item.question}>
                    <dt className="text-base font-semibold text-white">{item.question}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-neutral-400">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </section>
      ) : null}
    </AppPageShell>
  );
}
