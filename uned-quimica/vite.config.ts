import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      devOptions: {
        enabled: true,
      },
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "UNED Química",
        short_name: "UNED Química",
        description: "Estudio de las asignaturas del grado en Química de la UNED.",
        theme_color: "#0b0d10",
        background_color: "#0b0d10",
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
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
