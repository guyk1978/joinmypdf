export function TrustBadges() {
  const items = [
    {
      title: "Stays on your device",
      body: "Merge, split, compress, and convert run locally in your browser session—not on our servers.",
    },
    {
      title: "No watermark",
      body: "Standard downloads are clean for email, portals, and client delivery.",
    },
    {
      title: "Fast for everyday files",
      body: "Skip upload queues so common documents feel immediate.",
    },
    {
      title: "No account to start",
      body: "Open a tool and go. Upgrade paths only if we add paid tiers later.",
    },
  ];
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((x) => (
        <li
          key={x.title}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm shadow-black/20"
        >
          <p className="font-semibold text-ink">{x.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{x.body}</p>
        </li>
      ))}
    </ul>
  );
}
