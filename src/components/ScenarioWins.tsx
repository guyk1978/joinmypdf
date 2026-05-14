export function ScenarioWins() {
  const scenarios = [
    {
      title: "Month-end invoice packs",
      body: "Combine multiple PDFs, compress if your mailbox has a size cap, and send one attachment instead of ten.",
    },
    {
      title: "Legal & HR bundles",
      body: "Keep drafts local while you assemble exhibits, split signed pages, and export only what reviewers need.",
    },
    {
      title: "Field photos → one PDF",
      body: "Turn phone photos into a single ordered PDF for claims, inspections, or coursework—without desktop software.",
    },
  ];
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-ink">Common wins</h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {scenarios.map((s) => (
          <li key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="font-semibold text-brand">{s.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
