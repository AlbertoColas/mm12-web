/**
 * Cámara frontal. El vídeo SOLO se muestra en pantalla y se analiza en el
 * momento: nunca se graba, ni se guarda, ni se envía a ningún sitio.
 */
export class CameraError extends Error {
  constructor(
    message: string,
    readonly kind: 'denied' | 'notfound' | 'insecure' | 'unsupported' | 'other',
  ) {
    super(message);
  }
}

export async function startCamera(video: HTMLVideoElement): Promise<MediaStream> {
  if (!window.isSecureContext) {
    throw new CameraError('La cámara solo funciona en páginas seguras (https).', 'insecure');
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraError('Este navegador no permite usar la cámara.', 'unsupported');
  }
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30, max: 30 },
      },
    });
  } catch (e) {
    const name = (e as DOMException)?.name;
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      throw new CameraError('No hay permiso para usar la cámara.', 'denied');
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      throw new CameraError('No se ha encontrado ninguna cámara.', 'notfound');
    }
    throw new CameraError('No se ha podido abrir la cámara.', 'other');
  }
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true; // Imprescindible en iPhone para no abrir pantalla completa.
  await video.play();
  // Espera a conocer el tamaño real del vídeo.
  if (!video.videoWidth) {
    await new Promise<void>((resolve) => video.addEventListener('loadedmetadata', () => resolve(), { once: true }));
  }
  return stream;
}

export function stopCamera(stream: MediaStream | null, video?: HTMLVideoElement | null) {
  stream?.getTracks().forEach((t) => t.stop());
  if (video) video.srcObject = null;
}
