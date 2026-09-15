const SHARE_CACHE = "shared-audio-v1";
const SHARE_KEY = "/shared-audio";

export function hasIncomingShare(): boolean {
  return new URLSearchParams(window.location.search).get("share-target") === "1";
}

export async function consumeSharedAudio(): Promise<File | null> {
  if (!("caches" in window)) return null;
  try {
    const cache = await caches.open(SHARE_CACHE);
    const response = await cache.match(SHARE_KEY);
    if (!response) return null;
    await cache.delete(SHARE_KEY);
    const blob = await response.blob();
    const filename = decodeURIComponent(response.headers.get("X-Shared-Filename") || "audio-compartido");
    return new File([blob], filename, { type: blob.type || "audio/webm" });
  } catch {
    return null;
  }
}

export function clearUrlParams(...keys: string[]): void {
  const url = new URL(window.location.href);
  for (const key of keys) url.searchParams.delete(key);
  window.history.replaceState({}, "", url.toString());
}
