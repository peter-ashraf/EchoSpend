/**
 * whisperOffline.ts — Main-thread interface to the Whisper Web Worker.
 * Handles worker lifecycle, audio recording (MediaRecorder → Float32Array),
 * and download progress callbacks.
 */

type ProgressCallback = (progress: number, status: string) => void;
type ReadyCallback = () => void;
type ResultCallback = (text: string) => void;
type ErrorCallback = (msg: string) => void;

let worker: Worker | null = null;
let isModelReady = false;

/** Check if the Whisper model has been cached (ready for offline use) */
export async function isWhisperCached(): Promise<boolean> {
  try {
    const caches_list = await caches.keys();
    for (const name of caches_list) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      const hasOnnx = keys.some(k => k.url.includes('whisper') || k.url.includes('.onnx'));
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

  w.onmessage = (event: MessageEvent) => {
    const msg = event.data;
    if (msg.type === 'loading') {
      opts.onProgress(msg.progress, msg.status);
    } else if (msg.type === 'ready') {
      isModelReady = true;
      opts.onReady();
    } else if (msg.type === 'error') {
      opts.onError(msg.message);
    }
  };

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
  if (!isModelReady || !worker) {
    opts.onError('Whisper model is not ready. Please download it first.');
    return;
  }

  try {
    const arrayBuffer = await opts.blob.arrayBuffer();
    const audioCtx = new AudioContext({ sampleRate: 16000 });
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    await audioCtx.close();

    // Convert to mono Float32Array at 16kHz (Whisper requirement)
    const channelData = decoded.getChannelData(0);
    const audioData = new Float32Array(channelData.length);
    audioData.set(channelData);

    const w = worker;
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
 * Returns a stop() function to trigger recording completion.
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
      // Prefer webm/opus for best browser support
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/ogg;codecs=opus';

      mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: mimeType });
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
