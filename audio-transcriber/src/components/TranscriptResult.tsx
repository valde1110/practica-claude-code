import { useState } from "react";

interface TranscriptResultProps {
  text: string;
  onReset: () => void;
}

export function TranscriptResult({ text, onReset }: TranscriptResultProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const download = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcripcion-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="result-panel">
      <textarea className="result-text" value={text} readOnly rows={10} aria-label="Texto transcrito" />
      <div className="result-actions">
        <button type="button" className="btn btn--primary" onClick={copy}>
          {copied ? "Copiado ✓" : "Copiar"}
        </button>
        <button type="button" className="btn" onClick={download}>
          Descargar .txt
        </button>
        <button type="button" className="btn btn--ghost" onClick={onReset}>
          Nueva transcripción
        </button>
      </div>
    </div>
  );
}
