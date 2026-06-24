import { clsx } from "clsx";

type AdContainerProps = {
  className?: string;
  /** `article` — tall in-content slot; `tool` — compact slot below upload */
  variant?: "tool" | "article";
};

/**
 * AdSense slot wrapper — replace the inner placeholder with your AdSense unit when ready.
 */
export function AdContainer({ className, variant = "tool" }: AdContainerProps) {
  const isArticle = variant === "article";

  return (
    <aside
      className={clsx("ad-container w-full", isArticle && "ad-container--article", className)}
      role="complementary"
      aria-label="Advertisement"
    >
      <div
        className={clsx(
          "ad-container__slot",
          isArticle && "ad-container__slot--article relative min-h-[250px] rounded-none border border-gray-800",
        )}
      >
        {isArticle ? (
          <span className="ad-container__corner-label" aria-hidden="true">
            Ad
          </span>
        ) : (
          <span className="ad-container__placeholder" aria-hidden="true">
            Ad Space
          </span>
        )}
      </div>
    </aside>
  );
}
