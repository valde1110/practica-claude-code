import { describe, expect, it } from "vitest";
import { needsJobPipeline, validateMediaFile } from "./validateMedia";

function makeFile(name: string, type: string, bytes = 100) {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("validateMediaFile", () => {
  it("accepts a normal audio file", () => {
    expect(validateMediaFile(makeFile("nota.mp3", "audio/mpeg"))).toBeNull();
  });

  it("accepts a video file", () => {
    expect(validateMediaFile(makeFile("clip.mp4", "video/mp4"))).toBeNull();
  });

  it("accepts a .mov even without a matching MIME type", () => {
    expect(validateMediaFile(makeFile("iphone.mov", ""))).toBeNull();
  });

  it("rejects unrecognized formats", () => {
    const result = validateMediaFile(makeFile("documento.pdf", "application/pdf"));
    expect(result?.code).toBe("invalid_format");
  });

  it("rejects files over the 2 GB sanity cap", () => {
    const huge = makeFile("enorme.mp4", "video/mp4", 2 * 1024 * 1024 * 1024 + 1);
    const result = validateMediaFile(huge);
    expect(result?.code).toBe("file_too_large");
  });
});

describe("needsJobPipeline", () => {
  it("is false for small audio (goes through the simple path)", () => {
    expect(needsJobPipeline(makeFile("nota.mp3", "audio/mpeg", 1000))).toBe(false);
  });

  it("is true for audio over 25 MB", () => {
    expect(needsJobPipeline(makeFile("largo.mp3", "audio/mpeg", 25 * 1024 * 1024 + 1))).toBe(true);
  });

  it("is true for any video, regardless of size", () => {
    expect(needsJobPipeline(makeFile("clip.mp4", "video/mp4", 1000))).toBe(true);
  });
});
