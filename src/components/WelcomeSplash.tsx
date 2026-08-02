import { getLocale, getTranslations } from "next-intl/server";
import { HeaderPdfMini } from "@/components/HeaderPdfMini";
import { WelcomeSplashClient } from "@/components/WelcomeSplashClient";
import { getBrandName } from "@/lib/brand";

/**
 * Server-rendered welcome splash — hero text is in the initial HTML (LCP).
 * Interactivity lives in a small client island.
 */
export async function WelcomeSplash() {
  const t = await getTranslations("Home.splash");
  const locale = await getLocale();
  const brandName = getBrandName(locale);

  const brand = (
    <span className="joinmypdf-logo-text welcome-splash__logo">
      <HeaderPdfMini className="header-pdf-mini--tight joinmypdf-logo-text__icon" />
      <span className="joinmypdf-logo-text__word">
        {locale === "he" ? brandName : "joinmypdf"}
      </span>
    </span>
  );

  return (
    <WelcomeSplashClient
      eyebrow={t("eyebrow")}
      title={t("title")}
      tagline={t("tagline")}
      enterLabel={t("enter")}
      hint={t("hint")}
      redirectingLabel={t("redirecting")}
      brand={brand}
    />
  );
}
