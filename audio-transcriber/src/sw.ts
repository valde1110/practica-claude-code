/// <reference lib="webworker" />
// @ts-nocheck
import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const SHARE_TARGET_PATH = "/share-target";
const SHARE_CACHE = "shared-audio-v1";
const SHARE_KEY = "/shared-audio";

// Captures audio shared from other apps (e.g. WhatsApp) via the Web Share
// Target API. The browser POSTs the shared file straight to this URL; we
// intercept it here, stash the file in the Cache Storage API, and redirect
// back into the app so it can pick it up and start transcribing.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.pathname === SHARE_TARGET_PATH) {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio");
    if (file && typeof file === "object" && "arrayBuffer" in file) {
      const cache = await caches.open(SHARE_CACHE);
      await cache.put(
        SHARE_KEY,
        new Response(file, {
          headers: {
            "Content-Type": file.type || "application/octet-stream",
            "X-Shared-Filename": encodeURIComponent(file.name || "audio-compartido"),
          },
        }),
      );
    }
  } catch {
    // If parsing fails the app will simply show "no audio received".
  }
  return Response.redirect("/?share-target=1", 303);
}
