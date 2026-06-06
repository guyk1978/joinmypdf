type WorkspaceProgressBarProps = {
  percent: number;
  label: string;
};

/** Progress bars stay LTR so fill direction stays intuitive in Hebrew (RTL) layouts. */
export function WorkspaceProgressBar({ percent, label }: WorkspaceProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="space-y-2 text-start" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
        <span className="min-w-0 flex-1">{label}</span>
        <span dir="ltr">{clamped}%</span>
      </div>
      <div className="workspace-progress h-2 overflow-hidden rounded-none bg-neutral-200 dark:bg-neutral-800" dir="ltr">
        <div
          className="workspace-progress__fill h-full rounded-none bg-neutral-800 transition-all duration-300 dark:bg-neutral-200"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
