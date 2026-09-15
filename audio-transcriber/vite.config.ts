import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
      injectRegister: "auto",
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
        type: "module",
      },
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Voz a Texto",
        short_name: "Voz a Texto",
        description: "Transcribe notas de voz y audios a texto en español.",
        theme_color: "#111827",
        background_color: "#111827",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "es",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        // Recibe audios compartidos desde WhatsApp y otras apps (Android).
        // El service worker intercepta este POST en el evento "fetch".
        share_target: {
          action: "/share-target",
          method: "POST",
          enctype: "multipart/form-data",
          params: {
            files: [
              {
                name: "audio",
                accept: [
                  "audio/*",
                  ".mp3",
                  ".m4a",
                  ".wav",
                  ".ogg",
                  ".opus",
                  ".webm",
                ],
              },
            ],
          },
        },
        shortcuts: [
          {
            name: "Grabar",
            short_name: "Grabar",
            description: "Abrir la grabadora de audio",
            url: "/?action=record",
            icons: [
              { src: "icons/shortcut-record-96.png", sizes: "96x96", type: "image/png" },
            ],
          },
          {
            name: "Subir audio",
            short_name: "Subir",
            description: "Elegir un archivo de audio para transcribir",
            url: "/?action=upload",
            icons: [
              { src: "icons/shortcut-upload-96.png", sizes: "96x96", type: "image/png" },
            ],
          },
        ],
      } as any,
    }),
  ],
  server: {
    port: 5173,
  },
});
