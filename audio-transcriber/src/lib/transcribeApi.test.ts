import { afterEach, describe, expect, it, vi } from "vitest";
import { transcribeAudio } from "./transcribeApi";

function makeFile() {
  return new File([new Uint8Array(10)], "nota.webm", { type: "audio/webm" });
}

describe("transcribeAudio", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the transcribed text on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ text: "hola mundo" }), { status: 200 })),
    );
    const result = await transcribeAudio(makeFile());
    expect(result).toEqual({ ok: true, text: "hola mundo" });
  });

  it("surfaces the server's error code and message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "file_too_large", message: "El archivo supera 25 MB." }), {
            status: 413,
          }),
      ),
    );
    const result = await transcribeAudio(makeFile());
    expect(result).toEqual({ ok: false, code: "file_too_large", message: "El archivo supera 25 MB." });
  });

  it("returns network_error when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    const result = await transcribeAudio(makeFile());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("network_error");
  });
});
