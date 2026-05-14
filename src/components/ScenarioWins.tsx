export function ScenarioWins() {
  const scenarios = [
    {
      title: "Month-end invoice packs",
      body: "Combine multiple PDFs, compress if your mailbox has a size cap, and send one attachment instead of ten.",
    },
    {
      title: "Legal & HR bundles",
      body: "Assemble exhibits locally, split signed pages, and export only what reviewers need.",
    },
    {
      title: "Field photos → one PDF",
      body: "Turn phone photos into a single ordered PDF for claims, inspections, or coursework—no desktop install.",
    },
  ];
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Built for real workflows</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Same tools—whether you are closing the month or shipping a client pack.
        </p>
      </div>
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
