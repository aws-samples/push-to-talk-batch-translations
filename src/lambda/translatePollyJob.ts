import * as fs from 'fs';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import { OutputFormat, PollyClient, SynthesizeSpeechCommand, SynthesizeSpeechCommandOutput, VoiceId } from '@aws-sdk/client-polly';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { GetTranscriptionJobCommand, TranscribeClient } from '@aws-sdk/client-transcribe';
import { TranslateClient, TranslateTextCommand, TranslateTextCommandOutput } from '@aws-sdk/client-translate';

interface Input {
  jobId: string;
  sourceLanguage: string;
  targetLanguage: string;
  bucket: string;
  key: string;
}

const s3 = new S3Client({ region: process.env.REGION || 'us-east-1' });
const translateClient = new TranslateClient({ region: process.env.REGION || 'us-east-1' });
const polly = new PollyClient({ region: process.env.REGION || 'us-east-1' });
const transcribeClient = new TranscribeClient({ region: process.env.REGION || 'us-east-1' });

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

  console.log('Translation: ' + translatedTranscribedText);

  return translatedTranscribedText;
}

async function synthesizePollySpeech (text: string, language: string) : Promise<string> {
  let voiceId = VoiceId.Matthew;
  const outputFileName = '/tmp/output.mp3';

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
  const synthesizeSpeechRequest = new SynthesizeSpeechCommand({
    OutputFormat: OutputFormat.MP3,
    VoiceId: voiceId,
    Text: text,
  });

  try {
    const synthesizeSpeechResult: SynthesizeSpeechCommandOutput = await polly.send(synthesizeSpeechRequest);
    const outputStream = fs.createWriteStream(outputFileName);
    const inputStream = synthesizeSpeechResult;

    if (inputStream.AudioStream instanceof Readable) {
      inputStream.AudioStream.pipe(outputStream);
      inputStream.AudioStream.on('end', () => {
        outputStream.close();
      });
    }
  } catch (e: any) {
    console.error(e.toString());
  }
  return outputFileName;
}

async function saveOnS3(bucket: string, outputFile: string): Promise<string> {
  const fileName = `output/${outputFile}.mp3`;
  const putObjectCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: fileName,
    Body: createReadStream(outputFile),
  });

  await s3.send(putObjectCommand);
  return fileName;
}

export const handler = async (input: Input) => {
  console.log(`Bucket:${input.bucket}`);
  console.log(`Key:${input.key}`);
  console.log(`Source Language: ${input.sourceLanguage}`);
  console.log(`Target: ${input.targetLanguage}`);

  const command = new GetTranscriptionJobCommand({ TranscriptionJobName: input.jobId });
  const transcriptResponse = await transcribeClient.send(command);

  const s3TranscriptLocation = transcriptResponse.TranscriptionJob?.Transcript?.TranscriptFileUri || '';
  if (s3TranscriptLocation === '') {
    throw new Error('No transcript s3 found');
  }
  console.log(`Transcript S3: ${s3TranscriptLocation}`);

  const s3UriParts = s3TranscriptLocation.split('/');

  const s3GetCommand = new GetObjectCommand({
    Bucket: s3UriParts[2],
    Key: s3UriParts[3],
  });
  const s3Response = s3.send(s3GetCommand);
  const transcript = (await s3Response).Body?.toString() || '';

  const translatedText = await translateText(
    transcript,
    input.sourceLanguage,
    input.targetLanguage,
  );

  const outputPollyFile = await synthesizePollySpeech(translatedText, input.targetLanguage);

  return saveOnS3(input.bucket, outputPollyFile);
};

