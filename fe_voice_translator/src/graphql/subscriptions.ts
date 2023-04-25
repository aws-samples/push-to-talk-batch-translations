/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateTranslationRecordings = /* GraphQL */ `
  subscription OnCreateTranslationRecordings(
    $jobId: ID
    $bucket: String
    $key: String
    $sourceLanguage: String
    $targetLanguage: String
  ) {
    onCreateTranslationRecordings(
      jobId: $jobId
      bucket: $bucket
      key: $key
      sourceLanguage: $sourceLanguage
      targetLanguage: $targetLanguage
    ) {
      bucket
      key
      sourceLanguage
      targetLanguage
      transcription
      translatedText
      pollyLocation
    }
  }
`;
export const onUpdateTranslationRecordings = /* GraphQL */ `
  subscription OnUpdateTranslationRecordings(
    $jobId: ID
    $bucket: String
    $key: String
    $sourceLanguage: String
    $targetLanguage: String
  ) {
    onUpdateTranslationRecordings(
      jobId: $jobId
      bucket: $bucket
      key: $key
      sourceLanguage: $sourceLanguage
      targetLanguage: $targetLanguage
    ) {
      bucket
      key
      sourceLanguage
      targetLanguage
      transcription
      translatedText
      pollyLocation
    }
  }
`;
export const onDeleteTranslationRecordings = /* GraphQL */ `
  subscription OnDeleteTranslationRecordings(
    $jobId: ID
    $bucket: String
    $key: String
    $sourceLanguage: String
    $targetLanguage: String
  ) {
    onDeleteTranslationRecordings(
      jobId: $jobId
      bucket: $bucket
      key: $key
      sourceLanguage: $sourceLanguage
      targetLanguage: $targetLanguage
    ) {
      bucket
      key
      sourceLanguage
      targetLanguage
      transcription
      translatedText
      pollyLocation
    }
  }
`;
