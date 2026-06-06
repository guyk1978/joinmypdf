type WorkspaceProgressBarProps = {
  percent: number;
  label: string;
};

/** Progress bars stay LTR so fill direction stays intuitive in Hebrew (RTL) layouts. */
export function WorkspaceProgressBar({ percent, label }: WorkspaceProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>{label}</span>
        <span dir="ltr">{clamped}%</span>
      </div>
      <div className="workspace-progress h-2 overflow-hidden rounded-full bg-white/10" dir="ltr">
        <div
          className="workspace-progress__fill h-full rounded-full bg-gradient-to-r from-brand to-brand-deep transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
