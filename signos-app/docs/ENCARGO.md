# Encargo original (V1)

> Texto del encargo con el que se empezó el proyecto. Es la referencia de qué hay que construir.

## Proyecto
App móvil que reconoce signos personalizados de personas sordas usando la cámara. Cada persona crea su propio diccionario: graba un signo, le asigna un significado y la app lo reconoce después, aunque no pertenezca a una lengua de signos estandarizada. Objetivo: facilitar la comunicación en familia, comercios, sanidad, trabajo y vida cotidiana.

## Qué construir (V1)
App web instalable (PWA), optimizada para iPhone/Safari, con:
- Vite + React + TypeScript, y vite-plugin-pwa.
- MediaPipe Tasks Vision (HandLandmarker). Los modelos y el WASM se incluyen en el proyecto (nada de CDN en tiempo de ejecución), para que funcione sin conexión.
- Almacenamiento local con IndexedDB. Sin cuentas, sin servidor, sin analíticas.
- Pantallas en español: Diccionario (crear, grabar varios ejemplos, borrar), Reconocer, Precisión (acierto por signo y confusiones) y Ajustes (exportar/importar JSON, borrar todo).
- Reconocimiento con "no lo reconozco" cuando la distancia supera un umbral calibrable.
- Diseño accesible y visual: botones grandes, alto contraste, modo claro/oscuro, nada que dependa del sonido, respeta "reducir movimiento".

## Arquitectura
Módulos separados: camera, landmarks, features, recording, matcher, storage, ui. Define una interfaz `FeatureExtractor` para poder sustituir más adelante solo manos por manos + cara + cuerpo sin reescribir el resto. Añade tests unitarios para resample y DTW.

## Privacidad (obligatorio)
- No guardar ni enviar vídeo ni imágenes: solo puntos de landmarks, en el dispositivo.
- Ninguna petición de red tras la carga inicial.
- Pantalla de consentimiento informado antes de la primera grabación, con texto claro y botón "Borrar todo".
- Aviso de que si hay menores, debe consentir su tutor legal.

## Fuera de alcance en V1
Cuentas, backend, sincronización, pagos, app nativa, traducción a voz.

## Cómo trabajar
1. Plan corto por fases; esperar confirmación.
2. Avanzar en pasos pequeños y comprobables. Tras cada paso, decir qué probar y cómo.
3. Commits con mensajes claros.
4. Terminar con un README en español: cómo ejecutarlo, cómo publicarlo en Netlify (HTTPS, necesario para la cámara) y cómo abrirlo en el iPhone.

## Criterios de aceptación
- Se pueden grabar 3 signos con 5 ejemplos cada uno en el iPhone y ver el % de acierto.
- Funciona sin conexión una vez instalada.
- Los tests pasan y no hay peticiones de red tras la carga.
