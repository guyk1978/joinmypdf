function CheckIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 shrink-0 text-brand" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-7.5 10.5a.75.75 0 01-1.127.077l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 6.948-9.817a.75.75 0 011.052-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const items = [
  {
    title: "No file uploads to server",
    body: "Your PDFs are processed in the browser session—JoinMyPDF does not ingest them to run merge, split, compress, or conversion.",
  },
  {
    title: "Works 100% in browser",
    body: "No install. Open a tool, add files, download the result—Chrome, Safari, Firefox, and Edge on desktop and mobile.",
  },
  {
    title: "Fast and secure",
    body: "Skip upload queues for everyday documents. Built for speed without sending files through a third-party pipeline.",
  },
  {
    title: "No watermark",
    body: "Standard outputs from these tools stay clean for email, portals, and client delivery.",
  },
];

export function TrustBadges() {
  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 md:p-8">
      <h2 className="text-center text-lg font-semibold tracking-tight text-ink md:text-xl">Why teams trust JoinMyPDF</h2>
      <ul className="mx-auto mt-8 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((x) => (
          <li key={x.title} className="flex gap-3">
            <CheckIcon />
            <div>
              <p className="font-semibold leading-snug text-ink">{x.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{x.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
