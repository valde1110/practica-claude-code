# Voz a Texto

PWA en español para transcribir notas de voz y archivos de audio a texto,
usando la API de Groq (`whisper-large-v3-turbo`). Pensada para instalarse
en Android y recibir audios compartidos directamente desde WhatsApp y otras
apps.

## Stack

- **Frontend**: Vite + React + TypeScript, PWA con `vite-plugin-pwa`
  (estrategia `injectManifest`, service worker propio en `src/sw.ts`).
- **Backend**: una única Netlify Edge Function (`netlify/edge-functions/transcribe.ts`)
  que reenvía el audio a la API de Groq. La clave `GROQ_API_KEY` vive solo
  en el servidor, nunca se expone al frontend.

Se usa una **Edge Function** (no una Function clásica) a propósito: las
Functions clásicas de Netlify (basadas en AWS Lambda) limitan el cuerpo de
la petición a 6 MB, mientras que las Edge Functions admiten hasta 25 MB,
que es justo el límite de tamaño de archivo de la API de Groq.

## Estructura

```
audio-transcriber/
├── netlify.toml                  # base dir, ruta de la edge function
├── netlify/edge-functions/
│   ├── transcribe.ts             # entrypoint (lee GROQ_API_KEY, expone /api/transcribe)
│   └── lib/transcribe-logic.ts   # lógica pura, testeada con Vitest
├── src/
│   ├── App.tsx                   # pantalla principal
│   ├── components/                # RecordButton, FileUploader, TranscriptResult, ErrorBanner
│   ├── hooks/useRecorder.ts       # MediaRecorder + temporizador
│   ├── lib/                       # validación, cliente de la API, share target
│   └── sw.ts                      # service worker: precache + captura del share_target
└── public/icons/                  # iconos de la PWA (incluye variante maskable)
```

## Desarrollo local

```bash
cd audio-transcriber
npm install
```

Para probar solo el frontend (sin la función):

```bash
npm run dev
```

Para probar el flujo completo, incluida `/api/transcribe`, se necesita la
Netlify CLI, que simula las Edge Functions localmente:

```bash
npm install -g netlify-cli
netlify dev
```

Crea un archivo `.env` (no se sube al repo) en `audio-transcriber/` con:

```
GROQ_API_KEY=tu_clave_de_groq
```

`netlify dev` la inyecta automáticamente en la edge function.

## Tests

```bash
npm test
```

Cubre:

- La lógica de `/api/transcribe` (`netlify/edge-functions/lib/transcribe-logic.test.ts`):
  método no permitido, falta de `GROQ_API_KEY`, archivo ausente, límite de
  25 MB, formatos no válidos, y el mapeo de errores de Groq (429, 401, caída
  de red, respuesta sin texto) a mensajes en español.
- Validación de archivos en el cliente y el wrapper `transcribeAudio`
  (`src/lib/*.test.ts`).

Además, el flujo completo (grabar/subir → transcribir → copiar/descargar,
errores, y la captura del `share_target` por el service worker) se verificó
manualmente con Playwright contra `vite build && vite preview`.

## Desplegar en Netlify

1. **Crear el sitio**: en Netlify, "Add new site" → "Import an existing
   project" y selecciona este repositorio.
2. **Configurar el sitio** (si no detecta `netlify.toml` automáticamente):
   - **Base directory**: `audio-transcriber`
   - **Build command**: `npm run build`
   - **Publish directory**: `audio-transcriber/dist` (o `dist`, relativo a
     la base directory)
   - Las Edge Functions se detectan solas desde `netlify/edge-functions/`
     dentro de esa base directory.
3. **Variable de entorno**: Site configuration → Environment variables →
   Add a variable:
   - Key: `GROQ_API_KEY`
   - Value: tu clave de la API de Groq (créala en https://console.groq.com)
   - **Scopes**: asegúrate de marcar **Functions** (las Edge Functions leen
     las variables declaradas con ese scope mediante `Netlify.env.get`; las
     definidas solo en `netlify.toml` no llegan a las edge functions).
4. **Deploy**: guarda y lanza el deploy. Netlify construirá el frontend y
   publicará la edge function en `/api/transcribe`.
5. **Comprobar**: abre la URL del sitio, sube un audio corto y confirma que
   devuelve texto. Si ves "Falta configurar GROQ_API_KEY en el servidor",
   revisa el paso 3.

### Android: instalación y accesos directos

- Al visitar el sitio desde Chrome en Android aparece el aviso de
  "Instalar app" (o desde el menú ⋮ → "Instalar aplicación").
- Una vez instalada, mantén pulsado el icono para ver los accesos directos
  **Grabar** y **Subir audio**.
- Para compartir un audio desde WhatsApp: botón compartir → elige "Voz a
  Texto" en la lista de apps. El service worker captura el archivo y la app
  lo transcribe automáticamente al abrirse.

## Gestión de errores

El frontend distingue y muestra en español:

- Archivo mayor de 25 MB (validado también en el servidor).
- Formato no soportado (solo mp3, m4a, wav, ogg, opus, webm).
- Sin conexión a internet (`navigator.onLine` + fallo de `fetch`).
- Límite de uso de Groq alcanzado (HTTP 429).
- Clave de Groq inválida o no configurada (errores 401/403 del lado del
  servidor, nunca expuestos como tal al usuario).
