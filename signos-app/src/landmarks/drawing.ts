import type { RawFrame } from './types';

/** Huesos de la mano: pares de puntos que se unen con una línea. */
const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

const COLORS = { Right: '#5eead4', Left: '#fbbf24' } as const;

/** Dibuja los puntos de las manos sobre un lienzo del mismo tamaño que el vídeo. */
export function drawHands(ctx: CanvasRenderingContext2D, frame: RawFrame | null, aspect: number) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  if (!frame) return;
  const sx = width / aspect;
  const sy = height;
  const r = Math.max(3, width / 120);
  for (const hand of frame.hands) {
    const p = hand.points;
    const color = COLORS[hand.handedness];
    ctx.lineWidth = Math.max(3, width / 160);
    ctx.lineCap = 'round';
    // Contorno oscuro para que se vea sobre cualquier fondo.
    for (const [stroke, w] of [['rgba(0,0,0,0.65)', ctx.lineWidth + 3], [color, ctx.lineWidth]] as const) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = w;
      ctx.beginPath();
      for (const [a, b] of CONNECTIONS) {
        ctx.moveTo(p[a * 3] * sx, p[a * 3 + 1] * sy);
        ctx.lineTo(p[b * 3] * sx, p[b * 3 + 1] * sy);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 2;
    for (let k = 0; k < 21; k++) {
      ctx.beginPath();
      ctx.arc(p[k * 3] * sx, p[k * 3 + 1] * sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}
