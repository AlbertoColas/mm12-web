import { describe, expect, it } from 'vitest';
import { HandsFeatureExtractor } from '../features/handsExtractor';
import type { RawFrame, RawSequence } from '../landmarks/types';
import { classify, prepare, SEQUENCE_LENGTH, type Template } from './matcher';
import { evaluate, suggestThreshold } from './evaluate';

/** Mano sintética: los dedos se abren según `open` (0..1) y se mueve a (cx, cy). */
function hand(open: number, cx: number, cy: number, size = 0.1) {
  const points: number[] = [];
  for (let k = 0; k < 21; k++) {
    const finger = Math.floor((k - 1) / 4);
    const joint = ((k - 1) % 4) + 1;
    if (k === 0) points.push(cx, cy, 0);
    else {
      const angle = -Math.PI / 2 + (finger - 2) * 0.35 * (0.3 + open);
      const r = size * (0.5 + joint * 0.25) * (0.4 + 0.6 * open);
      points.push(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 0);
    }
  }
  // Garantiza que el nudillo del corazón (9) esté a distancia `size` de la muñeca.
  points[27] = cx;
  points[28] = cy - size;
  return { handedness: 'Right' as const, score: 0.9, points };
}

function sign(kind: 'abrir' | 'cerrar' | 'subir', frames: number, noise = 0, size = 0.1): RawSequence {
  const out: RawFrame[] = [];
  for (let i = 0; i < frames; i++) {
    const t = i / (frames - 1);
    const j = () => (Math.random() - 0.5) * noise;
    let h;
    if (kind === 'abrir') h = hand(t, 0.6 + j(), 0.6 + j(), size);
    else if (kind === 'cerrar') h = hand(1 - t, 0.6 + j(), 0.6 + j(), size);
    else h = hand(0.5, 0.6 + j(), 0.8 - 0.4 * t + j(), size);
    out.push({ t: i * 33, hands: [h] });
  }
  return { frames: out, aspect: 4 / 3 };
}

const ex = new HandsFeatureExtractor();

describe('prepare', () => {
  it('normaliza a SEQUENCE_LENGTH fotogramas y recorta los vacíos', () => {
    const s = sign('abrir', 40);
    s.frames.unshift({ t: 0, hands: [] }, { t: 0, hands: [] });
    expect(prepare(ex, s)).toHaveLength(SEQUENCE_LENGTH);
  });
  it('una grabación sin manos da secuencia vacía', () => {
    expect(prepare(ex, { frames: [{ t: 0, hands: [] }], aspect: 1 })).toEqual([]);
  });
});

describe('classify', () => {
  const templates: Template[] = [];
  let id = 0;
  for (const k of ['abrir', 'cerrar', 'subir'] as const) {
    for (let n = 0; n < 3; n++) {
      templates.push({ exampleId: `e${id++}`, signId: k, features: prepare(ex, sign(k, 30 + n * 7, 0.01)) });
    }
  }

  it('reconoce cada signo aunque se haga a otra velocidad o más lejos', () => {
    expect(classify(ex, prepare(ex, sign('abrir', 55, 0.01)), templates, 10).signId).toBe('abrir');
    expect(classify(ex, prepare(ex, sign('cerrar', 20, 0.01, 0.06)), templates, 10).signId).toBe('cerrar');
    expect(classify(ex, prepare(ex, sign('subir', 45, 0.01)), templates, 10).signId).toBe('subir');
  });

  it('responde "no lo reconozco" si supera el umbral', () => {
    const r = classify(ex, prepare(ex, sign('abrir', 30)), templates, 0);
    expect(r.signId).toBeNull();
    expect(r.best?.signId).toBe('abrir');
  });

  it('una mano que falta penaliza', () => {
    const dos = sign('abrir', 30);
    dos.frames.forEach((f) => f.hands.push({ ...f.hands[0], handedness: 'Left' }));
    const solo = prepare(ex, sign('abrir', 30));
    const r1 = classify(ex, solo, templates, 10).best!.distance;
    const r2 = classify(ex, prepare(ex, dos), templates, 10).best!.distance;
    expect(r2).toBeGreaterThan(r1);
  });

  it('la evaluación dejando uno fuera acierta en datos limpios', () => {
    const e = evaluate(ex, templates, 10);
    expect(e.total).toBe(9);
    expect(e.accuracy).toBe(1);
    expect(suggestThreshold(e.correctDistances)).toBeGreaterThan(0);
  });
});

describe('suggestThreshold', () => {
  it('necesita al menos 4 aciertos', () => {
    expect(suggestThreshold([0.1, 0.2])).toBeNull();
    expect(suggestThreshold([0.4, 0.4, 0.4, 0.4])).toBeCloseTo(0.5);
  });
});
