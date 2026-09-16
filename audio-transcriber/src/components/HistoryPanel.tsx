import { formatDate } from "../lib/format";
import type { TranscriptionJob } from "../lib/history";

interface HistoryPanelProps {
  jobs: TranscriptionJob[];
  onOpen: (job: TranscriptionJob) => void;
  onResume: (jobId: string) => void;
  onDelete: (jobId: string) => void;
  onClose: () => void;
  busy: boolean;
}

function statusLabel(job: TranscriptionJob): string {
  if (job.status === "done") return "Completa";
  if (job.status === "error") return "Interrumpida";
  return "En curso";
}

export function HistoryPanel({ jobs, onOpen, onResume, onDelete, onClose, busy }: HistoryPanelProps) {
  return (
    <div className="history-panel">
      <div className="history-header">
        <h2>Historial</h2>
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>

      {jobs.length === 0 && <p className="uploader-hint">Aún no hay transcripciones guardadas en este dispositivo.</p>}

      <ul className="history-list">
        {jobs.map((job) => (
          <li key={job.id} className={`history-item history-item--${job.status}`}>
            <div className="history-item-main">
              <p className="history-item-name">{job.sourceName}</p>
              <p className="history-item-meta">
                {formatDate(job.createdAt)} · {statusLabel(job)}
                {job.status !== "done" && ` (${job.chunks.filter((c) => c.done).length}/${job.chunks.length} partes)`}
              </p>
              {job.status === "error" && job.errorMessage && (
                <p className="history-item-error">{job.errorMessage}</p>
              )}
            </div>
            <div className="history-item-actions">
              {job.status === "done" && (
                <button type="button" className="btn" onClick={() => onOpen(job)}>
                  Ver
                </button>
              )}
              {job.status !== "done" && (
                <button type="button" className="btn" onClick={() => onResume(job.id)} disabled={busy}>
                  Reanudar
                </button>
              )}
              <button type="button" className="btn btn--ghost" onClick={() => onDelete(job.id)}>
                Borrar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
