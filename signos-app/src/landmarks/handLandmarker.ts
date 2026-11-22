import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';
import type { RawFrame, RawHand } from './types';

/**
 * Detector de manos (MediaPipe). El modelo y el motor WASM se sirven desde
 * la propia app (carpetas /models y /mediapipe): no se usa ningún CDN.
 */
const BASE = import.meta.env.BASE_URL;
const WASM_PATH = `${BASE}mediapipe`;
const MODEL_PATH = `${BASE}models/hand_landmarker.task`;

let instance: Promise<HandLandmarker> | null = null;

async function create(delegate: 'GPU' | 'CPU'): Promise<HandLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
  return HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_PATH, delegate },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

/** Carga el detector una sola vez (intenta usar la GPU; si falla, la CPU). */
export function getHandLandmarker(): Promise<HandLandmarker> {
  if (!instance) {
    instance = create('GPU')
      .catch(() => create('CPU'))
      .catch((e) => {
        instance = null;
        throw e;
      });
  }
  return instance;
}

/** Convierte el resultado de MediaPipe a nuestro formato (solo números). */
export function toRawFrame(result: HandLandmarkerResult, t: number, aspect: number): RawFrame {
  const hands: RawHand[] = result.landmarks.map((lm, i) => {
    const cat = result.handedness[i]?.[0];
    const points: number[] = [];
    for (const p of lm) points.push(p.x * aspect, p.y, p.z * aspect);
    return {
      handedness: cat?.categoryName === 'Left' ? 'Left' : 'Right',
      score: cat?.score ?? 0,
      points,
    };
  });
  return { t, hands };
}
