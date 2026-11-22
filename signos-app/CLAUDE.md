# Nexo — instrucciones para Claude Code

Nexo es una PWA que reconoce **signos personalizados** de personas sordas con la cámara: cada persona
graba sus signos, les da un significado y la app los reconoce después. Todo ocurre en el teléfono.

- Encargo completo: `docs/ENCARGO.md` (léelo primero).
- Estado, decisiones y siguientes pasos: `docs/ESTADO.md` (mantenlo actualizado al terminar cada fase).

## Cómo trabajar con la persona usuaria
- No es programadora. Explica cada paso y cada comando en **español sencillo**.
- **Pregunta antes de decisiones importantes**; avanza en pasos pequeños y comprobables y di siempre
  qué probar y cómo (normalmente en el iPhone, con Safari).
- Commits pequeños con mensajes claros en español.

## Comandos (dentro de esta carpeta)
- `npm install` — instala dependencias y copia el WASM de MediaPipe a `public/mediapipe/` (postinstall).
- `npm run dev` — servidor de desarrollo (la cámara en el móvil necesita HTTPS: mejor probar en Netlify).
- `npm test` — tests unitarios (Vitest).
- `npm run build` — comprobación de tipos + build de producción en `dist/`.
- `npm run preview` — sirve `dist/` en local.

## Arquitectura (`src/`)
- `camera/` — abre y cierra la cámara frontal. Nunca graba vídeo.
- `landmarks/` — MediaPipe HandLandmarker (modelo y WASM locales), tipos en bruto (`RawFrame`,
  `RawSequence`) y dibujo de las manos.
- `features/` — interfaz `FeatureExtractor` y `HandsFeatureExtractor` (`hands-v1`). Para añadir cara o
  cuerpo, crea otro extractor que cumpla la interfaz; no toques el resto.
- `matcher/` — `resample`, `trim`, `dtw`, `classify` (vecino más cercano + umbral) y `evaluate`
  (validación dejando uno fuera + sugerencia de umbral). Con tests.
- `recording/` — (pendiente) grabación de ejemplos y segmentación automática.
- `storage/` — (pendiente) IndexedDB con `idb`: signos, ejemplos (puntos en bruto) y ajustes.
- `ui/` — React: `App`, `components/` (TabBar, CameraView, Icon), `screens/`, `styles.css`.

## Reglas que no se pueden romper
1. **Privacidad**: nunca guardar ni enviar vídeo o imágenes; solo puntos, y solo en el dispositivo.
   Sin cuentas, sin servidor, sin analíticas.
2. **Cero peticiones de red tras la carga.** Nada de CDN, Google Fonts ni scripts externos. Los modelos
   (`public/models/`) y el WASM se sirven desde la propia app y los precachea el service worker.
   Mantén la CSP de `vite.config.ts` y `netlify.toml` (`connect-src 'self'`).
3. Consentimiento informado antes de la primera grabación, con aviso para menores (tutor legal) y
   botón "Borrar todo".
4. Accesibilidad: botones ≥ 56 px, alto contraste, claro/oscuro, nada que dependa del sonido,
   respetar "reducir movimiento". Todo el texto de la interfaz en español.
5. Dependencias con versión exacta (`.npmrc` tiene `save-exact`) e instaladas con
   `npm install --before=<hace 2 semanas>`.

## Publicar en Netlify
`netlify.toml` ya está listo. En Netlify: *Add new project › Import from Git*, elegir el repositorio,
**Base directory** = la carpeta donde esté este archivo (vacío si es la raíz del repo), build
`npm ci && npm run build`, publish `dist`. Cada `git push` a la rama configurada publica solo.
