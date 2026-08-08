import { clsx } from "clsx";
import {
  resolveReviewerPersona,
  type ReviewerGender,
  type ReviewerHairVariant,
} from "@/lib/reviewer-persona";
import "./reviewer-avatar.css";

type ReviewerAvatarProps = {
  name: string;
  className?: string;
  /** CSS pixel size for width/height attributes. Default 40. */
  size?: number;
};

const FILL = "#0f172a";
const BG = "#5eead4";

/**
 * Faceless flat silhouette avatar — guy or girl shape from the display name.
 * No facial features; hair/shoulder silhouette only.
 */
export function ReviewerAvatar({
  name,
  className,
  size = 40,
}: ReviewerAvatarProps) {
  const { gender, variant } = resolveReviewerPersona(name);

  return (
    <span
      className={clsx("reviewer-avatar", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        className="reviewer-avatar__svg"
        viewBox="0 0 40 40"
        width={size}
        height={size}
        role="img"
        focusable="false"
      >
        <circle cx="20" cy="20" r="20" fill={BG} />
        <Silhouette gender={gender} variant={variant} />
      </svg>
    </span>
  );
}

function Silhouette({
  gender,
  variant,
}: {
  gender: ReviewerGender;
  variant: ReviewerHairVariant;
}) {
  if (gender === "female") {
    if (variant === "b") return <FemaleShoulder />;
    if (variant === "c") return <FemaleBob />;
    return <FemaleBun />;
  }
  if (variant === "b") return <MaleCurly />;
  if (variant === "c") return <MaleFade />;
  return <MaleShort />;
}

/** Short neat hair — Jordan-style. */
function MaleShort() {
  return (
    <g fill={FILL}>
      <ellipse cx="20" cy="15.2" rx="7.4" ry="8.1" />
      <path d="M10.5 14.2c.4-5.2 4.2-9 9.5-9s9.1 3.8 9.5 9c-.8-2.4-3.4-3.8-9.5-3.8s-8.7 1.4-9.5 3.8Z" />
      <path d="M8.2 38c1.4-7.2 5.6-11.2 11.8-11.2S30.4 30.8 31.8 38Z" />
    </g>
  );
}

/** Textured / curly top — Sam-style. */
function MaleCurly() {
  return (
    <g fill={FILL}>
      <ellipse cx="20" cy="15.6" rx="7.2" ry="7.8" />
      <circle cx="13.2" cy="10.2" r="2.6" />
      <circle cx="17" cy="7.6" r="2.8" />
      <circle cx="21.4" cy="7.2" r="2.9" />
      <circle cx="25.8" cy="9.2" r="2.7" />
      <circle cx="27.2" cy="13" r="2.4" />
      <circle cx="12.6" cy="13.6" r="2.3" />
      <path d="M8.2 38c1.4-7.2 5.6-11.2 11.8-11.2S30.4 30.8 31.8 38Z" />
    </g>
  );
}

/** Slightly fuller sides. */
function MaleFade() {
  return (
    <g fill={FILL}>
      <ellipse cx="20" cy="15.4" rx="7.6" ry="8" />
      <path d="M11 16.5c.2-5.6 3.8-9.8 9-9.8s8.8 4.2 9 9.8c-1.1-3.2-3.8-4.6-9-4.6s-7.9 1.4-9 4.6Z" />
      <path d="M11 14.8c-1.1.8-1.8 2-1.8 3.4 0 .4.05.8.12 1.15C10.2 16.8 11.8 15.4 14 14.6Z" />
      <path d="M29 14.8c1.1.8 1.8 2 1.8 3.4 0 .4-.05.8-.12 1.15C29.8 16.8 28.2 15.4 26 14.6Z" />
      <path d="M8.2 38c1.4-7.2 5.6-11.2 11.8-11.2S30.4 30.8 31.8 38Z" />
    </g>
  );
}

/** High bun — Priya-style. */
function FemaleBun() {
  return (
    <g fill={FILL}>
      <circle cx="20" cy="6.2" r="3.6" />
      <ellipse cx="20" cy="15.4" rx="7.3" ry="8" />
      <path d="M11.2 16.8c.6-4.6 3.8-7.6 8.8-7.6s8.2 3 8.8 7.6c-.9-2.6-3.4-4-8.8-4s-7.9 1.4-8.8 4Z" />
      <path d="M12.5 18.5c-2.2 1.1-3.6 2.8-3.8 5.2-.1 1.2.2 2.4.7 3.4C10.2 23.4 12.8 20.8 16 19.2Z" />
      <path d="M27.5 18.5c2.2 1.1 3.6 2.8 3.8 5.2.1 1.2-.2 2.4-.7 3.4C29.8 23.4 27.2 20.8 24 19.2Z" />
      <path d="M7.6 38c1.6-7.6 6.2-11.6 12.4-11.6S30.8 30.4 32.4 38Z" />
    </g>
  );
}

/** Longer shoulder-length silhouette. */
function FemaleShoulder() {
  return (
    <g fill={FILL}>
      <ellipse cx="20" cy="15" rx="7.2" ry="7.8" />
      <path d="M10.8 14c.5-5 4-8.6 9.2-8.6s8.7 3.6 9.2 8.6c-1-3-3.6-4.6-9.2-4.6s-8.2 1.6-9.2 4.6Z" />
      <path d="M11.5 17c-2.8 1.4-4.4 4-4.6 7.2-.1 1.6.3 3.1 1 4.4 0-4.2 2.4-8 5.8-10.2Z" />
      <path d="M28.5 17c2.8 1.4 4.4 4 4.6 7.2.1 1.6-.3 3.1-1 4.4 0-4.2-2.4-8-5.8-10.2Z" />
      <path d="M7.6 38c1.6-7.6 6.2-11.6 12.4-11.6S30.8 30.4 32.4 38Z" />
    </g>
  );
}

/** Soft bob. */
function FemaleBob() {
  return (
    <g fill={FILL}>
      <ellipse cx="20" cy="15.2" rx="7.4" ry="8" />
      <path d="M9.8 16.2c.4-5.8 4.4-9.8 10.2-9.8s9.8 4 10.2 9.8c-1.2-3.4-4-5.2-10.2-5.2s-9 1.8-10.2 5.2Z" />
      <path d="M10.2 18.8c-1.6 1.2-2.5 3-2.5 5.1 0 1.1.2 2.1.6 3 0-3.4 1.6-6.2 4.2-8Z" />
      <path d="M29.8 18.8c1.6 1.2 2.5 3 2.5 5.1 0 1.1-.2 2.1-.6 3 0-3.4-1.6-6.2-4.2-8Z" />
      <path d="M7.6 38c1.6-7.6 6.2-11.6 12.4-11.6S30.8 30.4 32.4 38Z" />
    </g>
  );
}
