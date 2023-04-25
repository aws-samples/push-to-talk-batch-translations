/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateTranslationRecordingsInput = {
  jobId: string,
  bucket?: string | null,
  key?: string | null,
  sourceLanguage?: string | null,
  targetLanguage?: string | null,
};

export type TranslationRecordings = {
  __typename: "TranslationRecordings",
  bucket?: string | null,
  key?: string | null,
  sourceLanguage?: string | null,
  targetLanguage?: string | null,
  transcription?: string | null,
  translatedText?: string | null,
  pollyLocation?: string | null,
};

export type UpdateTranslationRecordingsInput = {
  jobId: string,
  bucket?: string | null,
  key?: string | null,
  sourceLanguage?: string | null,
  targetLanguage?: string | null,
  transcription?: string | null,
  translatedText?: string | null,
  pollyLocation?: string | null,
};

export type DeleteTranslationRecordingsInput = {
  jobId: string,
};

export type TableTranslationRecordingsFilterInput = {
  jobId?: TableIDFilterInput | null,
  bucket?: TableStringFilterInput | null,
  key?: TableStringFilterInput | null,
  sourceLanguage?: TableStringFilterInput | null,
  targetLanguage?: TableStringFilterInput | null,
};

export type TableIDFilterInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
};

export type TableStringFilterInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
};

export type TranslationRecordingsConnection = {
  __typename: "TranslationRecordingsConnection",
  items?:  Array<TranslationRecordings | null > | null,
  nextToken?: string | null,
};

export type StartTranslationSfnMutationVariables = {
  input: CreateTranslationRecordingsInput,
};

export type StartTranslationSfnMutation = {
  startTranslationSfn?:  {
    __typename: "TranslationRecordings",
    bucket?: string | null,
    key?: string | null,
    sourceLanguage?: string | null,
    targetLanguage?: string | null,
    transcription?: string | null,
    translatedText?: string | null,
    pollyLocation?: string | null,
  } | null,
};

export type CreateTranslationRecordingsMutationVariables = {
  input: CreateTranslationRecordingsInput,
};

export type CreateTranslationRecordingsMutation = {
  createTranslationRecordings?:  {
    __typename: "TranslationRecordings",
    bucket?: string | null,
    key?: string | null,
    sourceLanguage?: string | null,
    targetLanguage?: string | null,
    transcription?: string | null,
    translatedText?: string | null,
    pollyLocation?: string | null,
  } | null,
};

export type UpdateTranslationRecordingsMutationVariables = {
  input: UpdateTranslationRecordingsInput,
};

export type UpdateTranslationRecordingsMutation = {
  updateTranslationRecordings?:  {
    __typename: "TranslationRecordings",
    bucket?: string | null,
    key?: string | null,
    sourceLanguage?: string | null,
    targetLanguage?: string | null,
    transcription?: string | null,
    translatedText?: string | null,
    pollyLocation?: string | null,
  } | null,
};

export type DeleteTranslationRecordingsMutationVariables = {
  input: DeleteTranslationRecordingsInput,
};

export type DeleteTranslationRecordingsMutation = {
  deleteTranslationRecordings?:  {
    __typename: "TranslationRecordings",
    bucket?: string | null,
    key?: string | null,
    sourceLanguage?: string | null,
    targetLanguage?: string | null,
    transcription?: string | null,
    translatedText?: string | null,
    pollyLocation?: string | null,
  } | null,
};

export type GetTranslationRecordingsQueryVariables = {
  jobId: string,
};

export type GetTranslationRecordingsQuery = {
  getTranslationRecordings?:  {
    __typename: "TranslationRecordings",
    bucket?: string | null,
    key?: string | null,
    sourceLanguage?: string | null,
    targetLanguage?: string | null,
    transcription?: string | null,
    translatedText?: string | null,
    pollyLocation?: string | null,
  } | null,
};

export type ListTranslationRecordingsQueryVariables = {
  filter?: TableTranslationRecordingsFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListTranslationRecordingsQuery = {
  listTranslationRecordings?:  {
    __typename: "TranslationRecordingsConnection",
    items?:  Array< {
      __typename: "TranslationRecordings",
      bucket?: string | null,
      key?: string | null,
      sourceLanguage?: string | null,
      targetLanguage?: string | null,
      transcription?: string | null,
      translatedText?: string | null,
      pollyLocation?: string | null,
    } | null > | null,
    nextToken?: string | null,
  } | null,
};

export type OnCreateTranslationRecordingsSubscriptionVariables = {
  jobId?: string | null,
  bucket?: string | null,
  key?: string | null,
  sourceLanguage?: string | null,
  targetLanguage?: string | null,
};

export type OnCreateTranslationRecordingsSubscription = {
  onCreateTranslationRecordings?:  {
    __typename: "TranslationRecordings",
    bucket?: string | null,
    key?: string | null,
    sourceLanguage?: string | null,
    targetLanguage?: string | null,
    transcription?: string | null,
    translatedText?: string | null,
    pollyLocation?: string | null,
  } | null,
};

export type OnUpdateTranslationRecordingsSubscriptionVariables = {
  jobId?: string | null,
  bucket?: string | null,
  key?: string | null,
  sourceLanguage?: string | null,
  targetLanguage?: string | null,
};

export type OnUpdateTranslationRecordingsSubscription = {
  onUpdateTranslationRecordings?:  {
    __typename: "TranslationRecordings",
    bucket?: string | null,
    key?: string | null,
    sourceLanguage?: string | null,
    targetLanguage?: string | null,
    transcription?: string | null,
    translatedText?: string | null,
    pollyLocation?: string | null,
  } | null,
};

export type OnDeleteTranslationRecordingsSubscriptionVariables = {
  jobId?: string | null,
  bucket?: string | null,
  key?: string | null,
  sourceLanguage?: string | null,
  targetLanguage?: string | null,
};

export type OnDeleteTranslationRecordingsSubscription = {
  onDeleteTranslationRecordings?:  {
    __typename: "TranslationRecordings",
    bucket?: string | null,
    key?: string | null,
    sourceLanguage?: string | null,
    targetLanguage?: string | null,
    transcription?: string | null,
    translatedText?: string | null,
    pollyLocation?: string | null,
  } | null,
};
