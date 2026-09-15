import { useEffect, useRef } from "react";
import { ALLOWED_EXTENSIONS } from "../lib/validateAudio";

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  autoOpenToken?: number;
  disabled?: boolean;
}

export function FileUploader({ onFileSelected, autoOpenToken, disabled }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoOpenToken !== undefined && autoOpenToken > 0) {
      inputRef.current?.click();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenToken]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onFileSelected(file);
  };

  return (
    <div className="uploader">
      <button
        type="button"
        className="uploader-button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        Subir archivo de audio
      </button>
      <p className="uploader-hint">Formatos: {ALLOWED_EXTENSIONS.join(", ")} · máx. 25 MB</p>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.ogg,.opus,.webm"
        className="uploader-input"
        onChange={handleChange}
      />
    </div>
  );
}
