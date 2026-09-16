import { useCallback, useEffect, useState } from "react";
import { RecordButton } from "./components/RecordButton";
import { FileUploader } from "./components/FileUploader";
import { TranscriptResult } from "./components/TranscriptResult";
import { ErrorBanner } from "./components/ErrorBanner";
import { ProgressBar } from "./components/ProgressBar";
import { HistoryPanel } from "./components/HistoryPanel";
import { useRecorder } from "./hooks/useRecorder";
import { transcribeAudio } from "./lib/transcribeApi";
import { validateMediaFile, needsJobPipeline } from "./lib/validateMedia";
import { startJob, processJob, type JobRunProgress } from "./lib/transcribeJob";
import { listJobs, saveSimpleResult, deleteJob, type TranscriptionJob } from "./lib/history";
import { hasIncomingShare, consumeSharedAudio, clearUrlParams } from "./lib/shareTarget";

type Stage = "idle" | "transcribing" | "processing-job" | "done";

export default function App() {
  const recorder = useRecorder();
  const [stage, setStage] = useState<Stage>("idle");
  const [text, setText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadToken, setUploadToken] = useState(0);
  const [jobProgress, setJobProgress] = useState<JobRunProgress | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [jobs, setJobs] = useState<TranscriptionJob[]>([]);

  const refreshJobs = useCallback(async () => {
    setJobs(await listJobs());
  }, []);

  useEffect(() => {
    void refreshJobs();
  }, [refreshJobs]);

  const runSimpleTranscription = useCallback(async (file: File) => {
    setStage("transcribing");
    const result = await transcribeAudio(file);

    if (!result.ok) {
      setErrorMessage(result.message);
      setStage("idle");
      return;
    }

    await saveSimpleResult(file.name, result.text);
    await refreshJobs();
    setText(result.text);
    setStage("done");
  }, [refreshJobs]);

  const runJobTranscription = useCallback(
    async (file: File) => {
      setStage("processing-job");
      setJobProgress({ stage: "extracting", ratio: 0 });
      try {
        const job = await startJob(file, { onProgress: setJobProgress });
        await refreshJobs();
        setText(job.fullText);
        setStage("done");
      } catch (err) {
        await refreshJobs();
        setErrorMessage(err instanceof Error ? err.message : "No se pudo completar la transcripción.");
        setStage("idle");
      } finally {
        setJobProgress(null);
      }
    },
    [refreshJobs],
  );

  const runTranscription = useCallback(
    async (file: File) => {
      setErrorMessage(null);

      const validationError = validateMediaFile(file);
      if (validationError) {
        setErrorMessage(validationError.message);
        return;
      }

      if (!navigator.onLine) {
        setErrorMessage("Sin conexión a internet. Conéctate e inténtalo de nuevo.");
        return;
      }

      if (needsJobPipeline(file)) {
        await runJobTranscription(file);
      } else {
        await runSimpleTranscription(file);
      }
    },
    [runJobTranscription, runSimpleTranscription],
  );

  const handleResumeJob = useCallback(
    async (jobId: string) => {
      setErrorMessage(null);
      setStage("processing-job");
      setJobProgress({ stage: "transcribing", ratio: 0 });
      try {
        const job = await processJob(jobId, { onProgress: setJobProgress });
        await refreshJobs();
        setText(job.fullText);
        setHistoryOpen(false);
        setStage("done");
      } catch (err) {
        await refreshJobs();
        setErrorMessage(err instanceof Error ? err.message : "No se pudo reanudar la transcripción.");
        setStage("idle");
      } finally {
        setJobProgress(null);
      }
    },
    [refreshJobs],
  );

  const handleDeleteJob = useCallback(
    async (jobId: string) => {
      await deleteJob(jobId);
      await refreshJobs();
    },
    [refreshJobs],
  );

  const handleOpenJob = useCallback((job: TranscriptionJob) => {
    setText(job.fullText);
    setStage("done");
    setHistoryOpen(false);
  }, []);

  const handleStartRecording = useCallback(() => {
    setErrorMessage(null);
    recorder.start();
  }, [recorder]);

  const handleStopRecording = useCallback(async () => {
    const blob = await recorder.stop();
    if (blob && blob.size > 0) {
      const file = new File([blob], `grabacion-${Date.now()}.webm`, { type: blob.type || "audio/webm" });
      void runTranscription(file);
    }
  }, [recorder, runTranscription]);

  const handleReset = useCallback(() => {
    setStage("idle");
    setText("");
    setErrorMessage(null);
    recorder.reset();
  }, [recorder]);

  // Handle app-shortcut deep links ("Grabar" / "Subir audio") and incoming
  // shared audio (WhatsApp, etc.) captured by the service worker.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");

    if (action === "record") {
      clearUrlParams("action");
      handleStartRecording();
    } else if (action === "upload") {
      clearUrlParams("action");
      setUploadToken((t) => t + 1);
    }

    if (hasIncomingShare()) {
      clearUrlParams("share-target");
      consumeSharedAudio().then((file) => {
        if (file) void runTranscription(file);
        else setErrorMessage("No se recibió ningún audio compartido.");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (recorder.error) setErrorMessage(recorder.error);
  }, [recorder.error]);

  const busy = stage === "transcribing" || stage === "processing-job" || recorder.status === "recording";

  return (
    <div className="app">
      <header className="app-header">
        <h1>Voz a Texto</h1>
        <p>Graba o sube un audio o vídeo y conviértelo en texto en español.</p>
        <button type="button" className="btn btn--ghost history-toggle" onClick={() => setHistoryOpen(true)}>
          Historial{jobs.length > 0 ? ` (${jobs.length})` : ""}
        </button>
      </header>

      <main className="app-main">
        {errorMessage && <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />}

        {historyOpen ? (
          <HistoryPanel
            jobs={jobs}
            onOpen={handleOpenJob}
            onResume={handleResumeJob}
            onDelete={handleDeleteJob}
            onClose={() => setHistoryOpen(false)}
            busy={busy}
          />
        ) : stage === "done" ? (
          <TranscriptResult text={text} onReset={handleReset} />
        ) : (
          <>
            <RecordButton
              status={recorder.status}
              seconds={recorder.seconds}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              disabled={busy}
            />

            <div className="divider">
              <span>o</span>
            </div>

            <FileUploader onFileSelected={(file) => void runTranscription(file)} autoOpenToken={uploadToken} disabled={busy} />

            {stage === "transcribing" && (
              <p className="status-line" aria-live="polite">
                Transcribiendo audio…
              </p>
            )}

            {stage === "processing-job" && jobProgress && (
              <ProgressBar
                label={
                  jobProgress.stage === "loading"
                    ? "Preparando el conversor de audio"
                    : jobProgress.stage === "extracting"
                      ? "Extrayendo audio"
                      : `Transcribiendo parte ${Math.min((jobProgress.chunkIndex ?? 0) + 1, jobProgress.chunkTotal ?? 1)} de ${jobProgress.chunkTotal ?? 1}`
                }
                ratio={jobProgress.ratio}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
