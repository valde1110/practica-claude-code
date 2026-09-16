// Lets someone paste a direct link to an audio/video file instead of
// uploading it. Runs server-side (not in the browser) for two reasons:
// most hosts don't send permissive CORS headers, so a browser-side fetch
// would just fail; and this keeps the "no secrets in the frontend" pattern
// consistent with /api/transcribe, even though this endpoint has none.

export interface FetchUrlDeps {
  fetchImpl: typeof fetch;
}

// Netlify caps streaming Edge Function responses at ~20 MB - this proxy
// can't exceed that regardless of our own /api/transcribe limit.
const MAX_BYTES = 20 * 1024 * 1024;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

const PRIVATE_HOSTNAMES = new Set(["localhost", "0.0.0.0", "::1", "[::1]"]);

/**
 * Blocks the obvious SSRF targets (loopback, private/link-local ranges,
 * cloud metadata endpoints) by inspecting the hostname/IP literal. This is
 * a best-effort check for a single-user personal app, not a hardened
 * multi-tenant SSRF defense (e.g. it doesn't resolve DNS to catch
 * rebinding attacks).
 */
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (PRIVATE_HOSTNAMES.has(host) || host.endsWith(".localhost")) return true;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 127) return true; // loopback
    if (a === 10) return true; // private
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 0) return true;
  }
  return false;
}

function filenameFromUrl(url: URL): string {
  const last = url.pathname.split("/").filter(Boolean).pop();
  if (!last) return "audio-descargado";
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

/** Caps the actual bytes streamed through, in case the upstream lies about (or omits) Content-Length. */
function limitStream(stream: ReadableStream<Uint8Array>, maxBytes: number): ReadableStream<Uint8Array> {
  let total = 0;
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      total += chunk.byteLength;
      if (total > maxBytes) {
        controller.error(new Error("file_too_large"));
        return;
      }
      controller.enqueue(chunk);
    },
  });
  return stream.pipeThrough(transform);
}

export async function handleFetchUrlRequest(request: Request, deps: FetchUrlDeps): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed", message: "Usa POST para descargar desde una URL." }, 405);
  }

  let body: { url?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_request", message: "Cuerpo de la petición inválido." }, 400);
  }

  const rawUrl = typeof body.url === "string" ? body.url.trim() : "";
  if (!rawUrl) {
    return jsonResponse({ error: "invalid_request", message: "Falta la URL." }, 400);
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return jsonResponse({ error: "invalid_url", message: "La URL no es válida." }, 400);
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return jsonResponse({ error: "invalid_url", message: "Solo se admiten URLs http o https." }, 400);
  }
  if (isBlockedHost(target.hostname)) {
    return jsonResponse({ error: "invalid_url", message: "Esa URL no está permitida." }, 400);
  }

  let upstream: Response;
  try {
    upstream = await deps.fetchImpl(target.toString(), { redirect: "follow" });
  } catch {
    return jsonResponse(
      { error: "network_error", message: "No se pudo descargar el archivo de esa URL." },
      502,
    );
  }

  if (!upstream.ok) {
    return jsonResponse(
      { error: "fetch_failed", message: `El servidor de esa URL respondió con un error (${upstream.status}).` },
      502,
    );
  }

  const contentLength = upstream.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BYTES) {
    return jsonResponse(
      {
        error: "file_too_large",
        message: "El archivo de esa URL supera los 20 MB, el límite para traerlo directamente. Descárgalo y súbelo desde el dispositivo.",
      },
      413,
    );
  }

  if (!upstream.body) {
    return jsonResponse({ error: "fetch_failed", message: "La URL no devolvió ningún contenido." }, 502);
  }

  const contentType = upstream.headers.get("content-type") || "application/octet-stream";
  const filename = filenameFromUrl(target);

  return new Response(limitStream(upstream.body, MAX_BYTES), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
    },
  });
}
