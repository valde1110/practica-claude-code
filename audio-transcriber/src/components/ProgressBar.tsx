interface ProgressBarProps {
  label: string;
  ratio: number; // 0..1
}

export function ProgressBar({ label, ratio }: ProgressBarProps) {
  const percent = Math.round(Math.min(Math.max(ratio, 0), 1) * 100);
  return (
    <div className="progress" aria-live="polite">
      <p className="progress-label">
        {label} — {percent}%
      </p>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
