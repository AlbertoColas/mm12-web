import type { FeatureExtractor } from '../features/types';
import { classify, type Template } from './matcher';

export interface SignStats {
  signId: string;
  total: number;
  correct: number;
  /** Veces que se respondió "no lo reconozco". */
  unknown: number;
  /** signId confundido → número de veces. */
  confusedWith: Record<string, number>;
}

export interface Evaluation {
  /** Solo cuenta signos con al menos 2 ejemplos. */
  perSign: SignStats[];
  total: number;
  correct: number;
  accuracy: number;
  /** Distancias del vecino más cercano cuando acertó (para calibrar). */
  correctDistances: number[];
  /** Distancias cuando el vecino más cercano era de otro signo. */
  wrongDistances: number[];
  threshold: number;
}

/**
 * Validación "dejando uno fuera": cada ejemplo se intenta reconocer usando
 * todos los demás. Es una forma honesta de medir la precisión sin grabar más.
 */
export function evaluate(extractor: FeatureExtractor, templates: Template[], threshold: number): Evaluation {
  const counts = new Map<string, number>();
  for (const t of templates) counts.set(t.signId, (counts.get(t.signId) ?? 0) + 1);

  const stats = new Map<string, SignStats>();
  const correctDistances: number[] = [];
  const wrongDistances: number[] = [];
  let total = 0;
  let correct = 0;

  for (const t of templates) {
    if ((counts.get(t.signId) ?? 0) < 2 || t.features.length === 0) continue;
    const s =
      stats.get(t.signId) ??
      ({ signId: t.signId, total: 0, correct: 0, unknown: 0, confusedWith: {} } as SignStats);
    stats.set(t.signId, s);

    const r = classify(extractor, t.features, templates, threshold, t.exampleId);
    s.total++;
    total++;
    if (r.best) {
      if (r.best.signId === t.signId) correctDistances.push(r.best.distance);
      else wrongDistances.push(r.best.distance);
    }
    if (r.signId === t.signId) {
      s.correct++;
      correct++;
    } else if (r.signId === null) {
      s.unknown++;
    } else {
      s.confusedWith[r.signId] = (s.confusedWith[r.signId] ?? 0) + 1;
    }
  }

  return {
    perSign: [...stats.values()],
    total,
    correct,
    accuracy: total ? correct / total : 0,
    correctDistances,
    wrongDistances,
    threshold,
  };
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** Umbral por defecto mientras no haya datos suficientes para calibrar. */
export const FALLBACK_THRESHOLD = 1.2;

/**
 * Sugiere un umbral a partir de la evaluación: suficientemente alto para
 * aceptar casi todos los aciertos (percentil 90 con un margen del 25 %).
 * Necesita al menos 4 aciertos para opinar.
 */
export function suggestThreshold(correctDistances: number[]): number | null {
  if (correctDistances.length < 4) return null;
  const sorted = [...correctDistances].sort((a, b) => a - b);
  return Math.round(quantile(sorted, 0.9) * 1.25 * 100) / 100;
}
