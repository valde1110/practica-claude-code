import { describe, expect, it, vi } from "vitest";
import { handleFetchUrlRequest } from "./fetch-media-logic.ts";

function makeRequest(body: unknown, { method = "POST" }: { method?: string } = {}) {
  return new Request("https://example.com/api/fetch-url", {
    method,
    body: method === "POST" ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
}

function upstreamAudioResponse(bytes: number, { contentLength }: { contentLength?: number } = {}) {
  const data = new Uint8Array(bytes);
  const headers = new Headers({ "Content-Type": "audio/mpeg" });
  if (contentLength !== undefined) headers.set("Content-Length", String(contentLength));
  return new Response(data, { status: 200, headers });
}

describe("handleFetchUrlRequest", () => {
  it("rejects non-POST requests", async () => {
    const res = await handleFetchUrlRequest(makeRequest(null, { method: "GET" }), { fetchImpl: vi.fn() });
    expect(res.status).toBe(405);
  });

  it("rejects a missing url", async () => {
    const res = await handleFetchUrlRequest(makeRequest({}), { fetchImpl: vi.fn() });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_request");
  });

  it("rejects a malformed url", async () => {
    const res = await handleFetchUrlRequest(makeRequest({ url: "not a url" }), { fetchImpl: vi.fn() });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_url");
  });

  it("rejects non-http(s) schemes", async () => {
    const res = await handleFetchUrlRequest(makeRequest({ url: "file:///etc/passwd" }), { fetchImpl: vi.fn() });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_url");
  });

  it.each([
    "http://localhost/secret",
    "http://127.0.0.1/secret",
    "http://169.254.169.254/latest/meta-data/",
    "http://10.0.0.5/internal",
    "http://192.168.1.1/internal",
    "http://172.16.0.5/internal",
  ])("blocks private/loopback/link-local host %s", async (url) => {
    const res = await handleFetchUrlRequest(makeRequest({ url }), { fetchImpl: vi.fn() });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_url");
  });

  it("allows a normal public hostname through to fetch", async () => {
    const fetchImpl = vi.fn(async () => upstreamAudioResponse(1000, { contentLength: 1000 }));
    const res = await handleFetchUrlRequest(makeRequest({ url: "https://example.com/audio.mp3" }), { fetchImpl });
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledWith("https://example.com/audio.mp3", { redirect: "follow" });
  });

  it("streams the body through with the right content-type and filename", async () => {
    const fetchImpl = vi.fn(async () => upstreamAudioResponse(2048, { contentLength: 2048 }));
    const res = await handleFetchUrlRequest(makeRequest({ url: "https://cdn.example.com/podcasts/episodio-1.mp3" }), {
      fetchImpl,
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("audio/mpeg");
    expect(res.headers.get("Content-Disposition")).toContain("episodio-1.mp3");
    const bytes = await res.arrayBuffer();
    expect(bytes.byteLength).toBe(2048);
  });

  it("rejects upfront when Content-Length already exceeds 20 MB", async () => {
    const fetchImpl = vi.fn(async () => upstreamAudioResponse(10, { contentLength: 21 * 1024 * 1024 }));
    const res = await handleFetchUrlRequest(makeRequest({ url: "https://example.com/big.mp4" }), { fetchImpl });
    expect(res.status).toBe(413);
    expect((await res.json()).error).toBe("file_too_large");
  });

  it("aborts mid-stream if the upstream lies about its size", async () => {
    const bigButUndeclaredSize = 21 * 1024 * 1024;
    const fetchImpl = vi.fn(async () => upstreamAudioResponse(bigButUndeclaredSize));
    const res = await handleFetchUrlRequest(makeRequest({ url: "https://example.com/sneaky.mp3" }), { fetchImpl });
    expect(res.status).toBe(200); // headers already sent before the overflow is detected
    await expect(res.arrayBuffer()).rejects.toThrow();
  });

  it("maps a fetch failure to network_error", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const res = await handleFetchUrlRequest(makeRequest({ url: "https://example.com/audio.mp3" }), { fetchImpl });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("network_error");
  });

  it("maps a non-2xx upstream response to fetch_failed", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 404 }));
    const res = await handleFetchUrlRequest(makeRequest({ url: "https://example.com/missing.mp3" }), { fetchImpl });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("fetch_failed");
  });
});
