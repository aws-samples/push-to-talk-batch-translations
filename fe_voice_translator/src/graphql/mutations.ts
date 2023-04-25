/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const startTranslationSfn = /* GraphQL */ `
  mutation StartTranslationSfn($input: CreateTranslationRecordingsInput!) {
    startTranslationSfn(input: $input) {
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
export const createTranslationRecordings = /* GraphQL */ `
  mutation CreateTranslationRecordings(
    $input: CreateTranslationRecordingsInput!
  ) {
    createTranslationRecordings(input: $input) {
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
export const updateTranslationRecordings = /* GraphQL */ `
  mutation UpdateTranslationRecordings(
    $input: UpdateTranslationRecordingsInput!
  ) {
    updateTranslationRecordings(input: $input) {
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
export const deleteTranslationRecordings = /* GraphQL */ `
  mutation DeleteTranslationRecordings(
    $input: DeleteTranslationRecordingsInput!
  ) {
    deleteTranslationRecordings(input: $input) {
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
