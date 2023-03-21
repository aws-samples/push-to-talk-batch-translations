import * as fs from 'fs';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import { OutputFormat, PollyClient, SynthesizeSpeechCommand, SynthesizeSpeechCommandOutput, VoiceId } from '@aws-sdk/client-polly';
import { GetObjectCommand, GetObjectCommandOutput, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { LanguageCode, StartTranscriptionJobCommand, StartTranscriptionJobCommandOutput, TranscribeClient } from '@aws-sdk/client-transcribe';
import { TranslateClient, TranslateTextCommand, TranslateTextCommandOutput } from '@aws-sdk/client-translate';

interface Input {
  bucket: string;
  key: string;
  sourceLanguage: string;
  targetLanguage: string;
}

const s3 = new S3Client({ region: process.env.REGION || 'us-east-1' });
const translateClient = new TranslateClient({ region: process.env.REGION || 'us-east-1' });
const polly = new PollyClient({ region: process.env.REGION || 'us-east-1' });
const transcribeClient = new TranscribeClient({ region: process.env.REGION || 'us-east-1' });

async function transcribe(
  bucket: string,
  key: string,
  sourceLanguage: string,
): Promise<string> {
  const languageCode: LanguageCode = getLanguageCode(sourceLanguage);

  // Build s3 path (s3://DOC-EXAMPLE-BUCKET/media-files/my-media-file.flac)
  const s3Path = `s3://${bucket}/${key}.mp3`;

  try {
    const transcription: StartTranscriptionJobCommandOutput = await transcribeClient.send(
      new StartTranscriptionJobCommand({
        TranscriptionJobName: `transcription-${languageCode}-${Date.now()}`,
        LanguageCode: languageCode,
        MediaFormat: 'mp3',
        Media: {
          MediaFileUri: s3Path,
        },
      }),
    );
    console.log(s3Path, 's3Path');
    console.log(transcription, 'transcription');
    const transcriptFileUri = transcription.TranscriptionJob?.Transcript?.TranscriptFileUri;
    // transcription.TranscriptionJob.Results[0].Alternatives[0].Transcript;'

    if (!transcriptFileUri) {
      console.error('Transcript file uri is empty');
      return '';
    }

    const transcribeS3Obj = parseUriString(transcriptFileUri);

    const transcriptCommand = new GetObjectCommand({
      Bucket: transcribeS3Obj.bucket,
      Key: transcribeS3Obj.key,
    });

    const transcriptFromS3: GetObjectCommandOutput = await s3.send(transcriptCommand);

    console.log('Transcript:', transcriptFromS3);

    return await (transcriptFromS3.Body?.transformToString() || '');
  } catch (error) {
    console.log(error);
    return '';
  }
}

function parseUriString (uriString: string) {
  if (uriString.length === 0) {
    return {
      bucket: '',
      key: '',
      region: '',
    };
  }
  const { host, pathname } = new URL(uriString);

  // @ts-ignore
  const [, region] = /s3.(.*).amazon/.exec(host);
  const [, bucket, key] = pathname.split('/');
  return {
    bucket,
    key,
    region,
  };
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

async function synthesize (text: string, language: string) : Promise<string> {
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

export const handler = async (input: Input) => {
  console.log(`Bucket:${input.bucket}`);
  console.log(`Key:${input.key}`);
  console.log(`Source Language: ${input.sourceLanguage}`);
  console.log(`Target: ${input.targetLanguage}` );
  async function saveOnS3(bucket: string, outputFile: string): Promise<string> {
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: `output/${outputFile}.mp3`,
      Body: createReadStream(outputFile),
      ACL: 'public-read',
    });

    await s3.send(putObjectCommand);
    return fileName;
  }

  // This is the main functionality that is called by Lambda
  const transcript = await transcribe(
    input.bucket,
    input.key,
    input.sourceLanguage,
  );

  const translatedText = await translateText(
    transcript,
    input.sourceLanguage,
    input.targetLanguage,
  );

  const outputFile = await synthesize(translatedText, input.targetLanguage);

  const fileName = await saveOnS3(input.bucket, outputFile);

  return fileName;
};

