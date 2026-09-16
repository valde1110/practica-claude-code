import { useState } from "react";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

export function UrlInput({ onSubmit, disabled }: UrlInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <form className="url-input" onSubmit={handleSubmit}>
      <input
        type="url"
        inputMode="url"
        placeholder="Pega el enlace directo a un audio o vídeo…"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={disabled}
        className="url-input-field"
      />
      <button type="submit" className="btn" disabled={disabled || !value.trim()}>
        Transcribir desde URL
      </button>
      <p className="uploader-hint">Solo enlaces directos al archivo (no páginas como YouTube) · máx. 20 MB</p>
    </form>
  );
}
