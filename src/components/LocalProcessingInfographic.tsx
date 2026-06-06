const DEFAULT_HEADLINE =
  "Merge, compress, and edit PDFs in your browser—nothing is uploaded to our servers.";

type LocalProcessingInfographicProps = {
  className?: string;
  headline?: string;
  headingAs?: "h1" | "h2";
};

export function LocalProcessingInfographic({
  className = "",
  headline = DEFAULT_HEADLINE,
  headingAs = "h2",
}: LocalProcessingInfographicProps) {
  const Heading = headingAs;

  return (
    <section
      className={`py-16 px-4 max-w-6xl mx-auto text-center ${className}`.trim()}
      aria-labelledby="local-processing-heading"
    >
      <Heading
        id="local-processing-heading"
        className="mx-auto mb-4 max-w-3xl text-2xl font-semibold leading-snug tracking-tight text-slate-900 dark:text-white md:text-4xl"
      >
        {headline}
      </Heading>
      <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 text-base md:text-lg">
        JoinMyPDF runs tools locally for maximum speed and absolute privacy.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 mb-4 text-xl">
            🛡️
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">100% Private</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your documents never leave your device. Everything happens in your browser.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 mb-4 text-xl">
            ⚡
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">Blazing Fast</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No queues, no wait times. Files are handled instantly locally.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 mb-4 text-xl">
            ✨
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">No Limits</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Enjoy standard downloads without watermarks or forced signups.
          </p>
        </div>
      </div>
    </section>
  );
}
