"use client";

import { useTranslations } from "next-intl";
import { FaqAccordion } from "@/components/FaqAccordion";

const FAQ_KEYS = ["upload", "free", "professional"] as const;

export function HomeAuthorityFaq() {
  const tHome = useTranslations("Home");

  const items = FAQ_KEYS.map((key) => ({
    q: tHome(`faq.${key}.q`),
    a: tHome(`faq.${key}.a`),
  }));

  return (
    <div className="home-whyus__faq">
      <p className="home-section-head__eyebrow">{tHome("landing.faqEyebrow")}</p>
      <h3 className="home-whyus__faq-title">{tHome("faqTitle")}</h3>
      <FaqAccordion items={items} className="max-w-3xl" />
    </div>
  );
}
