import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "voz-a-texto";
const DB_VERSION = 1;
const STORE = "jobs";

export interface JobChunk {
  index: number;
  /** Cleared once the job is fully transcribed, to keep IndexedDB usage bounded. */
  blob: Blob | null;
  text: string | null;
  done: boolean;
}

export type JobStatus = "processing" | "done" | "error";

export interface TranscriptionJob {
  id: string;
  createdAt: number;
  updatedAt: number;
  sourceName: string;
  status: JobStatus;
  chunks: JobChunk[];
  fullText: string;
  errorMessage?: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

/** Test-only: closes and drops the cached connection so each test starts from a clean database. */
export async function __resetDbForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
  }
  dbPromise = null;
}

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
        }
      },
    });
  }
  return dbPromise;
}

function newJobId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `job-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Records a transcript produced by the simple (single-call) path directly as a finished job. */
export async function saveSimpleResult(sourceName: string, text: string): Promise<TranscriptionJob> {
  const now = Date.now();
  const job: TranscriptionJob = {
    id: newJobId(),
    createdAt: now,
    updatedAt: now,
    sourceName,
    status: "done",
    chunks: [{ index: 0, blob: null, text, done: true }],
    fullText: text,
  };
  const db = await getDb();
  await db.put(STORE, job);
  return job;
}

export async function createJob(sourceName: string, chunkBlobs: Blob[]): Promise<TranscriptionJob> {
  const now = Date.now();
  const job: TranscriptionJob = {
    id: newJobId(),
    createdAt: now,
    updatedAt: now,
    sourceName,
    status: "processing",
    chunks: chunkBlobs.map((blob, index) => ({ index, blob, text: null, done: false })),
    fullText: "",
  };
  const db = await getDb();
  await db.put(STORE, job);
  return job;
}

export async function saveJob(job: TranscriptionJob): Promise<void> {
  job.updatedAt = Date.now();
  const db = await getDb();
  await db.put(STORE, job);
}

export async function getJob(id: string): Promise<TranscriptionJob | undefined> {
  const db = await getDb();
  return db.get(STORE, id);
}

export async function listJobs(): Promise<TranscriptionJob[]> {
  const db = await getDb();
  const jobs = await db.getAllFromIndex(STORE, "createdAt");
  return jobs.reverse();
}

export async function deleteJob(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}

/** Marks a job as finished and discards its audio chunks (only the text is worth keeping). */
export async function finalizeJob(id: string): Promise<void> {
  const job = await getJob(id);
  if (!job) return;
  job.status = "done";
  job.chunks = job.chunks.map((chunk) => ({ ...chunk, blob: null }));
  await saveJob(job);
}
