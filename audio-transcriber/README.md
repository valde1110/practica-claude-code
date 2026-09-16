# Voz a Texto

PWA en español para transcribir notas de voz, audios y **vídeos completos**
(de cualquier duración) a texto, usando la API de Groq
(`whisper-large-v3-turbo`). Pensada para instalarse en Android y recibir
audios compartidos directamente desde WhatsApp y otras apps.

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

## Vídeos y audios largos (sin límite de duración)

Un audio o vídeo de más de 25 MB (o cualquier vídeo, sea del tamaño que
sea) no se sube tal cual: el navegador extrae primero solo la pista de
audio con **ffmpeg.wasm** (autohospedado en `public/ffmpeg-core/`, se
descarga solo la primera vez que hace falta, no en el arranque de la app),
la comprime a mono/16 kHz/opus y la trocea en partes de ~15 minutos. Cada
parte se transcribe con una llamada normal a `/api/transcribe` (la función
no cambia) y el texto se va uniendo en orden. El progreso de cada trabajo
se guarda en IndexedDB (`src/lib/history.ts`) a medida que se completa cada
parte, así que si se cierra la pestaña a mitad de un vídeo largo, al volver
a abrir la app aparece en el nuevo panel **Historial** con un botón
"Reanudar" que continúa solo por las partes que faltaban, sin repetir las
ya transcritas. También queda ahí el historial de las transcripciones
cortas normales.

Importante: `ffmpeg.wasm` necesita ejecutarse dentro de un **worker de
tipo módulo ES** (así lo crea `@ffmpeg/ffmpeg`), así que hay que
autohospedar el build **`esm`** de `@ffmpeg/core` (no el `umd`) en
`public/ffmpeg-core/` — el build `umd` usa `importScripts()`, que los
navegadores prohíben dentro de un worker de módulo y falla la carga sin
avisar claramente por qué.

## Transcribir desde una URL

También se puede pegar el enlace directo a un archivo de audio o vídeo
(por ejemplo, un episodio de podcast alojado en algún sitio) en vez de
subirlo. Una Edge Function (`/api/fetch-url`) lo descarga en el servidor
—necesario porque casi ningún host manda cabeceras CORS permisivas para
descargarlo directamente desde el navegador— y se lo pasa al cliente,
que sigue el mismo camino de siempre (transcripción simple o por partes
según el tamaño). Solo vale para **enlaces directos al archivo**, no
para páginas como YouTube (eso necesitaría extraer el vídeo real de la
página, algo mucho más complejo, fragil, y en una zona legal gris por
los términos de uso de YouTube — se descartó a propósito). El límite es
de 20 MB, el máximo que permite una respuesta en streaming de Netlify;
la función valida que la URL sea `http`/`https` y bloquea IPs privadas o
de loopback para evitar SSRF.

## Estructura

```
audio-transcriber/
├── netlify.toml                  # base dir, rutas de las edge functions
├── netlify/edge-functions/
│   ├── transcribe.ts             # entrypoint (lee GROQ_API_KEY, expone /api/transcribe)
│   ├── fetch-media.ts            # entrypoint de /api/fetch-url
│   └── lib/                      # lógica pura de ambas, testeada con Vitest
├── src/
│   ├── App.tsx                   # pantalla principal
│   ├── components/                # RecordButton, FileUploader, UrlInput, TranscriptResult,
│   │                               # ErrorBanner, ProgressBar, HistoryPanel
│   ├── hooks/useRecorder.ts       # MediaRecorder + temporizador
│   ├── lib/
│   │   ├── ffmpeg.ts               # carga perezosa de ffmpeg.wasm (build ESM)
│   │   ├── extractAudio.ts         # extrae y trocea el audio de un vídeo/audio largo
│   │   ├── transcribeJob.ts        # orquesta la transcripción por partes + reanudación
│   │   ├── history.ts              # historial persistente en IndexedDB
│   │   ├── fetchFromUrl.ts         # cliente de /api/fetch-url
│   │   └── validateMedia.ts, validateAudio.ts, transcribeApi.ts, shareTarget.ts
│   └── sw.ts                      # service worker: precache + captura del share_target
├── public/icons/                  # iconos de la PWA (incluye variante maskable)
└── public/ffmpeg-core/            # ffmpeg.wasm autohospedado (build ESM, ~32 MB)
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
- La lógica de `/api/fetch-url` (`netlify/edge-functions/lib/fetch-media-logic.test.ts`):
  URLs inválidas, bloqueo de hosts privados/loopback/link-local (SSRF),
  límite de 20 MB (por cabecera y también si el servidor miente sobre el
  tamaño), y el streaming del cuerpo con el `Content-Type`/nombre correctos.
- Validación de archivos en el cliente, el wrapper `transcribeAudio` y el
  cliente de `/api/fetch-url` (`src/lib/*.test.ts`).

Además, el flujo completo se verificó manualmente con Playwright (Chromium
real) contra `vite build && vite preview`: grabar/subir → transcribir →
copiar/descargar, errores, la captura del `share_target` por el service
worker, y el pipeline de vídeo largo de punta a punta — incluyendo un
vídeo de ~17 min real procesado por ffmpeg.wasm (a ~200x tiempo real),
troceado en 2 partes, con una parte fallando a propósito y reanudada
después desde el Historial sin repetir la parte ya transcrita.

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
