import type { BlogSection } from "@/lib/types";

export function BlogToc({ sections }: { sections: BlogSection[] }) {
  if (!sections?.length || sections.length < 3) return null;
  return (
    <nav
      aria-label="Table of contents"
      className="rounded-none border border-white/10 bg-white/[0.03] p-3"
    >
      <p className="text-sm font-semibold text-ink">On this page</p>
      <ol className="mt-3 space-y-2 text-sm">
        {sections.map((s) => (
          <li key={s.id}>
            <a className="text-black dark:text-neutral-200 hover:underline" href={`#${s.id}`}>
              {s.heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
