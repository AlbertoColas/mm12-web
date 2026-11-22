import { describe, expect, it } from 'vitest';
import { dtw } from './dtw';

const abs = (a: number, b: number) => Math.abs(a - b);

describe('dtw', () => {
  it('es 0 para secuencias idénticas', () => {
    expect(dtw([1, 2, 3, 4], [1, 2, 3, 4], abs)).toBe(0);
  });

  it('es 0 si una es la otra a distinta velocidad', () => {
    expect(dtw([1, 2, 3], [1, 1, 2, 2, 2, 3], abs)).toBe(0);
  });

  it('es simétrica', () => {
    const a = [0, 1, 5, 2, 0];
    const b = [0, 2, 4, 4, 1, 0, 0];
    expect(dtw(a, b, abs)).toBeCloseTo(dtw(b, a, abs));
  });

  it('da más distancia a secuencias más distintas', () => {
    const base = [0, 1, 2, 3, 2, 1, 0];
    const cerca = [0, 1, 2, 4, 2, 1, 0];
    const lejos = [5, 5, 5, 5, 5, 5, 5];
    expect(dtw(base, cerca, abs)).toBeLessThan(dtw(base, lejos, abs));
  });

  it('devuelve el coste medio por paso', () => {
    // Desplazadas en 1 en todos los puntos: coste medio 1.
    expect(dtw([0, 0, 0], [1, 1, 1], abs)).toBeCloseTo(1);
  });

  it('la ventana limita el desfase permitido', () => {
    const a = [0, 0, 0, 0, 0, 0, 9];
    const b = [9, 0, 0, 0, 0, 0, 0];
    const libre = dtw(a, b, abs);
    const estrecha = dtw(a, b, abs, { window: 1 });
    expect(estrecha).toBeGreaterThanOrEqual(libre);
  });

  it('casos límite con secuencias vacías', () => {
    expect(dtw([], [], abs)).toBe(0);
    expect(dtw([1], [], abs)).toBe(Infinity);
  });

  it('funciona con vectores', () => {
    const euclid = (x: number[], y: number[]) => Math.hypot(x[0] - y[0], x[1] - y[1]);
    expect(dtw([[0, 0], [3, 4]], [[0, 0], [3, 4]], euclid)).toBe(0);
    expect(dtw([[0, 0]], [[3, 4]], euclid)).toBeCloseTo(5);
  });
});
