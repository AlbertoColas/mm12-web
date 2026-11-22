/**
 * DTW (Dynamic Time Warping, "alineamiento temporal dinámico").
 *
 * Compara dos secuencias permitiendo que una vaya algo más rápida o más lenta
 * que la otra en algunos tramos. Devuelve el coste medio por paso del mejor
 * alineamiento: 0 si son idénticas, más alto cuanto más distintas.
 */
export interface DtwOptions {
  /**
   * Banda de Sakoe-Chiba: cuántos fotogramas de desfase se permiten como
   * máximo. `undefined` = sin límite.
   */
  window?: number;
}

export function dtw<T>(
  a: T[],
  b: T[],
  distance: (x: T, y: T) => number,
  options: DtwOptions = {},
): number {
  const n = a.length;
  const m = b.length;
  if (n === 0 && m === 0) return 0;
  if (n === 0 || m === 0) return Infinity;

  const w = options.window === undefined ? Math.max(n, m) : Math.max(options.window, Math.abs(n - m));

  // cost[i][j] = coste acumulado; steps[i][j] = longitud del camino.
  let prevCost = new Float64Array(m + 1).fill(Infinity);
  let prevSteps = new Float64Array(m + 1);
  let curCost = new Float64Array(m + 1);
  let curSteps = new Float64Array(m + 1);
  prevCost[0] = 0;

  for (let i = 1; i <= n; i++) {
    curCost.fill(Infinity);
    curSteps.fill(0);
    const jFrom = Math.max(1, i - w);
    const jTo = Math.min(m, i + w);
    for (let j = jFrom; j <= jTo; j++) {
      const d = distance(a[i - 1], b[j - 1]);
      // Elegimos el mejor de los tres movimientos posibles.
      let best = prevCost[j - 1];
      let steps = prevSteps[j - 1];
      if (prevCost[j] < best) {
        best = prevCost[j];
        steps = prevSteps[j];
      }
      if (curCost[j - 1] < best) {
        best = curCost[j - 1];
        steps = curSteps[j - 1];
      }
      curCost[j] = best + d;
      curSteps[j] = steps + 1;
    }
    [prevCost, curCost] = [curCost, prevCost];
    [prevSteps, curSteps] = [curSteps, prevSteps];
  }
  const total = prevCost[m];
  return total === Infinity ? Infinity : total / prevSteps[m];
}
