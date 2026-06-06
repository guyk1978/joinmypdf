import { getTranslations } from "next-intl/server";

export async function SocialProofStrip() {
  const t = await getTranslations("SocialProof");

  return (
    <section className="rounded-none border border-white/10 bg-white/[0.02] px-4 py-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">{t("eyebrow")}</p>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-ink-muted md:text-base">{t("body")}</p>
    </section>
  );
}
