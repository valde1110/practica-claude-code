import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMediaFromUrl } from "./fetchFromUrl";

describe("fetchMediaFromUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a File built from the response body, name and content-type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const headers = new Headers({
          "Content-Type": "audio/mpeg",
          "Content-Disposition": 'inline; filename="episodio-1.mp3"',
        });
        return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers });
      }),
    );

    const result = await fetchMediaFromUrl("https://example.com/episodio-1.mp3");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.file.name).toBe("episodio-1.mp3");
      expect(result.file.type).toBe("audio/mpeg");
      expect(result.file.size).toBe(3);
    }
  });

  it("falls back to a default filename when none is provided", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new Uint8Array([1]), { status: 200, headers: { "Content-Type": "audio/mpeg" } })),
    );

    const result = await fetchMediaFromUrl("https://example.com/stream");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.file.name).toBe("audio-descargado");
  });

  it("surfaces the server's error code and message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "file_too_large", message: "Supera los 20 MB." }), { status: 413 }),
      ),
    );

    const result = await fetchMediaFromUrl("https://example.com/enorme.mp4");
    expect(result).toEqual({ ok: false, code: "file_too_large", message: "Supera los 20 MB." });
  });

  it("returns network_error when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    const result = await fetchMediaFromUrl("https://example.com/audio.mp3");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("network_error");
  });
});
