import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { __resetDbForTests, createJob, deleteJob, finalizeJob, getJob, listJobs, saveJob } from "./history";

function makeBlob(text: string) {
  return new Blob([text], { type: "audio/ogg" });
}

beforeEach(async () => {
  // Close any cached connection first so the delete below isn't blocked, then
  // start each test from a clean database.
  await __resetDbForTests();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("voz-a-texto");
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
});

describe("history (IndexedDB)", () => {
  it("creates a job with pending chunks", async () => {
    const job = await createJob("nota.mp4", [makeBlob("a"), makeBlob("b")]);
    expect(job.status).toBe("processing");
    expect(job.chunks).toHaveLength(2);
    expect(job.chunks.every((c) => !c.done)).toBe(true);
    expect(job.fullText).toBe("");
  });

  it("persists progress and can be read back", async () => {
    const job = await createJob("video.mov", [makeBlob("a"), makeBlob("b")]);
    job.chunks[0].done = true;
    job.chunks[0].text = "hola";
    job.fullText = "hola";
    await saveJob(job);

    const reloaded = await getJob(job.id);
    expect(reloaded?.chunks[0].done).toBe(true);
    expect(reloaded?.fullText).toBe("hola");
    expect(reloaded?.chunks[1].done).toBe(false);
  });

  it("lists jobs newest first", async () => {
    const first = await createJob("uno.mp4", [makeBlob("a")]);
    await new Promise((r) => setTimeout(r, 2));
    const second = await createJob("dos.mp4", [makeBlob("a")]);

    const jobs = await listJobs();
    expect(jobs.map((j) => j.id)).toEqual([second.id, first.id]);
  });

  it("finalizeJob marks done and discards chunk blobs", async () => {
    const job = await createJob("tres.mp4", [makeBlob("a"), makeBlob("b")]);
    job.fullText = "texto completo";
    await saveJob(job);

    await finalizeJob(job.id);

    const done = await getJob(job.id);
    expect(done?.status).toBe("done");
    expect(done?.fullText).toBe("texto completo");
    expect(done?.chunks.every((c) => c.blob === null)).toBe(true);
  });

  it("deleteJob removes the entry", async () => {
    const job = await createJob("cuatro.mp4", [makeBlob("a")]);
    await deleteJob(job.id);
    expect(await getJob(job.id)).toBeUndefined();
  });
});
