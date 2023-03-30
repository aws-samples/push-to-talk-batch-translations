export interface TranscribeInput {
  bucket: string;
  key: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranscribeOutput extends TranscribeInput {
  jobId: string;
}


export interface GetTranscribeStatusOutput extends TranscribeOutput {
  status: string;
  transcriptFileUri: string;
}
export interface TranslationPollyRow extends GetTranscribeStatusOutput {
  transcription?: string;
  translatedText?: string;
  pollyLocation?: string;
}
export interface tTranscriptServiceOutput {
  jobName: string;
  accountId: string;
  results: Results;
  status: string;
}

export interface Results {
  transcripts: Transcript[];
  items: Item[];
}

export interface Item {
  start_time?: string;
  end_time?: string;
  alternatives: Alternative[];
  type: Type;
}

export interface Alternative {
  confidence: string;
  content: string;
}

export enum Type {
  Pronunciation = 'pronunciation',
  Punctuation = 'punctuation',
}

export interface Transcript {
  transcript: string;
}

export interface CreateTranslationRecordingsInput {
  jobId: string;
  bucket: string;
  key: string;
  sourceLanguage: string;
  targetLanguage: string;
}


export interface UpdateTranslationRecordingsInput extends CreateTranslationRecordingsInput{
  transcription: string;
  translatedText?: string;
  pollyLocation?: string;
}