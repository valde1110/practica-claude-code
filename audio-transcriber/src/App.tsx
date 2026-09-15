import { useCallback, useEffect, useState } from "react";
import { RecordButton } from "./components/RecordButton";
import { FileUploader } from "./components/FileUploader";
import { TranscriptResult } from "./components/TranscriptResult";
import { ErrorBanner } from "./components/ErrorBanner";
import { useRecorder } from "./hooks/useRecorder";
import { validateAudioFile } from "./lib/validateAudio";
import { transcribeAudio } from "./lib/transcribeApi";
import { hasIncomingShare, consumeSharedAudio, clearUrlParams } from "./lib/shareTarget";

type Stage = "idle" | "transcribing" | "done";

export default function App() {
  const recorder = useRecorder();
  const [stage, setStage] = useState<Stage>("idle");
  const [text, setText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadToken, setUploadToken] = useState(0);

  const runTranscription = useCallback(async (file: File) => {
    setErrorMessage(null);

    const validationError = validateAudioFile(file);
    if (validationError) {
      setErrorMessage(validationError.message);
      return;
    }

    if (!navigator.onLine) {
      setErrorMessage("Sin conexión a internet. Conéctate e inténtalo de nuevo.");
      return;
    }

    setStage("transcribing");
    const result = await transcribeAudio(file);

    if (!result.ok) {
      setErrorMessage(result.message);
      setStage("idle");
      return;
    }

    setText(result.text);
    setStage("done");
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

  const busy = stage === "transcribing" || recorder.status === "recording";

  return (
    <div className="app">
      <header className="app-header">
        <h1>Voz a Texto</h1>
        <p>Graba o sube un audio y conviértelo en texto en español.</p>
      </header>

      <main className="app-main">
        {errorMessage && <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />}

        {stage === "done" ? (
          <TranscriptResult text={text} onReset={handleReset} />
        ) : (
          <>
            <RecordButton
              status={recorder.status}
              seconds={recorder.seconds}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              disabled={stage === "transcribing"}
            />

            <div className="divider">
              <span>o</span>
            </div>

            <FileUploader
              onFileSelected={(file) => void runTranscription(file)}
              autoOpenToken={uploadToken}
              disabled={busy}
            />

            {stage === "transcribing" && (
              <p className="status-line" aria-live="polite">
                Transcribiendo audio…
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
