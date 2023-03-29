import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { AppsyncFunctionProps } from 'aws-cdk-lib/aws-appsync';
export const handler = async (event: AppsyncFunctionProps) => {
  const client = new SFNClient({ region: process.env.REGION || 'us-east-1' });

  console.log(event, 'EVENT');
  const startExecutionCommand = new StartExecutionCommand({
    stateMachineArn: process.env.STATE_MACHINE_ARN,
    input: JSON.stringify(event),
  });

  try {
    const commandOutput = await client.send(startExecutionCommand);

    console.log('CONTENT commandOutput:', commandOutput);
    return commandOutput;
  } catch (err) {
    console.log(err);
    // const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
    // console.log(message);
    // @ts-ignore
    throw new Error(err);
  }
};

