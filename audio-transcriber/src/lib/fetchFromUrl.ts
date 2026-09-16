export interface FetchUrlSuccess {
  ok: true;
  file: File;
}

export interface FetchUrlFailure {
  ok: false;
  code: string;
  message: string;
}

export type FetchUrlResult = FetchUrlSuccess | FetchUrlFailure;

const ENDPOINT = "/api/fetch-url";

function filenameFromContentDisposition(header: string | null): string | null {
  const match = header?.match(/filename="([^"]*)"/);
  return match?.[1] || null;
}

export async function fetchMediaFromUrl(url: string): Promise<FetchUrlResult> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch {
    return {
      ok: false,
      code: "network_error",
      message: "No se pudo conectar. Comprueba tu conexión a internet e inténtalo de nuevo.",
    };
  }

  if (!response.ok) {
    let data: { error?: string; message?: string } | null = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    return {
      ok: false,
      code: data?.error ?? "unknown_error",
      message: data?.message ?? "No se pudo descargar el archivo de esa URL.",
    };
  }

  let bytes: ArrayBuffer;
  try {
    bytes = await response.arrayBuffer();
  } catch {
    return {
      ok: false,
      code: "network_error",
      message: "La descarga se interrumpió. Puede que el archivo sea demasiado grande o la conexión falló.",
    };
  }

  const filename = filenameFromContentDisposition(response.headers.get("content-disposition")) || "audio-descargado";
  const contentType = response.headers.get("content-type") || "application/octet-stream";

  return { ok: true, file: new File([bytes], filename, { type: contentType }) };
}
