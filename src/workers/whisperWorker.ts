// Whisper Web Worker — runs in an isolated thread to avoid blocking the UI
// Uses @xenova/transformers (Whisper-tiny multilingual)

import { pipeline, env } from '@xenova/transformers';

// Allow the model to be cached in the browser's Cache API (not WASM — use JS backend)
env.allowLocalModels = false;
env.useBrowserCache = true;

type WorkerMessage =
  | { type: 'load' }
  | { type: 'transcribe'; audioData: Float32Array; language: string };

type WorkerResponse =
  | { type: 'loading'; progress: number; status: string }
  | { type: 'ready' }
  | { type: 'result'; text: string }
  | { type: 'error'; message: string };

let transcriber: Awaited<ReturnType<typeof pipeline>> | null = null;

function send(msg: WorkerResponse) {
  self.postMessage(msg);
}

async function loadModel() {
  try {
    send({ type: 'loading', progress: 0, status: 'Initializing model...' });

    transcriber = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny',
      {
        progress_callback: (progress: any) => {
          if (progress.status === 'downloading' || progress.status === 'progress') {
            const pct = progress.progress ?? 0;
            send({
              type: 'loading',
              progress: Math.round(pct),
              status: `Downloading model... ${Math.round(pct)}%`,
            });
          } else if (progress.status === 'loading') {
            send({ type: 'loading', progress: 95, status: 'Loading into memory...' });
          } else if (progress.status === 'done') {
            send({ type: 'loading', progress: 100, status: 'Model ready!' });
          }
        },
      }
    );

    send({ type: 'ready' });
  } catch (err: any) {
    send({ type: 'error', message: err?.message || 'Failed to load Whisper model' });
  }
}

async function transcribeAudio(audioData: Float32Array, language: string) {
  if (!transcriber) {
    send({ type: 'error', message: 'Model not loaded yet' });
    return;
  }

  try {
    const lang = language.startsWith('ar') ? 'arabic' : 'english';
    const output = await (transcriber as any)(audioData, {
      language: lang,
      task: 'transcribe',
      chunk_length_s: 30,
    });

    const text: string = Array.isArray(output)
      ? output.map((o: any) => o.text).join(' ')
      : output.text ?? '';

    send({ type: 'result', text: text.trim() });
  } catch (err: any) {
    send({ type: 'error', message: err?.message || 'Transcription failed' });
  }
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;
  if (msg.type === 'load') {
    await loadModel();
  } else if (msg.type === 'transcribe') {
    await transcribeAudio(msg.audioData, msg.language);
  }
};
