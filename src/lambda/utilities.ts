import { LanguageCode as PollyLanguageCode, VoiceId } from '@aws-sdk/client-polly';
import { LanguageCode as TranscribeLanguageCode } from '@aws-sdk/client-transcribe';

export const getFileNameFromKey = (inputKey: string) => {
  const separatedValues = inputKey.split('/');
  console.log(inputKey, 'inputKey');
  return separatedValues[separatedValues.length-1].split('.')[0];
};

export const handlePollyLanguageCode = (targetLanguage: string) => {
  // commented out languages are not supported by polly
  switch (targetLanguage) {
    case 'ar':
      return PollyLanguageCode.ar_AE;
    case 'af':
      return PollyLanguageCode.en_ZA;
    // TODO: No Hebrew support
    // case 'he':
      //   return PollyLanguageCode;
    case 'zh':
      return PollyLanguageCode.cmn_CN;
    case 'ja':
      return PollyLanguageCode.ja_JP;
    case 'fr':
      return PollyLanguageCode.fr_FR;
    case 'ru':
      return PollyLanguageCode.ru_RU;
    case 'es':
      return PollyLanguageCode.es_US;
    case 'tr':
      return PollyLanguageCode.tr_TR;
    default:
      return PollyLanguageCode.en_US;
  }
};

export function getTranscribeLanguageCode(sourceLanguage: string): TranscribeLanguageCode {
  switch (sourceLanguage) {
    case 'ar':
      return TranscribeLanguageCode.AR_SA;
    case 'af':
      return TranscribeLanguageCode.AF_ZA;
    case 'zh':
      return TranscribeLanguageCode.ZH_CN;
    case 'ja':
      return TranscribeLanguageCode.JA_JP;
    case 'he':
      return TranscribeLanguageCode.HE_IL;
    case 'ru':
      return TranscribeLanguageCode.RU_RU;
    case 'tr':
      return TranscribeLanguageCode.TR_TR;
    case 'es':
      return TranscribeLanguageCode.ES_US;
    case 'gb':
      return TranscribeLanguageCode.EN_GB;
    case 'ca':
      return TranscribeLanguageCode.FR_CA;
    case 'fr':
      return TranscribeLanguageCode.FR_FR;
    default:
      return TranscribeLanguageCode.EN_US;
  }
}

export const handleVoiceId = (language: string): VoiceId => {
  let voiceId = VoiceId.Matthew;

  if (language === 'pl') {
    voiceId = VoiceId.Maja;
  }

  if (language === 'es') {
    voiceId = VoiceId.Miguel;
  }

  if (language === 'fr') {
    voiceId = VoiceId.Mathieu;
  }

  if (language === 'ja') {
    voiceId = VoiceId.Takumi;
  }

  if (language === 'ru') {
    voiceId = VoiceId.Maxim;
  }

  if (language === 'de') {
    voiceId = VoiceId.Hans;
  }

  if (language === 'it') {
    voiceId = VoiceId.Giorgio;
  }

  if (language === 'sv') {
    voiceId = VoiceId.Astrid;
  }

  if (language === 'gb') {
    voiceId = VoiceId.Brian;
  }

  if (language === 'ca') {
    voiceId = VoiceId.Chantal;
  }

  if (language === 'af') {
    voiceId = VoiceId.Filiz;
  }
  return voiceId;
};