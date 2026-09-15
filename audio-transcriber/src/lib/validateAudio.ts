export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = ["mp3", "m4a", "wav", "ogg", "opus", "webm"];

export interface AudioValidationError {
  code: "file_too_large" | "invalid_format";
  message: string;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function validateAudioFile(file: File): AudioValidationError | null {
  if (file.size > MAX_AUDIO_BYTES) {
    return { code: "file_too_large", message: "El archivo supera el límite de 25 MB." };
  }

  const ext = extensionOf(file.name || "");
  const looksLikeAudio = ALLOWED_EXTENSIONS.includes(ext) || Boolean(file.type && file.type.startsWith("audio/"));
  if (!looksLikeAudio) {
    return {
      code: "invalid_format",
      message: "Formato no válido. Usa mp3, m4a, wav, ogg, opus o webm.",
    };
  }

  return null;
}
