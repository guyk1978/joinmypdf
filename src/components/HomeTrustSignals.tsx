"use client";

import { Download, Lock, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

const TRUST_ITEMS = [
  { key: "trustClientSide" as const, Icon: Lock },
  { key: "trustNoServers" as const, Icon: Shield },
  { key: "trustInstantDownload" as const, Icon: Download },
];

export function HomeTrustSignals() {
  const t = useTranslations("Home");

  return (
    <div className="home-trust-signals" role="list" aria-label={t("trustSignalsLabel")}>
      {TRUST_ITEMS.map(({ key, Icon }) => (
        <div key={key} className="home-trust-signals__item" role="listitem">
          <Icon className="home-trust-signals__icon" strokeWidth={1.75} aria-hidden />
          <span>{t(key)}</span>
        </div>
      ))}
    </div>
  );
}
