import { formatDuration } from "../lib/format";
import type { RecorderStatus } from "../hooks/useRecorder";

interface RecordButtonProps {
  status: RecorderStatus;
  seconds: number;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function RecordButton({ status, seconds, onStart, onStop, disabled }: RecordButtonProps) {
  const recording = status === "recording";

  return (
    <div className="record-panel">
      <button
        type="button"
        className={`record-button ${recording ? "record-button--active" : ""}`}
        onClick={recording ? onStop : onStart}
        disabled={disabled}
        aria-pressed={recording}
      >
        {recording ? <StopIcon /> : <MicIcon />}
      </button>
      <p className="record-timer" aria-live="polite">
        {recording ? formatDuration(seconds) : "Toca para grabar"}
      </p>
    </div>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
      <path d="M6 11a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
  );
}
