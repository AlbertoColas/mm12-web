/**
 * Remuestreo: convierte una secuencia de cualquier longitud en exactamente
 * `n` fotogramas, interpolando linealmente entre los vecinos.
 * Así un signo hecho deprisa y otro hecho despacio tienen la misma longitud.
 */
export function resample(seq: number[][], n: number): number[][] {
  if (n <= 0) return [];
  if (seq.length === 0) return [];
  if (seq.length === 1) return Array.from({ length: n }, () => [...seq[0]]);
  if (n === 1) return [[...seq[0]]];

  const out: number[][] = [];
  const last = seq.length - 1;
  for (let i = 0; i < n; i++) {
    const pos = (i * last) / (n - 1);
    const lo = Math.floor(pos);
    const hi = Math.min(lo + 1, last);
    const frac = pos - lo;
    const a = seq[lo];
    const b = seq[hi];
    const v = new Array(a.length);
    for (let k = 0; k < a.length; k++) v[k] = a[k] + (b[k] - a[k]) * frac;
    out.push(v);
  }
  return out;
}

/**
 * Recorta los fotogramas vacíos del principio y del final
 * (cuando todavía no se veía ninguna mano).
 */
export function trim<T>(frames: T[], isUseful: (f: T) => boolean): T[] {
  let start = 0;
  let end = frames.length - 1;
  while (start <= end && !isUseful(frames[start])) start++;
  while (end >= start && !isUseful(frames[end])) end--;
  return frames.slice(start, end + 1);
}
