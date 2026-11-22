import type { RawSequence } from '../landmarks/types';

/** Un fotograma convertido en números comparables. */
export type FeatureVector = number[];
export type FeatureSequence = FeatureVector[];

/**
 * Convierte una grabación en bruto en una secuencia de rasgos y sabe medir
 * cuánto se parecen dos fotogramas.
 *
 * Hoy solo existe HandsFeatureExtractor. Para añadir cara y cuerpo en el
 * futuro basta con crear otro extractor que cumpla esta interfaz: el resto
 * de la app (grabación, DTW, clasificador, almacenamiento) no cambia, porque
 * guardamos los datos en bruto y los rasgos se recalculan.
 */
export interface FeatureExtractor {
  /** Identificador estable, p. ej. "hands-v1". */
  readonly id: string;
  /** Convierte la grabación completa (permite normalizar por secuencia). */
  extract(seq: RawSequence): FeatureSequence;
  /** Distancia entre dos fotogramas ya extraídos (0 = idénticos). */
  frameDistance(a: FeatureVector, b: FeatureVector): number;
  /** Cuántos fotogramas tienen información útil (p. ej. alguna mano). */
  usefulFrames(seq: RawSequence): number;
}
