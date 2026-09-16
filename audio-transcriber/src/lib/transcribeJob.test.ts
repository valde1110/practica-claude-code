import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetDbForTests, getJob } from "./history";

vi.mock("./extractAudio", () => ({
  extractAudioChunks: vi.fn(),
}));
vi.mock("./transcribeApi", () => ({
  transcribeAudio: vi.fn(),
}));

import { extractAudioChunks } from "./extractAudio";
import { transcribeAudio } from "./transcribeApi";
import { processJob, startJob } from "./transcribeJob";

const mockedExtract = vi.mocked(extractAudioChunks);
const mockedTranscribe = vi.mocked(transcribeAudio);

function chunkBlob(text: string) {
  return new Blob([text], { type: "audio/ogg" });
}

beforeEach(async () => {
  await __resetDbForTests();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase("voz-a-texto");
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
  mockedExtract.mockReset();
  mockedTranscribe.mockReset();
});

describe("startJob", () => {
  it("extracts, transcribes every chunk in order, and finalizes the job", async () => {
    mockedExtract.mockImplementation(async (_file, onProgress) => {
      onProgress?.({ stage: "loading", ratio: 1 });
      onProgress?.({ stage: "extracting", ratio: 1 });
      return [chunkBlob("a"), chunkBlob("b"), chunkBlob("c")];
    });
    mockedTranscribe
      .mockResolvedValueOnce({ ok: true, text: "primera parte." })
      .mockResolvedValueOnce({ ok: true, text: "segunda parte." })
      .mockResolvedValueOnce({ ok: true, text: "tercera parte." });

    const progressEvents: string[] = [];
    const job = await startJob(new File([new Uint8Array(10)], "video.mp4", { type: "video/mp4" }), {
      onProgress: (p) => progressEvents.push(`${p.stage}:${p.chunkIndex ?? ""}`),
    });

    expect(mockedTranscribe).toHaveBeenCalledTimes(3);
    expect(job.status).toBe("done");
    expect(job.fullText).toBe("primera parte. segunda parte. tercera parte.");
    expect(job.chunks.every((c) => c.blob === null)).toBe(true); // cleaned up after finalize
    expect(progressEvents).toContain("extracting:");
    expect(progressEvents.some((e) => e.startsWith("transcribing:"))).toBe(true);
  });

  it("stops and records the error message when a chunk fails", async () => {
    mockedExtract.mockResolvedValue([chunkBlob("a"), chunkBlob("b")]);
    mockedTranscribe
      .mockResolvedValueOnce({ ok: true, text: "ok." })
      .mockResolvedValueOnce({ ok: false, code: "rate_limited", message: "Límite de Groq alcanzado." });

    const file = new File([new Uint8Array(10)], "video.mp4", { type: "video/mp4" });
    await expect(startJob(file)).rejects.toThrow("Límite de Groq alcanzado.");

    const jobs = await import("./history").then((m) => m.listJobs());
    expect(jobs).toHaveLength(1);
    expect(jobs[0].status).toBe("error");
    expect(jobs[0].errorMessage).toBe("Límite de Groq alcanzado.");
    // The already-transcribed first chunk's progress must survive the failure.
    expect(jobs[0].chunks[0].done).toBe(true);
    expect(jobs[0].chunks[1].done).toBe(false);
  });
});

describe("processJob (resume)", () => {
  it("only transcribes the chunks that weren't done yet", async () => {
    mockedExtract.mockResolvedValue([chunkBlob("a"), chunkBlob("b")]);
    mockedTranscribe
      .mockResolvedValueOnce({ ok: true, text: "ok." })
      .mockResolvedValueOnce({ ok: false, code: "network_error", message: "Sin conexión." });

    const file = new File([new Uint8Array(10)], "video.mp4", { type: "video/mp4" });
    await expect(startJob(file)).rejects.toThrow("Sin conexión.");

    const [job] = await import("./history").then((m) => m.listJobs());
    mockedTranscribe.mockReset();
    mockedTranscribe.mockResolvedValueOnce({ ok: true, text: "segunda parte." });

    const resumed = await processJob(job.id);

    expect(mockedTranscribe).toHaveBeenCalledTimes(1); // only the pending chunk
    expect(resumed.status).toBe("done");
    expect(resumed.fullText).toBe("ok. segunda parte.");
  });

  it("fails clearly if a chunk's audio was already discarded", async () => {
    mockedExtract.mockResolvedValue([chunkBlob("a")]);
    mockedTranscribe.mockResolvedValueOnce({ ok: true, text: "ok." });

    const file = new File([new Uint8Array(10)], "video.mp4", { type: "video/mp4" });
    const job = await startJob(file); // finalized -> blobs cleared

    await expect(processJob(job.id)).resolves.toBeDefined(); // already done, no pending chunks, no-op

    const stored = await getJob(job.id);
    expect(stored?.status).toBe("done");
  });
});
