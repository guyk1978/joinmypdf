const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __joinmypdfGaLoaded?: boolean;
  }
}

function getMeasurementId(): string | null {
  return GA_MEASUREMENT_ID || null;
}

export function isGoogleAnalyticsConfigured(): boolean {
  return Boolean(getMeasurementId());
}

/** Consent Mode v2 defaults — call before gtag.js loads if scripts are injected early. */
export function setGoogleConsentDefaults(): void {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });
}

export function grantGoogleAnalyticsConsent(): void {
  if (!window.gtag) setGoogleConsentDefaults();
  window.gtag?.("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted",
  });
}

export function denyGoogleAnalyticsConsent(): void {
  if (!window.gtag) setGoogleConsentDefaults();
  window.gtag?.("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });
}

export function enableGoogleAnalytics(): void {
  const measurementId = getMeasurementId();
  if (!measurementId || typeof document === "undefined") return;
  if (window.__joinmypdfGaLoaded) {
    grantGoogleAnalyticsConsent();
    return;
  }

  setGoogleConsentDefaults();

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  script.onload = () => {
    window.gtag?.("js", new Date());
    grantGoogleAnalyticsConsent();
    window.gtag?.("config", measurementId, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
  };
  document.head.appendChild(script);
  window.__joinmypdfGaLoaded = true;
}

export function disableGoogleAnalytics(): void {
  denyGoogleAnalyticsConsent();
}
