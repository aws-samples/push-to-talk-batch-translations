import { App, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AllowedMethods, Distribution, HttpVersion, PriceClass, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { cdk } from 'projen';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket } from 'aws-cdk-lib/aws-s3';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);


    const voiceTranslatorBucket = new Bucket(this, 'VoiceTranslatorBucket', {
      publicReadAccess: true,
      websiteIndexDocument: 'voice-translator.html',
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST, HttpMethods.HEAD],
          allowedOrigins: ['*'],
          id: 'myCORSRuleId1',
          maxAge: 3600,
        },
      ],
    });

    // S3 Bucket Policy
    const bucketPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: [`${voiceTranslatorbucketArn}/*`],
      principals: [new iam.ArnPrincipal('*')],
    });

    voiceTranslatoraddToResourcePolicy(bucketPolicy);

    // Lambda
    const voiceTranslatorLambdaRole = new iam.Role(this, 'VoiceTranslatorLambdaRole', {
      assumedBy: new iam.ServicePrincipal('amazonaws.com'),
      inlinePolicies: {
        // Add policies here
      },
    });

    const voiceTranslatorLambda = new Function(this, 'VoiceTranslatorLambda', {
      handler: 'app.babelfish.LambdaHandler::handleRequest',
      runtime: Runtime.JAVA_8,
      role: voiceTranslatorLambdaRole,
      code: fromBucket(fromBucketAttributes(this, 'MyBucket', { bucketName: 'tomash-us-east-1' }), 'voice-translator/lambda/voice-translator-jar'),
      memorySize: 1024,
      timeout: Duration.seconds(30),
    });

    // CloudFront
    const cfDistribution = new Distribution(this, 'CfDistribution', {
      defaultBehavior: {
        origin: new S3Origin(voiceTranslatorBucket),
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      httpVersion: HttpVersion.HTTP1_1,
      ipv6Enabled: false,
      priceClass: PriceClass.PRICE_CLASS_ALL,
    });

  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'translation-walkie-talkie-dev', { env: devEnv });
// new MyStack(app, 'translation-walkie-talkie-prod', { env: prodEnv });

app.synth();