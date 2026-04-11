import {
  pipeline,
  type AutomaticSpeechRecognitionConfig,
  type AutomaticSpeechRecognitionOutput,
} from '@huggingface/transformers'

export interface WordTimestamp {
  word: string
  start: number
  end: number
}

export interface TranscriptionResult {
  text: string
  words: WordTimestamp[]
}

let transcriber: /* AutomaticSpeechRecognitionPipeline */ any = null

export async function loadWhisperModel(
  onProgress?: (progress: { status: string; progress?: number }) => void,
): Promise<void> {
  if (transcriber) return

  transcriber = await (pipeline as any)('automatic-speech-recognition', 'Xenova/whisper-small', {
    // dtype: 'q8',
    // device: 'wasm',
    device: 'webgpu',
    progress_callback: onProgress,
  })
}

export async function transcribeAudio(
  audioUrl: string,
  language: string = 'en',
): Promise<TranscriptionResult> {
  if (!transcriber) {
    throw new Error('Whisper model not loaded. Call loadWhisperModel() first.')
  }

  const options = {
    return_timestamps: 'word',
    task: 'transcribe',
    // chunk_length_s: 30,
    // stride_length_s: 5,
    language,
  }

  const result = (await transcriber(audioUrl, options)) as AutomaticSpeechRecognitionOutput

  const words: WordTimestamp[] = (result.chunks ?? []).map((chunk) => ({
    word: chunk.text.trim().replace('.', '').replace(',', ''), // Remove trailing periods and commas
    start: typeof chunk.timestamp[0] === 'number' ? chunk.timestamp[0] : 0,
    end: typeof chunk.timestamp[1] === 'number' ? chunk.timestamp[1] : 0,
  }))

  return {
    text: result.text,
    words,
  }
}

export function isModelLoaded(): boolean {
  return transcriber !== null
}

export const WHISPER_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'nl', label: 'Dutch' },
  { code: 'pl', label: 'Polish' },
  { code: 'ro', label: 'Romanian' },
  { code: 'sv', label: 'Swedish' },
  { code: 'da', label: 'Danish' },
  { code: 'fi', label: 'Finnish' },
  { code: 'no', label: 'Norwegian' },
  { code: 'el', label: 'Greek' },
  { code: 'cs', label: 'Czech' },
  { code: 'hu', label: 'Hungarian' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ru', label: 'Russian' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'th', label: 'Thai' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'id', label: 'Indonesian' },
  { code: 'ms', label: 'Malay' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'he', label: 'Hebrew' },
  { code: 'fa', label: 'Persian' },
  { code: 'ur', label: 'Urdu' },
  { code: 'sw', label: 'Swahili' },
  { code: 'ca', label: 'Catalan' },
  { code: 'gl', label: 'Galician' },
  { code: 'hr', label: 'Croatian' },
  { code: 'bg', label: 'Bulgarian' },
  { code: 'sk', label: 'Slovak' },
  { code: 'sl', label: 'Slovenian' },
  { code: 'lt', label: 'Lithuanian' },
  { code: 'lv', label: 'Latvian' },
  { code: 'et', label: 'Estonian' },
] as const
