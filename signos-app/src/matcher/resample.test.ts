import { describe, expect, it } from 'vitest';
import { resample, trim } from './resample';

describe('resample', () => {
  it('devuelve exactamente n fotogramas', () => {
    const seq = Array.from({ length: 50 }, (_, i) => [i]);
    expect(resample(seq, 24)).toHaveLength(24);
    expect(resample(seq.slice(0, 5), 24)).toHaveLength(24);
  });

  it('conserva el primer y el último fotograma', () => {
    const seq = [[0, 10], [5, 20], [9, 30]];
    const out = resample(seq, 7);
    expect(out[0]).toEqual([0, 10]);
    expect(out[6]).toEqual([9, 30]);
  });

  it('interpola linealmente entre fotogramas', () => {
    const out = resample([[0], [10]], 11);
    out.forEach((v, i) => expect(v[0]).toBeCloseTo(i));
  });

  it('no modifica la secuencia original', () => {
    const seq = [[1, 2], [3, 4]];
    const copy = JSON.parse(JSON.stringify(seq));
    const out = resample(seq, 4);
    out[0][0] = 999;
    expect(seq).toEqual(copy);
  });

  it('casos límite: vacío, un fotograma, n = 1, n = 0', () => {
    expect(resample([], 24)).toEqual([]);
    expect(resample([[7, 8]], 3)).toEqual([[7, 8], [7, 8], [7, 8]]);
    expect(resample([[1], [2], [3]], 1)).toEqual([[1]]);
    expect(resample([[1]], 0)).toEqual([]);
  });

  it('con la misma longitud devuelve los mismos valores', () => {
    const seq = [[1], [4], [2], [8]];
    expect(resample(seq, 4)).toEqual(seq);
  });
});

describe('trim', () => {
  it('quita los fotogramas vacíos de los extremos y conserva los del medio', () => {
    expect(trim([0, 0, 1, 0, 2, 0], (x) => x > 0)).toEqual([1, 0, 2]);
  });
  it('devuelve vacío si no hay ninguno útil', () => {
    expect(trim([0, 0], (x) => x > 0)).toEqual([]);
  });
});
