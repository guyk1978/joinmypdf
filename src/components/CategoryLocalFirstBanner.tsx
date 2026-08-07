import { Lock, Shield, Zap } from "lucide-react";
import { clsx } from "clsx";
import "@/styles/category-hub-marketing.css";

type CategoryLocalFirstBannerProps = {
  className?: string;
};

/**
 * Compact local-first guarantee banner for category hubs.
 */
export function CategoryLocalFirstBanner({ className }: CategoryLocalFirstBannerProps) {
  return (
    <aside
      className={clsx("chm-banner", className)}
      aria-label="Local-first privacy guarantee"
    >
      <div className="chm-banner__intro">
        <p className="chm-banner__eyebrow">Local-first guarantee</p>
        <h2 className="chm-banner__title">Your files never leave this browser</h2>
        <p className="chm-banner__text">
          Every tool in this category processes data on your device. No upload queues,
          no remote copies, and nothing left behind when you close the tab.
        </p>
      </div>
      <ul className="chm-banner__pills">
        <li>
          <Shield aria-hidden strokeWidth={1.5} />
          Absolute privacy
        </li>
        <li>
          <Zap aria-hidden strokeWidth={1.5} />
          Instant local speed
        </li>
        <li>
          <Lock aria-hidden strokeWidth={1.5} />
          Zero uploads
        </li>
      </ul>
    </aside>
  );
}
