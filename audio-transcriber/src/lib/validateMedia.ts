import { ALLOWED_EXTENSIONS, MAX_AUDIO_BYTES } from "./validateAudio";

export const VIDEO_EXTENSIONS = ["mp4", "mov", "mkv", "avi", "m4v", "3gp"];

// Generous sanity cap on what we'll even try to load into ffmpeg.wasm's
// in-memory filesystem in a mobile browser tab. Well above what a typical
// hour-long phone video needs, but stops someone handing the browser a
// multi-gigabyte file it can't realistically hold in memory.
export const MAX_MEDIA_BYTES = 2 * 1024 * 1024 * 1024;

export interface MediaValidationError {
  code: "file_too_large" | "invalid_format";
  message: string;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function isVideoFile(file: File): boolean {
  const ext = extensionOf(file.name || "");
  return VIDEO_EXTENSIONS.includes(ext) || Boolean(file.type && file.type.startsWith("video/"));
}

function isRecognizedMedia(file: File): boolean {
  if (isVideoFile(file)) return true;
  const ext = extensionOf(file.name || "");
  return ALLOWED_EXTENSIONS.includes(ext) || Boolean(file.type && file.type.startsWith("audio/"));
}

/** Top-level gate for anything the app will accept: audio OR video, up to a large sanity cap. */
export function validateMediaFile(file: File): MediaValidationError | null {
  if (!isRecognizedMedia(file)) {
    return {
      code: "invalid_format",
      message:
        "Formato no válido. Usa un audio (mp3, m4a, wav, ogg, opus, webm) o un vídeo (mp4, mov, mkv, avi, m4v, 3gp).",
    };
  }
  if (file.size > MAX_MEDIA_BYTES) {
    return {
      code: "file_too_large",
      message: "El archivo es demasiado grande para procesarlo en el navegador (límite 2 GB).",
    };
  }
  return null;
}

/** Video always goes through extraction; audio only needs it once it's too big to send directly. */
export function needsJobPipeline(file: File): boolean {
  if (isVideoFile(file)) return true;
  return file.size > MAX_AUDIO_BYTES;
}
