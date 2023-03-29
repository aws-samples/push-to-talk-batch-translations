import {
  LanguageCode,
  MediaFormat,
  StartTranscriptionJobCommand,
  StartTranscriptionJobCommandOutput,
  TranscribeClient,
} from '@aws-sdk/client-transcribe';
import { TranscribeInput, TranscribeOutput } from './types';


const transcribeClient = new TranscribeClient({ region: process.env.REGION || 'us-east-1' });

async function transcribe(
  bucket: string,
  key: string,
  sourceLanguage: string,
): Promise<string> {
  const languageCode: LanguageCode = getLanguageCode(sourceLanguage);

  // Build s3 path (s3://DOC-EXAMPLE-BUCKET/media-files/my-media-file.flac)
  const s3Path = `s3://${bucket}/${key}.wav`;

  try {
    const transcription: StartTranscriptionJobCommandOutput = await transcribeClient.send(
      new StartTranscriptionJobCommand({
        TranscriptionJobName: `transcription-${languageCode}-${Date.now()}`,
        LanguageCode: languageCode,
        MediaFormat: MediaFormat.WAV,
        Media: {
          MediaFileUri: s3Path,
        },
        OutputBucketName: bucket,
        OutputKey: (`transcription/${key}.json`).replace(/ /g, '_'),
      }),
    );
    const transcriptionJobName = transcription.TranscriptionJob?.TranscriptionJobName;

    if (!transcriptionJobName) {
      console.error('Transcript Job is empty');
      return '';
    }

    return transcriptionJobName;
  } catch (error) {
    console.log('Transcript Error: ', error);
    return '';
  }
}

// TODO: Add more languages
function getLanguageCode(sourceLanguage: string): LanguageCode {
  switch (sourceLanguage) {
    case 'es':
      return LanguageCode.ES_US;
    case 'gb':
      return LanguageCode.EN_GB;
    case 'ca':
      return LanguageCode.FR_CA;
    case 'fr':
      return LanguageCode.FR_FR;
    default:
      return LanguageCode.EN_US;
  }
}

export const handler = async (input: TranscribeInput): Promise<TranscribeOutput> => {
  const jobId = await transcribe(
    input.bucket,
    input.key,
    input.sourceLanguage,
  );

  console.log('jobId: ', jobId);
  return {
    jobId: jobId,
    bucket: input.bucket,
    key: input.key,
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
  };
};

