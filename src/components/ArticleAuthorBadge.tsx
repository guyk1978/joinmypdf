import { resolveArticleAuthor } from "@/lib/article-author";
import { clsx } from "clsx";
import type { BlogPost } from "@/lib/types";

type Props = {
  post?: Pick<BlogPost, "author"> | null;
  className?: string;
};

function CheckBadgeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6.25" />
      <path d="M5.25 8 7 9.75 10.75 6.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArticleAuthorBadge({ post, className = "" }: Props) {
  const author = resolveArticleAuthor(post);

  return (
    <aside
      className={clsx(
        "article-author-badge flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md sm:gap-4 sm:px-5 sm:py-4 dark:border-neutral-800 dark:bg-neutral-900/50",
        className,
      )}
      aria-label={`Written by ${author.name}, ${author.role}`}
    >
      {author.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={author.avatarUrl}
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-lg border border-white/10 object-cover"
        />
      ) : (
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-neutral-700 bg-white/[0.04] text-sm font-semibold tracking-wide text-neutral-200"
          aria-hidden
        >
          {author.initials}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-neutral-300 sm:text-base">
          <span className="text-neutral-500">Written by </span>
          <span className="font-semibold text-neutral-100">{author.name}</span>
          <span className="text-neutral-500"> · {author.role}</span>
        </p>
        <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-neutral-500 sm:items-center">
          <CheckBadgeIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400 sm:mt-0" />
          <span>{author.verifiedLabel}</span>
        </p>
      </div>
    </aside>
  );
}
