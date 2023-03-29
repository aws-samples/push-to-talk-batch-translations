import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
export const handler = async () => {
  const client = new SFNClient({ region: process.env.REGION || 'us-east-1' });
  // start stepfunction
  const startExecutionCommand = new StartExecutionCommand({
    stateMachineArn: process.env.STATE_MACHINE_ARN,
  });

  try {
    const commandOutput = await client.send(startExecutionCommand);

    console.log('CONTENT TYPE:', commandOutput);
    return commandOutput;
  } catch (err) {
    console.log(err);
    // const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
    // console.log(message);
    // @ts-ignore
    throw new Error(err);
  }
};

