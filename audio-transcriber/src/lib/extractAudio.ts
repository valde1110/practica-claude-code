import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg } from "./ffmpeg";

// 15-minute segments at 16 kHz mono/32 kbps opus land around ~3.5 MB each -
// comfortably under Groq's (and our Edge Function's) 25 MB request limit,
// even accounting for VBR variance.
const SEGMENT_SECONDS = 15 * 60;
const AUDIO_BITRATE = "32k";
const SAMPLE_RATE = 16000;

export type ExtractionStage = "loading" | "extracting";

export interface ExtractionProgress {
  stage: ExtractionStage;
  ratio: number; // 0..1
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "dat" : name.slice(dot + 1).toLowerCase();
}

/**
 * Extracts just the audio track from a video (or re-encodes an oversized
 * audio file) and splits it into chunks small enough for a single
 * /api/transcribe call each. Runs entirely in the browser via ffmpeg.wasm.
 */
export async function extractAudioChunks(
  file: File,
  onProgress?: (progress: ExtractionProgress) => void,
): Promise<Blob[]> {
  const t0 = performance.now();
  onProgress?.({ stage: "loading", ratio: 0 });
  console.debug("[extractAudio] getFFmpeg() start");
  const ffmpeg = await getFFmpeg();
  console.debug(`[extractAudio] getFFmpeg() resolved at +${Math.round(performance.now() - t0)}ms`);
  onProgress?.({ stage: "loading", ratio: 1 });

  const handleLog = ({ message }: { message: string }) => console.debug("[ffmpeg-log]", message);
  ffmpeg.on("log", handleLog);

  const inputName = `input-${Date.now()}.${extensionOf(file.name)}`;
  const outputPattern = "chunk_%03d.ogg";

  console.debug(`[extractAudio] writeFile start (${file.size} bytes)`);
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  console.debug(`[extractAudio] writeFile done at +${Math.round(performance.now() - t0)}ms`);

  const handleProgress = ({ progress }: { progress: number }) => {
    console.debug(`[extractAudio] progress event: ${progress}`);
    onProgress?.({ stage: "extracting", ratio: Math.min(Math.max(progress, 0), 1) });
  };
  ffmpeg.on("progress", handleProgress);

  try {
    console.debug(`[extractAudio] exec start at +${Math.round(performance.now() - t0)}ms`);
    await ffmpeg.exec([
      "-i",
      inputName,
      "-vn",
      "-ac",
      "1",
      "-ar",
      String(SAMPLE_RATE),
      "-c:a",
      "libopus",
      "-b:a",
      AUDIO_BITRATE,
      "-f",
      "segment",
      "-segment_time",
      String(SEGMENT_SECONDS),
      "-reset_timestamps",
      "1",
      outputPattern,
    ]);
  } finally {
    ffmpeg.off("progress", handleProgress);
    ffmpeg.off("log", handleLog);
  }
  console.debug(`[extractAudio] exec done at +${Math.round(performance.now() - t0)}ms`);

  const entries = await ffmpeg.listDir("/");
  const chunkNames = entries
    .map((entry) => entry.name)
    .filter((name) => /^chunk_\d+\.ogg$/.test(name))
    .sort();

  if (chunkNames.length === 0) {
    await ffmpeg.deleteFile(inputName).catch(() => {});
    throw new Error("No se pudo extraer audio de este archivo.");
  }

  const chunks: Blob[] = [];
  for (const name of chunkNames) {
    const data = await ffmpeg.readFile(name);
    const bytes = new Uint8Array(data as Uint8Array);
    chunks.push(new Blob([bytes], { type: "audio/ogg" }));
    await ffmpeg.deleteFile(name);
  }
  await ffmpeg.deleteFile(inputName);

  return chunks;
}
