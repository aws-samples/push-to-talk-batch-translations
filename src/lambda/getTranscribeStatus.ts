import { GetTranscriptionJobCommand, TranscribeClient } from '@aws-sdk/client-transcribe';

interface Input {
  jobId: string;
}

export const handler = async (input: Input) => {
  console.log(`Received event: ${JSON.stringify(input)}`);
  const jobId = input.jobId;
  try {
    const transcribeClient = new TranscribeClient({ region: process.env.REGION || 'us-east-1' });
    const command = new GetTranscriptionJobCommand({
      TranscriptionJobName: jobId,
    });
    const response = await transcribeClient.send(command);
    console.log(`Response: ${JSON.stringify(response)}`);
    return response.TranscriptionJob?.TranscriptionJobStatus;

  } catch (e: any) {
    console.log(e);
    throw new Error('Error getting Transcribe Job status');
  }
};
