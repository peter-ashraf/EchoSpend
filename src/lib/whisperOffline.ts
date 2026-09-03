/**
 * whisperOffline.ts — Main-thread interface to the Whisper Web Worker.
 * Handles worker lifecycle, model pre-warming, audio recording,
 * and download progress callbacks.
 */

type ProgressCallback = (progress: number, status: string) => void;
type ReadyCallback = () => void;
type ResultCallback = (text: string) => void;
type ErrorCallback = (msg: string) => void;

let worker: Worker | null = null;
let isModelReady = false;
let warmUpPromise: Promise<boolean> | null = null;

/** Check if the Whisper model has been cached (ready for offline use) */
export async function isWhisperCached(): Promise<boolean> {
  try {
    const caches_list = await caches.keys();
    for (const name of caches_list) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      const hasOnnx = keys.some(k => k.url.includes('whisper') || k.url.includes('.onnx') || k.url.includes('Xenova'));
      if (hasOnnx) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Create and return the worker, initializing it once */
function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('../workers/whisperWorker.ts', import.meta.url),
      { type: 'module' }
    );
  }
  return worker;
}

/** Pre-warms or initializes the worker from browser cache */
export function ensureWhisperReady(): Promise<boolean> {
  if (isModelReady) return Promise.resolve(true);
  if (warmUpPromise) return warmUpPromise;

  warmUpPromise = new Promise<boolean>((resolve) => {
    const w = getWorker();
    const handleMsg = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'ready') {
        w.removeEventListener('message', handleMsg);
        isModelReady = true;
        resolve(true);
      } else if (msg.type === 'error') {
        w.removeEventListener('message', handleMsg);
        resolve(false);
      }
    };
    w.addEventListener('message', handleMsg);
    w.postMessage({ type: 'load' });
  }).finally(() => {
    warmUpPromise = null;
  });

  return warmUpPromise;
}

/** Terminate the worker and free memory */
export function terminateWhisper() {
  worker?.terminate();
  worker = null;
  isModelReady = false;
}

/**
 * Download and load the Whisper model (~40 MB).
 * Reports download progress via onProgress callback.
 */
export function downloadWhisperModel(opts: {
  onProgress: ProgressCallback;
  onReady: ReadyCallback;
  onError: ErrorCallback;
}) {
  const w = getWorker();
  isModelReady = false;

  const handleMsg = (event: MessageEvent) => {
    const msg = event.data;
    if (msg.type === 'loading') {
      opts.onProgress(msg.progress, msg.status);
    } else if (msg.type === 'ready') {
      w.removeEventListener('message', handleMsg);
      isModelReady = true;
      opts.onReady();
    } else if (msg.type === 'error') {
      w.removeEventListener('message', handleMsg);
      opts.onError(msg.message);
    }
  };

  w.addEventListener('message', handleMsg);
  w.postMessage({ type: 'load' });
}

/**
 * Transcribe a MediaRecorder Blob using the loaded Whisper model.
 * The blob is decoded and resampled to 16kHz mono Float32Array in the main thread,
 * then sent to the worker.
 */
export async function transcribeBlob(opts: {
  blob: Blob;
  language: string;
  onResult: ResultCallback;
  onError: ErrorCallback;
}) {
  // If not ready in memory yet, initialize from local browser cache
  if (!isModelReady || !worker) {
    const loaded = await ensureWhisperReady();
    if (!loaded) {
      opts.onError('Whisper model is not ready. Please download it first in Settings.');
      return;
    }
  }

  try {
    const arrayBuffer = await opts.blob.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      opts.onError('Empty audio recording');
      return;
    }

    const audioCtx = new AudioContext({ sampleRate: 16000 });
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    await audioCtx.close();

    // Convert to mono Float32Array at 16kHz (Whisper requirement)
    const channelData = decoded.getChannelData(0);
    const audioData = new Float32Array(channelData.length);
    audioData.set(channelData);

    const w = getWorker();
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'result') {
        w.removeEventListener('message', handleMessage);
        opts.onResult(msg.text);
      } else if (msg.type === 'error') {
        w.removeEventListener('message', handleMessage);
        opts.onError(msg.message);
      }
    };
    w.addEventListener('message', handleMessage);

    w.postMessage({ type: 'transcribe', audioData, language: opts.language }, [audioData.buffer]);
  } catch (err: any) {
    opts.onError(err?.message || 'Audio processing failed');
  }
}

/**
 * Record audio from the microphone and return as a Blob when stopped.
 * Handles iOS Safari and Chrome audio MIME types reliably.
 */
export function startRecording(opts: {
  onStop: (blob: Blob) => void;
  onError: (msg: string) => void;
}): { stop: () => void } {
  let mediaRecorder: MediaRecorder | null = null;
  let mediaStream: MediaStream | null = null;
  const chunks: Blob[] = [];

  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then(stream => {
      mediaStream = stream;

      // Detect best supported MIME type across iOS Safari and Android Chrome
      const supportedMime = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg'
      ].find(mime => {
        try {
          return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime);
        } catch {
          return false;
        }
      });

      const options: MediaRecorderOptions | undefined = supportedMime ? { mimeType: supportedMime } : undefined;
      mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blobType = mediaRecorder?.mimeType || supportedMime || 'audio/webm';
        const blob = new Blob(chunks, { type: blobType });
        opts.onStop(blob);
      };

      mediaRecorder.start();
    })
    .catch(err => {
      opts.onError(err?.message || 'Microphone access denied');
    });

  return {
    stop: () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try { mediaRecorder.stop(); } catch (_) {}
      } else if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }
    },
  };
}

export { isModelReady };
