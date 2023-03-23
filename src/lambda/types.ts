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
