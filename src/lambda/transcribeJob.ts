import {
  LanguageCode,
  StartTranscriptionJobCommand,
  StartTranscriptionJobCommandOutput,
  TranscribeClient,
} from '@aws-sdk/client-transcribe';
import { TranscribeInput, TranscribeOutput } from './types';
import { getFileNameFromKey, getTranscribeLanguageCode } from './utilities';


const transcribeClient = new TranscribeClient({ region: process.env.REGION || 'us-east-1' });

async function transcribe(
  bucket: string,
  inputKey: string,
  sourceLanguage: string,
): Promise<string> {
  const languageCode: LanguageCode = getTranscribeLanguageCode(sourceLanguage);
  const s3Path = `s3://${bucket}/${inputKey}`;
  const fileNameNoType = getFileNameFromKey(inputKey);
  console.log(`Transcribing ${s3Path} to ${languageCode}...`);
  try {
    const command = new StartTranscriptionJobCommand({
      TranscriptionJobName: `transcription-${languageCode}-${Date.now()}`,
      LanguageCode: languageCode,
      Media: {
        MediaFileUri: s3Path,
      },
      OutputBucketName: bucket,
      OutputKey: (`transcription/${fileNameNoType}.json`).replace(/ /g, '_'),
    });
    console.log(`command: ${JSON.stringify(command)} `);
    const transcription: StartTranscriptionJobCommandOutput = await transcribeClient.send(command);

    console.log(`transcription output, ${JSON.stringify(transcription)}`);
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

export const handler = async (input: TranscribeInput): Promise<TranscribeOutput> => {
  console.log('input: ', input);
  // @ts-ignore
  const inputKey = input.key || input.arguments.input.key;
  // @ts-ignore
  const inputBucket = input.bucket || input.arguments.input.bucket;
  // @ts-ignore
  const inputSourceLanguage = input.sourceLanguage || input.arguments.input.sourceLanguage;
  // @ts-ignore
  const inputTargetLanguage = input.targetLanguage || input.arguments.input.targetLanguage;

  const jobId = await transcribe(
    inputBucket,
    inputKey,
    inputSourceLanguage,
  );

  console.log('jobId: ', jobId);
  return {
    jobId: jobId,
    bucket: inputBucket,
    key: inputKey,
    sourceLanguage: inputSourceLanguage,
    targetLanguage: inputTargetLanguage,
  };
};

