import path from 'path';
import { App, CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { AllowedMethods, Distribution, HttpVersion, PriceClass, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { CfnIdentityPool, CfnIdentityPoolRoleAttachment } from 'aws-cdk-lib/aws-cognito';
import { ArnPrincipal, Effect, FederatedPrincipal, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

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
    const bucketPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: [`${voiceTranslatorBucket.bucketArn}/*`],
      principals: [new ArnPrincipal('*')],
    });

    voiceTranslatorBucket.addToResourcePolicy(bucketPolicy);

    // Lambda
    const voiceTranslatorLambdaRole = new Role(this, 'VoiceTranslatorLambdaRole', {
      assumedBy: new ServicePrincipal('amazonaws.com'),
      inlinePolicies: {
        // Add policies here
      },
    });

    const voiceTranslatorLambda = new NodejsFunction(this,
      'VoiceTranslatorLambda', {
        handler: 'handler',
        entry: path.join(__dirname, '../lambda/babelFsish.ts'),
        role: voiceTranslatorLambdaRole,
        runtime: Runtime.NODEJS_18_X,
        architecture: Architecture.ARM_64,
        memorySize: 1024,
        timeout: Duration.seconds(30),
        bundling: {
          minify: true,
          externalModules: ['aws-sdk'],
        },
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
      enableIpv6: false,
      priceClass: PriceClass.PRICE_CLASS_ALL,
    });


    // Lambda Role
    const lambdaRole = new Role(this, 'VoiceTranslatorLambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        TranscribeAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['transcribe:StartStreamTranscription'],
              effect: Effect.ALLOW,
              resources: ['*'],
            }),
          ],
        }),
        CloudWatchPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
              effect: Effect.ALLOW,
              resources: ['arn:aws:logs:*:*:*'],
            }),
          ],
        }),
        TranslateAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['translate:TranslateText'],
              effect: Effect.ALLOW,
              resources: ['*'],
            }),
          ],
        }),
        PollyAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['polly:SynthesizeSpeech'],
              effect: Effect.ALLOW,
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Add S3Access policy to Lambda Role
    lambdaRole.addToPolicy(
      new PolicyStatement({
        actions: ['s3:GetObject', 's3:PutObject', 's3:PutObjectAcl'],
        effect: Effect.ALLOW,
        resources: [`${voiceTranslatorBucket.bucketArn}/*`],
      }),
    );

    // Add S3LocationAccess policy to Lambda Role
    lambdaRole.addToPolicy(
      new PolicyStatement({
        actions: ['s3:GetBucketLocation'],
        effect: Effect.ALLOW,
        resources: ['arn:aws:s3:::*'],
      }),
    );

    // Cognito Identity Pool
    const identityPool = new CfnIdentityPool(this, 'CognitoIdentityPool', {
      allowUnauthenticatedIdentities: true,
    });

    const unAuthRole = new Role(this, 'CognitoUnAuthorizedRole', {
      assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {}, 'sts:AssumeRoleWithWebIdentity'),
      inlinePolicies: {
        CognitoUnauthorizedPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['lambda:InvokeFunction'],
              effect: Effect.ALLOW,
              resources: [voiceTranslatorLambda.functionArn],
            }),
            new PolicyStatement({
              actions: ['s3:PutObject'],
              effect: Effect.ALLOW,
              resources: [`${voiceTranslatorBucket.bucketArn}/*`],
            }),
          ],
        }),
      },
    });

    // Identity Pool Role Mapping
    new CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleMapping', {
      identityPoolId: identityPool.ref,
      roles: {
        unauthenticated: unAuthRole.roleArn,
      },
    });

    // Outputs
    new CfnOutput(this, 'VoiceTranslatorBucketOutput', {
      description: 'VoiceTranslator S3 Bucket',
      value: voiceTranslatorBucket.bucketName,
    });

    new CfnOutput(this, 'IdentityPoolIdOutput', {
      description: 'IdentityPoolId',
      value: identityPool.ref,
    });

    new CfnOutput(this, 'VoiceTranslatorLambdaOutput', {
      description: 'VoiceTranslator Lambda',
      value: voiceTranslatorLambda.functionArn,
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