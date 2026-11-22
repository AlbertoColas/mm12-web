/**
 * Datos "en bruto" que salen del detector. NUNCA contienen imágenes:
 * solo coordenadas de puntos.
 *
 * Coordenadas "isotrópicas": x se multiplica por (ancho/alto) del vídeo para
 * que una unidad horizontal mida lo mismo que una vertical. y va de 0 a 1.
 */
export type Handedness = 'Left' | 'Right';

export interface RawHand {
  handedness: Handedness;
  score: number;
  /** 21 puntos × (x, y, z) = 63 números. */
  points: number[];
}

export interface RawFrame {
  /** Milisegundos desde el inicio de la grabación. */
  t: number;
  hands: RawHand[];
  /** Reservado para versiones futuras (cara y cuerpo). */
  face?: number[];
  pose?: number[];
}

export interface RawSequence {
  frames: RawFrame[];
  /** Proporción ancho/alto del vídeo con que se grabó. */
  aspect: number;
}

export const HAND_POINTS = 21;
export const WRIST = 0;
export const MIDDLE_MCP = 9;
