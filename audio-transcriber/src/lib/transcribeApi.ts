export interface TranscribeSuccess {
  ok: true;
  text: string;
}

export interface TranscribeFailure {
  ok: false;
  code: string;
  message: string;
}

export type TranscribeResult = TranscribeSuccess | TranscribeFailure;

const ENDPOINT = "/api/transcribe";

export async function transcribeAudio(file: File): Promise<TranscribeResult> {
  const form = new FormData();
  form.append("file", file, file.name || "audio.webm");

  let response: Response;
  try {
    response = await fetch(ENDPOINT, { method: "POST", body: form });
  } catch {
    return {
      ok: false,
      code: "network_error",
      message: "No se pudo conectar. Comprueba tu conexión a internet e inténtalo de nuevo.",
    };
  }

  let data: { error?: string; message?: string; text?: string } | null = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      code: data?.error ?? "unknown_error",
      message: data?.message ?? "No se pudo transcribir el audio. Inténtalo de nuevo.",
    };
  }

  if (!data || typeof data.text !== "string") {
    return { ok: false, code: "unknown_error", message: "Respuesta inesperada del servidor." };
  }

  return { ok: true, text: data.text };
}
