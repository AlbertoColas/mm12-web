# Estado del proyecto

Última actualización: 22-11-2026.

## Plan por fases

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Esqueleto: Vite + React + TS + PWA, 4 pestañas, tema claro/oscuro, CSP | ✅ Hecha |
| 1 | Núcleo: `FeatureExtractor`, extractor de manos, remuestreo, DTW, clasificador, evaluación, 23 tests | ✅ Hecha |
| 2 | Cámara frontal + MediaPipe HandLandmarker local + dibujo de manos | ✅ Hecha y **probada en iPhone** (fluida, puntos bien encajados) |
| 3 | Consentimiento informado (aviso menores, "Borrar todo") + almacenamiento IndexedDB | ⏳ Siguiente |
| 4 | Diccionario: crear signo, grabar varios ejemplos (cuenta atrás), borrar | Pendiente |
| 5 | Reconocer: modo automático (detecta inicio/fin por presencia de manos) + botón manual, "no lo reconozco" | Pendiente |
| 6 | Precisión (dejando uno fuera, por signo, confusiones, calibrar umbral) + Ajustes (exportar/importar JSON, borrar todo, tema) | Pendiente |
| 7 | Verificación sin conexión, test e2e de "0 peticiones externas", README completo | Pendiente |

## Petición nueva tras probar la Fase 2

La persona que lo probó pide que **también reconozca gestos faciales** (en lenguas de signos la cara
aporta gramática: cejas, boca, mejillas). La arquitectura ya lo prevé:

- `RawFrame` tiene un campo reservado `face?: number[]`.
- Se añadiría `FaceLandmarker` de MediaPipe (mismo paquete `@mediapipe/tasks-vision`) con
  `outputFaceBlendshapes: true`. Los 52 "blendshapes" (p. ej. `browInnerUp`, `jawOpen`, `mouthPucker`,
  `cheekPuff`) son valores 0–1 que describen expresiones y son mucho mejores rasgos que los 478 puntos.
- Crear `HandsFaceFeatureExtractor` que implemente `FeatureExtractor`: rasgos de manos + vector de
  blendshapes (con peso configurable). Además, la posición de la cara permite expresar dónde están las
  manos respecto a la cara (frente, barbilla, pecho), cosa que hoy se aproxima con el centro de la imagen.
- El modelo `face_landmarker.task` (~3,6 MB) debe incluirse en `public/models/` como el de manos
  (descargado de `storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/`).
- Coste: más procesamiento por fotograma; en iPhone conviene medir FPS con manos + cara.
- **Decisión pendiente**: hacerlo dentro de V1 (después de la Fase 4 o 5) o dejarlo para V2.

## Decisiones tomadas (y por qué)

- **Carpeta propia** (`signos-app/` en el repo original): para no afectar a otra web del mismo repositorio.
- **Nombre**: Nexo.
- **No había prototipo** (`prototipo/index.html` no existía): la lógica se escribió desde cero siguiendo la
  descripción (MediaPipe Hands, 2 manos × 21 puntos, 24 fotogramas, DTW, vecino más cercano).
- **Se guardan los puntos en bruto, no los rasgos**: así, si se cambia el extractor (p. ej. añadir cara),
  los rasgos se recalculan sin volver a grabar.
- **Coordenadas isotrópicas**: x se multiplica por ancho/alto del vídeo para que las distancias sean reales.
- **Rasgos de manos (`hands-v1`)**: por mano, presencia + forma (21 puntos relativos a la muñeca, divididos
  por el tamaño de la palma) + posición de la muñeca respecto al centro (dividida por el tamaño mediano de
  la mano en la grabación). Distancia entre fotogramas: RMS de la forma + 0,5 × posición; 1,5 de
  penalización si una mano aparece en un fotograma y no en el otro.
- **DTW** con banda de Sakoe-Chiba (6 fotogramas) y coste normalizado por la longitud del camino.
- **Umbral**: automático (percentil 90 de las distancias correctas × 1,25, con ≥ 4 aciertos) con opción
  de ajustarlo a mano. Valor por defecto mientras no hay datos: 1,2.
- **Privacidad reforzada con CSP** (`connect-src 'self'`, etc.) en `<meta>` (solo en build) y en cabeceras
  de Netlify: el navegador bloquea cualquier conexión a terceros. Sin Google Fonts: fuentes del sistema.
- **Dependencias**: versiones exactas, instaladas con `npm install --before=<fecha de hace 2 semanas>`
  para evitar paquetes recién publicados.
- **Netlify**: la web pública es abierta (los datos nunca salen del teléfono); las versiones de prueba
  pueden protegerse con login del equipo.

## Pruebas hechas

- `npm test`: 23 tests en verde (resample, trim, DTW, clasificador, evaluación).
- Navegador automatizado (Playwright, tamaño iPhone 13, cámara simulada): el detector carga con la CSP
  activa y hay 0 peticiones externas.
- iPhone real (Fase 2): cámara fluida, puntos bien encajados, sin errores.
