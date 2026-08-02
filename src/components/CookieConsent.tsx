"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  getCookieConsent,
  setCookieConsent,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";
import { isGoogleAnalyticsConfigured, updateConsent } from "@/lib/google-analytics";
import "./cookie-consent.css";

type ConsentUiState = "checking" | "pending" | CookieConsentChoice;

export function CookieConsent() {
  const t = useTranslations("CookieConsent");
  const [uiState, setUiState] = useState<ConsentUiState>("checking");
  const [isOverlayActive, setIsOverlayActive] = useState(true);

  useEffect(() => {
    if (!isGoogleAnalyticsConfigured()) {
      setIsOverlayActive(false);
      setUiState("declined");
      return;
    }

    const stored = getCookieConsent();
    if (stored === "accepted") {
      setIsOverlayActive(false);
      setUiState("accepted");
      return;
    }
    if (stored === "declined") {
      setIsOverlayActive(true);
      setUiState("declined");
      return;
    }

    setIsOverlayActive(true);
    setUiState("pending");
  }, []);

  if (!isGoogleAnalyticsConfigured() || uiState === "accepted") return null;

  const handleAccept = () => {
    setCookieConsent("accepted");
    updateConsent(true);
    setIsOverlayActive(false);
    setUiState("accepted");
  };

  const handleDecline = () => {
    setCookieConsent("declined");
    updateConsent(false);
    setIsOverlayActive(true);
    setUiState("declined");
  };

  const bannerMessage =
    uiState === "declined" ? t("declineDenied") : t("message");

  return (
    <>
      {isOverlayActive && (
        <div className="cookie-consent__overlay" aria-hidden="true" />
      )}
      <div
        className="cookie-consent__dock"
        role="dialog"
        aria-live="polite"
        aria-label={t("title")}
      >
        <div className="cookie-consent__card">
          <p className="cookie-consent__message">
            {bannerMessage}{" "}
            {uiState !== "declined" && (
              <Link href="/privacy/" className="cookie-consent__privacy">
                {t("privacyLink")}
              </Link>
            )}
          </p>
          <div className="cookie-consent__actions">
            <button
              type="button"
              onClick={handleDecline}
              className="cookie-consent__btn cookie-consent__btn--decline"
            >
              {t("decline")}
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="cookie-consent__btn cookie-consent__btn--accept"
            >
              {t("accept")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
