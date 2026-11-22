import type { FeatureExtractor, FeatureSequence, FeatureVector } from './types';
import { HAND_POINTS, MIDDLE_MCP, WRIST, type RawHand, type RawSequence } from '../landmarks/types';

/**
 * Rasgos de manos (versión 1).
 *
 * Para cada fotograma hay 2 "huecos": mano derecha y mano izquierda.
 * Cada hueco tiene:
 *   [0]      presencia (1 si la mano se ve, 0 si no)
 *   [1..63]  forma: los 21 puntos relativos a la muñeca, divididos por el
 *            tamaño de la palma (muñeca → nudillo del dedo corazón).
 *            Así no importa lo lejos que estés de la cámara.
 *   [64..65] posición: dónde está la muñeca respecto al centro de la imagen,
 *            dividida por el tamaño típico de la mano en esa grabación.
 */
export const SLOT_SIZE = 1 + HAND_POINTS * 3 + 2;
export const SLOTS: RawHand['handedness'][] = ['Right', 'Left'];
export const FRAME_SIZE = SLOT_SIZE * SLOTS.length;

export interface HandsExtractorOptions {
  /** Peso de la forma de la mano. */
  shapeWeight: number;
  /** Peso de la posición de la mano en la imagen. */
  positionWeight: number;
  /** Penalización cuando una mano aparece en un fotograma y en el otro no. */
  missingPenalty: number;
}

export const DEFAULT_HANDS_OPTIONS: HandsExtractorOptions = {
  shapeWeight: 1,
  positionWeight: 0.5,
  missingPenalty: 1.5,
};

function dist2d(p: number[], i: number, j: number): number {
  const dx = p[i * 3] - p[j * 3];
  const dy = p[i * 3 + 1] - p[j * 3 + 1];
  return Math.hypot(dx, dy);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Elige como mucho una mano por hueco (la de mayor confianza). */
function pickHands(hands: RawHand[]): Map<RawHand['handedness'], RawHand> {
  const out = new Map<RawHand['handedness'], RawHand>();
  for (const h of hands) {
    const prev = out.get(h.handedness);
    if (!prev || h.score > prev.score) out.set(h.handedness, h);
  }
  return out;
}

export class HandsFeatureExtractor implements FeatureExtractor {
  readonly id = 'hands-v1';
  constructor(private readonly opts: HandsExtractorOptions = DEFAULT_HANDS_OPTIONS) {}

  usefulFrames(seq: RawSequence): number {
    return seq.frames.filter((f) => f.hands.length > 0).length;
  }

  extract(seq: RawSequence): FeatureSequence {
    // Tamaño típico de la mano en esta grabación (para normalizar la posición).
    const sizes: number[] = [];
    for (const f of seq.frames) for (const h of f.hands) sizes.push(dist2d(h.points, WRIST, MIDDLE_MCP));
    const typicalSize = median(sizes) || 0.1;
    const centerX = seq.aspect / 2;
    const centerY = 0.5;

    return seq.frames.map((frame) => {
      const v: FeatureVector = new Array(FRAME_SIZE).fill(0);
      const byHand = pickHands(frame.hands);
      SLOTS.forEach((slot, s) => {
        const hand = byHand.get(slot);
        if (!hand) return;
        const base = s * SLOT_SIZE;
        const p = hand.points;
        const wx = p[WRIST * 3];
        const wy = p[WRIST * 3 + 1];
        const wz = p[WRIST * 3 + 2];
        const scale = dist2d(p, WRIST, MIDDLE_MCP) || typicalSize;
        v[base] = 1;
        for (let k = 0; k < HAND_POINTS; k++) {
          v[base + 1 + k * 3] = (p[k * 3] - wx) / scale;
          v[base + 2 + k * 3] = (p[k * 3 + 1] - wy) / scale;
          v[base + 3 + k * 3] = (p[k * 3 + 2] - wz) / scale;
        }
        v[base + 1 + HAND_POINTS * 3] = (wx - centerX) / typicalSize;
        v[base + 2 + HAND_POINTS * 3] = (wy - centerY) / typicalSize;
      });
      return v;
    });
  }

  frameDistance(a: FeatureVector, b: FeatureVector): number {
    const { shapeWeight, positionWeight, missingPenalty } = this.opts;
    let total = 0;
    for (let s = 0; s < SLOTS.length; s++) {
      const base = s * SLOT_SIZE;
      const pa = a[base] > 0.5;
      const pb = b[base] > 0.5;
      if (!pa && !pb) continue;
      if (pa !== pb) {
        total += missingPenalty;
        continue;
      }
      let shape = 0;
      for (let k = 1; k <= HAND_POINTS * 3; k++) {
        const d = a[base + k] - b[base + k];
        shape += d * d;
      }
      // Error medio por punto (raíz cuadrática media).
      const shapeRms = Math.sqrt(shape / HAND_POINTS);
      const px = a[base + 1 + HAND_POINTS * 3] - b[base + 1 + HAND_POINTS * 3];
      const py = a[base + 2 + HAND_POINTS * 3] - b[base + 2 + HAND_POINTS * 3];
      total += shapeWeight * shapeRms + positionWeight * Math.hypot(px, py);
    }
    return total;
  }
}
