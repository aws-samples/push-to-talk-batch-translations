import { GetTranscriptionJobCommand, GetTranscriptionJobCommandOutput, TranscribeClient } from '@aws-sdk/client-transcribe';
import { GetTranscribeStatusOutput, TranscribeOutput } from './types';

export const handler = async (input: TranscribeOutput): Promise<GetTranscribeStatusOutput> => {
  console.log(`Received event: ${JSON.stringify(input)}`);

  const jobId = input.jobId;
  if (!jobId) {
    console.error('Job ID is missing or invalid');
    throw new Error('Job ID is required');
  }

  try {
    const transcribeClient = new TranscribeClient({ region: process.env.REGION || 'us-east-1' });
    const command = new GetTranscriptionJobCommand({
      TranscriptionJobName: jobId,
    });

    const response: GetTranscriptionJobCommandOutput = await transcribeClient.send(command);
    console.log(`Response: ${JSON.stringify(response)}`);

    return {
      ...input,
      transcriptFileUri: response.TranscriptionJob?.Transcript?.TranscriptFileUri || '',
      status: response.TranscriptionJob?.TranscriptionJobStatus || 'NOT_STARTED',
    };

  } catch (e: any) {
    console.log(e);
    throw new Error('Error getting Transcribe Job status');
  }
};
