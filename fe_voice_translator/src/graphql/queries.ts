/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getTranslationRecordings = /* GraphQL */ `
  query GetTranslationRecordings($jobId: ID!) {
    getTranslationRecordings(jobId: $jobId) {
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
export const listTranslationRecordings = /* GraphQL */ `
  query ListTranslationRecordings(
    $filter: TableTranslationRecordingsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTranslationRecordings(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        bucket
        key
        sourceLanguage
        targetLanguage
        transcription
        translatedText
        pollyLocation
      }
      nextToken
    }
  }
`;
