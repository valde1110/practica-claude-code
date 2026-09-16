// Framework-agnostic core of the /api/transcribe endpoint, built on standard
// Web APIs (Request/Response/FormData/File) so it runs unchanged on Netlify's
// Deno-based Edge Functions runtime and under Node in tests.

export interface TranscribeDeps {
  apiKey: string | undefined;
  fetchImpl: typeof fetch;
}

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3-turbo";
const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["mp3", "m4a", "wav", "ogg", "opus", "webm"];

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

function isAllowedFile(file: File): boolean {
  const ext = extensionOf(file.name || "");
  if (ALLOWED_EXTENSIONS.includes(ext)) return true;
  // Recorded blobs often arrive without a real filename (e.g. "blob"),
  // so fall back to the MIME type MediaRecorder/the browser reports.
  return Boolean(file.type && file.type.startsWith("audio/"));
}

export async function handleTranscribeRequest(request: Request, deps: TranscribeDeps): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed", message: "Usa POST para transcribir." }, 405);
  }

  if (!deps.apiKey) {
    return jsonResponse(
      { error: "server_misconfigured", message: "Falta configurar GROQ_API_KEY en el servidor." },
      500,
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ error: "invalid_request", message: "No se pudo leer el archivo enviado." }, 400);
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return jsonResponse({ error: "invalid_request", message: "Falta el archivo de audio." }, 400);
  }

  if (file.size > MAX_BYTES) {
    return jsonResponse({ error: "file_too_large", message: "El archivo supera el límite de 25 MB." }, 413);
  }

  if (!isAllowedFile(file)) {
    return jsonResponse(
      { error: "invalid_format", message: "Formato no válido. Usa mp3, m4a, wav, ogg, opus o webm." },
      415,
    );
  }

  const groqForm = new FormData();
  groqForm.append("file", file, file.name || "audio.webm");
  groqForm.append("model", GROQ_MODEL);
  groqForm.append("language", "es");
  groqForm.append("response_format", "json");

  let groqResponse: Response;
  try {
    groqResponse = await deps.fetchImpl(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${deps.apiKey}` },
      body: groqForm,
    });
  } catch {
    return jsonResponse(
      {
        error: "network_error",
        message: "No se pudo contactar con el servicio de transcripción. Comprueba tu conexión.",
      },
      502,
    );
  }

  if (groqResponse.status === 429) {
    return jsonResponse(
      { error: "rate_limited", message: "Se alcanzó el límite de uso de Groq. Inténtalo de nuevo en unos minutos." },
      429,
    );
  }

  if (groqResponse.status === 401 || groqResponse.status === 403) {
    return jsonResponse(
      { error: "server_misconfigured", message: "La clave de la API de Groq no es válida." },
      500,
    );
  }

  if (!groqResponse.ok) {
    let detail = "";
    try {
      detail = await groqResponse.text();
    } catch {
      // best-effort only
    }
    return jsonResponse(
      { error: "groq_error", message: "El servicio de transcripción devolvió un error.", detail },
      502,
    );
  }

  let data: { text?: string };
  try {
    data = await groqResponse.json();
  } catch {
    return jsonResponse({ error: "groq_error", message: "Respuesta inválida del servicio de transcripción." }, 502);
  }

  if (typeof data.text !== "string") {
    return jsonResponse({ error: "groq_error", message: "El servicio no devolvió texto transcrito." }, 502);
  }

  return jsonResponse({ text: data.text }, 200);
}
