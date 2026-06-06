import { clsx } from "clsx";

type JoinMyPdfLogoProps = {
  className?: string;
};

/** Angular geometric eye replacing the letter O — monochromatic, theme-aware via currentColor. */
function LogoEye({ className }: { className?: string }) {
  return (
    <svg
      className={clsx(
        "joinmypdf-logo__eye inline-block h-[14px] w-[11px] shrink-0 align-[-2px]",
        "stroke-neutral-800 text-neutral-800 dark:stroke-neutral-200 dark:text-neutral-200",
        className,
      )}
      viewBox="0 0 11 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5.5 1 10 7 5.5 13 1 7 5.5 1Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="miter"
      />
      <path d="M5.5 5.5 7.5 7 5.5 8.5 3.5 7 5.5 5.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function JoinMyPdfLogo({ className }: JoinMyPdfLogoProps) {
  return (
    <span
      className={clsx(
        "joinmypdf-logo inline-flex items-center text-[14px] font-extrabold leading-none tracking-[0.08em] text-neutral-900 dark:text-neutral-200",
        className,
      )}
    >
      <span className="inline-flex items-center" aria-hidden="true">
        <span>JOINMY</span>
        <LogoEye />
        <span>PDF</span>
      </span>
    </span>
  );
}
