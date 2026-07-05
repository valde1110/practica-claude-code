import { createWorker, OEM } from "tesseract.js";

const base = import.meta.env.BASE_URL;

export async function recognizeText(image: File | Blob): Promise<string> {
  const worker = await createWorker("spa", OEM.LSTM_ONLY, {
    workerPath: `${base}tesseract/worker.min.js`,
    corePath: `${base}tesseract-core/`,
    langPath: `${base}tessdata/`,
  });
  try {
    const {
      data: { text },
    } = await worker.recognize(image);
    return text;
  } finally {
    await worker.terminate();
  }
}
