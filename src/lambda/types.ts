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