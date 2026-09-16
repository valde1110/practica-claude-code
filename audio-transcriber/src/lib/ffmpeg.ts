import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

// Self-hosted (not loaded from a CDN) so the app keeps working offline once
// installed and doesn't depend on a third party staying online.
const CORE_BASE_URL = "/ffmpeg-core";
const CORE_JS_BYTES = 112_000; // rough sizes, only used to weight the combined download progress
const CORE_WASM_BYTES = 32_200_000;

let instance: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

/** Returns the shared FFmpeg instance, downloading and loading its ~32 MB core the first time. */
export async function getFFmpeg(onDownloadProgress?: (ratio: number) => void): Promise<FFmpeg> {
  if (instance) return instance;
  if (!loading) {
    loading = (async () => {
      const ffmpeg = new FFmpeg();
      const received = { js: 0, wasm: 0 };
      const reportProgress = () => {
        const total = CORE_JS_BYTES + CORE_WASM_BYTES;
        onDownloadProgress?.(Math.min((received.js + received.wasm) / total, 1));
      };

      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, "text/javascript", Boolean(onDownloadProgress), (e) => {
          received.js = e.received;
          reportProgress();
        }),
        toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, "application/wasm", Boolean(onDownloadProgress), (e) => {
          received.wasm = e.received;
          reportProgress();
        }),
      ]);
      await ffmpeg.load({ coreURL, wasmURL });
      instance = ffmpeg;
      return ffmpeg;
    })();
  }
  return loading;
}
