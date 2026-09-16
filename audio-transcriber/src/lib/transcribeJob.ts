import { extractAudioChunks } from "./extractAudio";
import { transcribeAudio } from "./transcribeApi";
import { createJob, finalizeJob, getJob, saveJob, type TranscriptionJob } from "./history";

export type JobRunStage = "extracting" | "transcribing";

export interface JobRunProgress {
  stage: JobRunStage;
  ratio: number; // 0..1
  chunkIndex?: number;
  chunkTotal?: number;
}

export interface JobRunCallbacks {
  onProgress?: (progress: JobRunProgress) => void;
}

/** Extracts + chunks a video (or oversized audio) file, saves it as a new job, and transcribes it. */
export async function startJob(file: File, callbacks: JobRunCallbacks = {}): Promise<TranscriptionJob> {
  const chunks = await extractAudioChunks(file, (p) => {
    callbacks.onProgress?.({ stage: "extracting", ratio: p.ratio });
  });
  const job = await createJob(file.name, chunks);
  return processJob(job.id, callbacks);
}

/**
 * Transcribes whichever chunks of a job aren't done yet. Safe to call again
 * on a job that was interrupted (tab closed, network drop) - already-done
 * chunks are skipped and progress keeps being saved as it goes.
 */
export async function processJob(jobId: string, callbacks: JobRunCallbacks = {}): Promise<TranscriptionJob> {
  const job = await getJob(jobId);
  if (!job) {
    throw new Error("No se encontró el trabajo de transcripción.");
  }

  const total = job.chunks.length;

  for (const chunk of job.chunks) {
    if (chunk.done) continue;

    callbacks.onProgress?.({
      stage: "transcribing",
      ratio: chunk.index / total,
      chunkIndex: chunk.index,
      chunkTotal: total,
    });

    if (!chunk.blob) {
      job.status = "error";
      job.errorMessage =
        "Falta el audio de una parte de este trabajo, no se puede reanudar. Vuelve a intentarlo desde el archivo original.";
      await saveJob(job);
      throw new Error(job.errorMessage);
    }

    const chunkFile = new File([chunk.blob], `${job.id}-part${chunk.index}.ogg`, {
      type: chunk.blob.type || "audio/ogg",
    });
    const result = await transcribeAudio(chunkFile);

    if (!result.ok) {
      job.status = "error";
      job.errorMessage = result.message;
      await saveJob(job);
      throw new Error(result.message);
    }

    chunk.done = true;
    chunk.text = result.text;
    job.fullText = job.chunks
      .filter((c) => c.done)
      .sort((a, b) => a.index - b.index)
      .map((c) => c.text)
      .join(" ")
      .trim();
    await saveJob(job);
  }

  callbacks.onProgress?.({ stage: "transcribing", ratio: 1, chunkIndex: total, chunkTotal: total });
  await finalizeJob(job.id);

  const finished = await getJob(job.id);
  if (!finished) throw new Error("El trabajo desapareció durante el procesado.");
  return finished;
}
