import { OutputFormat, PollyClient, SynthesizeSpeechCommand, SynthesizeSpeechCommandOutput } from '@aws-sdk/client-polly';
import { GetObjectCommand, GetObjectCommandOutput, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { TranslateClient, TranslateTextCommand, TranslateTextCommandOutput } from '@aws-sdk/client-translate';
// eslint-disable-next-line import/no-extraneous-dependencies
import { default as fetch, Request } from 'node-fetch';
import { GetTranscribeStatusOutput, TranslationPollyRow } from './types';
import { getFileNameFromKey, handlePollyLanguageCode, handleVoiceId } from './utilities';

const s3 = new S3Client({ region: process.env.REGION || 'us-east-1' });
const translateClient = new TranslateClient({ region: process.env.REGION || 'us-east-1' });
const pollyClient = new PollyClient({ region: process.env.REGION || 'us-east-1' });
const GRAPHQL_ENDPOINT = 'https://d6myzu3n4nehrpuryebzkbjria.appsync-api.us-west-2.amazonaws.com/graphql';
const GRAPHQL_API_KEY = 'da2-6nw5jfnds5hsvkmlolu46g2h2i';

async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<string> {
  if (targetLanguage === 'ca') {
    targetLanguage = 'fr';
  }

  if (targetLanguage === 'gb') {
    targetLanguage = 'en';
  }

  const requestCommand = new TranslateTextCommand({
    Text: text,
    SourceLanguageCode: sourceLanguage,
    TargetLanguageCode: targetLanguage,
  });

  const translateRequest: TranslateTextCommandOutput = await translateClient.send(requestCommand);

  const translatedTranscribedText: string = translateRequest.TranslatedText || '';

  return translatedTranscribedText;
}


async function synthesizePollySpeech(text: string, language: string, key: string, bucket: string): Promise<{ FileName: string }> {
  const voiceId = handleVoiceId(language);
  const languageCode = handlePollyLanguageCode(language);
  console.log(`Input language: ${languageCode}`);
  const synthesizeSpeechRequest = new SynthesizeSpeechCommand({
    OutputFormat: OutputFormat.MP3,
    VoiceId: voiceId,
    Text: text,
    TextType: 'text',
    LanguageCode: languageCode,
  });
  const suffix = key.split('/')[1];

  try {
    const synthesizeSpeechResult: SynthesizeSpeechCommandOutput = await pollyClient.send(synthesizeSpeechRequest);
    console.log('synthesizeSpeechResult', synthesizeSpeechResult);

    // @ts-ignore
    const response = new Response(synthesizeSpeechResult.AudioStream as ReadableStream);

    const arrayBuffer = await response.arrayBuffer();
    const s3Response = await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `voice/${suffix}`,
        Body: arrayBuffer as any,
        ContentEncoding: 'base64',
        Metadata: {
          'Content-Type': 'audio/wav',
        },
      }),
    );
    console.log('s3Response Success', s3Response);

  } catch (e: any) {
    console.error(e.toString());
  }
  return { FileName: `voice/${suffix}.mp3` };
}

async function getTranscriptFile(bucket: string, inputKey: string): Promise<string> {
  const fileNameNoType = getFileNameFromKey(inputKey);

  const transcriptS3GetCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: `transcription/${fileNameNoType}.json`,
  });
  try {
    const transcriptResponse: GetObjectCommandOutput = await s3.send(transcriptS3GetCommand);
    const transcriptRaw = await transcriptResponse?.Body?.transformToString('utf-8') || '';
    const transcript = JSON.parse(transcriptRaw)?.results.transcripts[0].transcript;
    console.log('transcript', JSON.stringify(transcript));
    return transcript;
  } catch (e: any) {
    console.error('Error getting transcript file, potentially file doesnt exist');
    console.error(e.toString());
    return '';
  }

}

async function callAppSyncEndpoint(input: TranslationPollyRow) {

  const query = `
    mutation updateTranslationRecordings($input: UpdateTranslationRecordingsInput!) {
      updateTranslationRecordings(input: $input) {
        targetLanguage
        transcription
        translatedText
        sourceLanguage
        pollyLocation
      }
    }
  `;

  const options = {
    method: 'POST',
    headers: {
      'x-api-key': GRAPHQL_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        ...input,
      },
    }),
  };

  try {
    const response = await fetch(new Request(GRAPHQL_ENDPOINT, options));
    const jsonResponse = await response.json();
    console.log(jsonResponse, 'response from Dynamodb');
    return jsonResponse;
  } catch (error) {
    console.error(error, 'error from Dynamodb');
    return {
      errors: error,
    };
  }
}

export const handler = async (input: GetTranscribeStatusOutput) => {
  console.log('input', input);
  const escapedKey = input.key.replace(/ /g, '_');

  const transcript = await getTranscriptFile(input.bucket, escapedKey);
  console.log(`transcription successful: ${JSON.stringify(transcript)}`);
  await callAppSyncEndpoint({
    ...input,
    transcription: transcript,
  });

  const translatedText = await translateText(
    transcript,
    input.sourceLanguage,
    input.targetLanguage,
  );
  await callAppSyncEndpoint({
    ...input,
    translatedText,
  });

  console.log(`translatedText: ${JSON.stringify(translatedText)}`);

  const outputPollyFile = await synthesizePollySpeech(translatedText,
    input.targetLanguage,
    escapedKey,
    input.bucket,
  );
    // Call appsync to update the row with the polly location
  await callAppSyncEndpoint({
    ...input,
    pollyLocation: outputPollyFile.FileName,
  });

  console.log('outputPollyFile ', outputPollyFile);
  return {
    ...input,
    outputPollyFile,
  };
};

