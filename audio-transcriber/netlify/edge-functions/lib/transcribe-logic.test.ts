import { describe, expect, it, vi } from "vitest";
import { handleTranscribeRequest } from "./transcribe-logic.ts";

function makeAudioFile({ name = "nota.webm", type = "audio/webm", bytes = 10 } = {}) {
  return new File([new Uint8Array(bytes)], name, { type });
}

function makeRequest(file: File | null, { method = "POST" }: { method?: string } = {}) {
  const form = new FormData();
  if (file) form.append("file", file);
  return new Request("https://example.com/api/transcribe", { method, body: method === "POST" ? form : undefined });
}

describe("handleTranscribeRequest", () => {
  it("rejects non-POST requests", async () => {
    const res = await handleTranscribeRequest(makeRequest(null, { method: "GET" }), {
      apiKey: "key",
      fetchImpl: vi.fn(),
    });
    expect(res.status).toBe(405);
    expect((await res.json()).error).toBe("method_not_allowed");
  });

  it("fails with server_misconfigured when GROQ_API_KEY is missing", async () => {
    const res = await handleTranscribeRequest(makeRequest(makeAudioFile()), {
      apiKey: undefined,
      fetchImpl: vi.fn(),
    });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("server_misconfigured");
  });

  it("rejects a request with no file", async () => {
    const res = await handleTranscribeRequest(makeRequest(null), { apiKey: "key", fetchImpl: vi.fn() });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_request");
  });

  it("rejects files larger than 25 MB", async () => {
    const big = makeAudioFile({ bytes: 25 * 1024 * 1024 + 1 });
    const res = await handleTranscribeRequest(makeRequest(big), { apiKey: "key", fetchImpl: vi.fn() });
    expect(res.status).toBe(413);
    expect((await res.json()).error).toBe("file_too_large");
  });

  it("accepts a file exactly at the 25 MB limit", async () => {
    const exact = makeAudioFile({ bytes: 25 * 1024 * 1024 });
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ text: "hola" }), { status: 200 }));
    const res = await handleTranscribeRequest(makeRequest(exact), { apiKey: "key", fetchImpl });
    expect(res.status).toBe(200);
  });

  it("rejects unsupported formats", async () => {
    const badFile = makeAudioFile({ name: "video.mp4", type: "video/mp4" });
    const res = await handleTranscribeRequest(makeRequest(badFile), { apiKey: "key", fetchImpl: vi.fn() });
    expect(res.status).toBe(415);
    expect((await res.json()).error).toBe("invalid_format");
  });

  it("accepts files whose extension is missing but MIME type is audio/*", async () => {
    const blobFile = makeAudioFile({ name: "blob", type: "audio/webm;codecs=opus" });
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ text: "hola" }), { status: 200 }));
    const res = await handleTranscribeRequest(makeRequest(blobFile), { apiKey: "key", fetchImpl });
    expect(res.status).toBe(200);
  });

  it("forwards the file to Groq with the right model, language and auth header", async () => {
    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedInit = init;
      return new Response(JSON.stringify({ text: "hola mundo" }), { status: 200 });
    });

    const res = await handleTranscribeRequest(makeRequest(makeAudioFile()), { apiKey: "secret-key", fetchImpl });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ text: "hola mundo" });
    expect(capturedUrl).toBe("https://api.groq.com/openai/v1/audio/transcriptions");
    expect((capturedInit?.headers as Record<string, string>).Authorization).toBe("Bearer secret-key");

    const sentForm = capturedInit?.body as FormData;
    expect(sentForm.get("model")).toBe("whisper-large-v3-turbo");
    expect(sentForm.get("language")).toBe("es");
    expect(sentForm.get("file")).toBeInstanceOf(File);
  });

  it("maps a Groq 429 to rate_limited", async () => {
    const fetchImpl = vi.fn(async () => new Response("too many requests", { status: 429 }));
    const res = await handleTranscribeRequest(makeRequest(makeAudioFile()), { apiKey: "key", fetchImpl });
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe("rate_limited");
  });

  it("maps a Groq 401 to server_misconfigured", async () => {
    const fetchImpl = vi.fn(async () => new Response("unauthorized", { status: 401 }));
    const res = await handleTranscribeRequest(makeRequest(makeAudioFile()), { apiKey: "bad-key", fetchImpl });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("server_misconfigured");
  });

  it("maps other Groq errors to groq_error", async () => {
    const fetchImpl = vi.fn(async () => new Response("boom", { status: 500 }));
    const res = await handleTranscribeRequest(makeRequest(makeAudioFile()), { apiKey: "key", fetchImpl });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("groq_error");
  });

  it("maps a fetch failure (no network) to network_error", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const res = await handleTranscribeRequest(makeRequest(makeAudioFile()), { apiKey: "key", fetchImpl });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("network_error");
  });

  it("returns groq_error when Groq responds without text", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ oops: true }), { status: 200 }));
    const res = await handleTranscribeRequest(makeRequest(makeAudioFile()), { apiKey: "key", fetchImpl });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("groq_error");
  });
});
