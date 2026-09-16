import { useEffect, useRef } from "react";
import { ALLOWED_EXTENSIONS } from "../lib/validateAudio";
import { VIDEO_EXTENSIONS } from "../lib/validateMedia";

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
        Subir audio o vídeo
      </button>
      <p className="uploader-hint">
        Audio: {ALLOWED_EXTENSIONS.join(", ")} (máx. 25 MB) · Vídeo: {VIDEO_EXTENSIONS.join(", ")} (cualquier
        duración, se extrae el audio en el propio dispositivo)
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={[
          "audio/*",
          "video/*",
          ...ALLOWED_EXTENSIONS.map((ext) => `.${ext}`),
          ...VIDEO_EXTENSIONS.map((ext) => `.${ext}`),
        ].join(",")}
        className="uploader-input"
        onChange={handleChange}
      />
    </div>
  );
}
