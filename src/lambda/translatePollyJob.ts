import { OutputFormat, PollyClient, SynthesizeSpeechCommand, SynthesizeSpeechCommandOutput, VoiceId } from '@aws-sdk/client-polly';
import { GetObjectCommand, GetObjectCommandOutput, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { TranslateClient, TranslateTextCommand, TranslateTextCommandOutput } from '@aws-sdk/client-translate';
import { GetTranscribeStatusOutput } from './types';

const s3 = new S3Client({ region: process.env.REGION || 'us-east-1' });
const translateClient = new TranslateClient({ region: process.env.REGION || 'us-east-1' });
const pollyClient = new PollyClient({ region: process.env.REGION || 'us-east-1' });

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

const handleVoiceId = (language: string): VoiceId => {
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
  return voiceId;
};

async function synthesizePollySpeech (text: string, language: string, key: string, bucket: string) : Promise<{ FileName: string }> {
  const voiceId = handleVoiceId(language);

  console.log(`Input language: ${language}`);

  const synthesizeSpeechRequest = new SynthesizeSpeechCommand({
    OutputFormat: OutputFormat.MP3,
    VoiceId: voiceId,
    Text: text,
    TextType: 'text',
    LanguageCode: language,
  });

  try {
    const synthesizeSpeechResult: SynthesizeSpeechCommandOutput = await pollyClient.send(synthesizeSpeechRequest);
    console.log('synthesizeSpeechResult', synthesizeSpeechResult);

    // @ts-ignore
    const response = new Response(synthesizeSpeechResult.AudioStream as ReadableStream);

    const arrayBuffer = await response.arrayBuffer();

    const s3Response = await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `voice/${key}.mp3`,
        Body: arrayBuffer as any,
        ContentEncoding: 'base64',
        Metadata: {
          'Content-Type': 'audio/mpeg',
        },
      }),
    );
    console.log('s3Response Success', s3Response);

  } catch (e: any) {
    console.error(e.toString());
  }
  return { FileName: `voice/${key}.mp3` };
}

async function getTranscriptFile(bucket: string, key: string): Promise<string> {
  const transcriptS3GetCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: `transcription/${key}.json`,
  });
  const transcriptResponse: GetObjectCommandOutput = await s3.send(transcriptS3GetCommand);

  const transcriptRaw = await transcriptResponse?.Body?.transformToString('utf-8') || '';

  const transcript = JSON.parse(transcriptRaw)?.results.transcripts[0].transcript;
  console.log('transcript', JSON.stringify(transcript));
  return transcript;
}

export const handler = async (input: GetTranscribeStatusOutput) => {
  const escapedKey = input.key.replace(/ /g, '_');

  const transcript = await getTranscriptFile(input.bucket, escapedKey);

  const translatedText = await translateText(
    transcript,
    input.sourceLanguage,
    input.targetLanguage,
  );

  console.log(`translatedText: ${JSON.stringify(translatedText)}`);

  const outputPollyFile = await synthesizePollySpeech(translatedText,
    input.targetLanguage,
    escapedKey,
    input.bucket,
  );
  console.log('outputPollyFile ', outputPollyFile);
  return outputPollyFile;
};

