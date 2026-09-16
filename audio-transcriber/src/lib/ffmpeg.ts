import { FFmpeg } from "@ffmpeg/ffmpeg";

// Same-origin, real HTTP paths (not blob: URLs). ffmpeg.wasm's worker derives
// the .wasm path from the .js URL it's given, which only works reliably for
// a normal same-origin URL - the blob-URL + hash-encoded-config trick their
// examples use is meant for loading from a *cross-origin* CDN and turned out
// to hang indefinitely in this app's sandboxed/headless test environment.
// Self-hosted (not a CDN) so the app keeps working offline once installed.
const CORE_JS_URL = "/ffmpeg-core/ffmpeg-core.js";
const CORE_WASM_URL = "/ffmpeg-core/ffmpeg-core.wasm";

let instance: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

/** Returns the shared FFmpeg instance, loading its ~32 MB core the first time. */
export async function getFFmpeg(): Promise<FFmpeg> {
  if (instance) return instance;
  if (!loading) {
    loading = (async () => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({ coreURL: CORE_JS_URL, wasmURL: CORE_WASM_URL });
      instance = ffmpeg;
      return ffmpeg;
    })();
  }
  return loading;
}
