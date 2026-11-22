import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CameraError, startCamera, stopCamera } from '../../camera/camera';
import { getHandLandmarker, toRawFrame } from '../../landmarks/handLandmarker';
import { drawHands } from '../../landmarks/drawing';
import type { RawFrame } from '../../landmarks/types';

type Status = 'loading' | 'ready' | 'error';

export interface CameraViewProps {
  /** Se llama con cada fotograma analizado (solo puntos, nunca imágenes). */
  onFrame?: (frame: RawFrame, aspect: number) => void;
  /** Contenido superpuesto (cuenta atrás, resultado...). */
  children?: ReactNode;
  /** Borde de color según el estado (p. ej. grabando). */
  tone?: 'idle' | 'recording' | 'ok' | 'warn';
}

const ERRORS: Record<CameraError['kind'], string> = {
  denied:
    'Nexo no tiene permiso para usar la cámara. En el iPhone: Ajustes › Safari › Cámara › Permitir, y vuelve a abrir la app.',
  notfound: 'No se ha encontrado ninguna cámara en este dispositivo.',
  insecure: 'La cámara solo funciona si la página se abre con https://.',
  unsupported: 'Este navegador no permite usar la cámara. Prueba con Safari actualizado.',
  other: 'No se ha podido abrir la cámara. Cierra otras apps que la estén usando y vuelve a intentarlo.',
};

export function CameraView({ onFrame, children, tone = 'idle' }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [handCount, setHandCount] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let raf = 0;
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    setStatus('loading');

    (async () => {
      try {
        const [landmarker, s] = await Promise.all([getHandLandmarker(), startCamera(video)]);
        stream = s;
        if (cancelled) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d')!;
        const aspect = video.videoWidth / video.videoHeight;
        setStatus('ready');

        let lastVideoTime = -1;
        let lastTs = 0;
        let lastCount = -1;
        const loop = () => {
          if (cancelled) return;
          if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            const ts = Math.max(performance.now(), lastTs + 1);
            lastTs = ts;
            const result = landmarker.detectForVideo(video, ts);
            const frame = toRawFrame(result, ts, aspect);
            drawHands(ctx, frame, aspect);
            if (frame.hands.length !== lastCount) {
              lastCount = frame.hands.length;
              setHandCount(lastCount);
            }
            onFrameRef.current?.(frame, aspect);
          }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof CameraError ? ERRORS[e.kind] : 'No se ha podido cargar el detector de manos.');
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stopCamera(stream, video);
    };
  }, [attempt]);

  return (
    <div className={`camera tone-${tone}`}>
      <video ref={videoRef} className="camera-video" playsInline muted autoPlay aria-hidden="true" />
      <canvas ref={canvasRef} className="camera-overlay" aria-hidden="true" />
      {status === 'loading' && (
        <div className="camera-message" role="status">
          <span className="spinner" aria-hidden="true" />
          Preparando la cámara…
        </div>
      )}
      {status === 'error' && (
        <div className="camera-message error" role="alert">
          <p>{error}</p>
          <button type="button" className="btn" onClick={() => setAttempt((a) => a + 1)}>
            Reintentar
          </button>
        </div>
      )}
      {status === 'ready' && (
        <div className={`hand-badge ${handCount ? 'on' : ''}`} role="status" aria-live="polite">
          {handCount === 0 ? 'No veo tus manos' : handCount === 1 ? 'Veo 1 mano' : 'Veo 2 manos'}
        </div>
      )}
      {status === 'ready' && children}
    </div>
  );
}
