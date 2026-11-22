import type { FeatureExtractor, FeatureSequence } from '../features/types';
import type { RawSequence } from '../landmarks/types';
import { dtw } from './dtw';
import { resample, trim } from './resample';

/** Número de fotogramas al que se normaliza cada signo. */
export const SEQUENCE_LENGTH = 24;
/** Desfase máximo permitido por el DTW (en fotogramas). */
export const DTW_WINDOW = 6;

/** Un ejemplo ya preparado para comparar. */
export interface Template {
  exampleId: string;
  signId: string;
  features: FeatureSequence;
}

export interface Candidate {
  signId: string;
  distance: number;
  exampleId: string;
}

export interface MatchResult {
  /** Signo reconocido, o null si es "no lo reconozco". */
  signId: string | null;
  /** Mejor candidato aunque no supere el umbral. */
  best: Candidate | null;
  /** Mejor distancia de cada signo, de menor a mayor. */
  ranking: Candidate[];
  threshold: number;
}

/** Recorta, extrae rasgos y remuestrea a SEQUENCE_LENGTH fotogramas. */
export function prepare(extractor: FeatureExtractor, seq: RawSequence): FeatureSequence {
  const trimmed: RawSequence = { ...seq, frames: trim(seq.frames, (f) => f.hands.length > 0) };
  if (trimmed.frames.length === 0) return [];
  return resample(extractor.extract(trimmed), SEQUENCE_LENGTH);
}

export function sequenceDistance(
  extractor: FeatureExtractor,
  a: FeatureSequence,
  b: FeatureSequence,
): number {
  return dtw(a, b, (x, y) => extractor.frameDistance(x, y), { window: DTW_WINDOW });
}

/**
 * Vecino más cercano: compara con todos los ejemplos guardados y se queda
 * con el más parecido. Si ni siquiera el más parecido está por debajo del
 * umbral, responde "no lo reconozco" (signId = null).
 */
export function classify(
  extractor: FeatureExtractor,
  query: FeatureSequence,
  templates: Template[],
  threshold: number,
  excludeExampleId?: string,
): MatchResult {
  const bestPerSign = new Map<string, Candidate>();
  for (const t of templates) {
    if (t.exampleId === excludeExampleId || t.features.length === 0) continue;
    const distance = sequenceDistance(extractor, query, t.features);
    const prev = bestPerSign.get(t.signId);
    if (!prev || distance < prev.distance) {
      bestPerSign.set(t.signId, { signId: t.signId, distance, exampleId: t.exampleId });
    }
  }
  const ranking = [...bestPerSign.values()].sort((a, b) => a.distance - b.distance);
  const best = ranking[0] ?? null;
  const signId = best && best.distance <= threshold ? best.signId : null;
  return { signId, best, ranking, threshold };
}
