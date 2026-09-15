import { describe, expect, it } from "vitest";
import { validateAudioFile } from "./validateAudio";

function makeFile(name: string, type: string, bytes = 100) {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("validateAudioFile", () => {
  it("accepts a normal mp3 file", () => {
    expect(validateAudioFile(makeFile("nota.mp3", "audio/mpeg"))).toBeNull();
  });

  it("accepts a recorded blob without a real extension but audio mime", () => {
    expect(validateAudioFile(makeFile("blob", "audio/webm;codecs=opus"))).toBeNull();
  });

  it("rejects files over 25 MB", () => {
    const result = validateAudioFile(makeFile("grande.mp3", "audio/mpeg", 25 * 1024 * 1024 + 1));
    expect(result?.code).toBe("file_too_large");
  });

  it("rejects non-audio formats", () => {
    const result = validateAudioFile(makeFile("video.mp4", "video/mp4"));
    expect(result?.code).toBe("invalid_format");
  });
});
