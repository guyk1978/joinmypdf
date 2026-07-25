import { setToolIntroActive } from "@/lib/tool-intro-chrome";

/**
 * Synchronously clear cinematic-intro chrome locks in the same click turn as
 * "Get Started" so leftover overflow / data-* attributes cannot force a
 * redundant second click.
 */
export function clearIntroChromeLocks(dataAttribute: string) {
  if (typeof document === "undefined") return;
  if (dataAttribute) {
    document.documentElement.removeAttribute(dataAttribute);
  }
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  setToolIntroActive(false);
}
