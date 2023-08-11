import path from 'path';
import {
  GraphqlApi,
  MappingTemplate,
  FieldLogLevel,
  Schema,
} from '@aws-cdk/aws-appsync-alpha';
import { AuthorizationType } from '@aws-cdk/aws-appsync-alpha/lib/graphqlapi';
import { App, CfnOutput, Duration, Expiration, Stack, StackProps } from 'aws-cdk-lib';
import { AllowedMethods, Distribution, HttpVersion, PriceClass, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { CfnIdentityPool, CfnIdentityPoolRoleAttachment } from 'aws-cdk-lib/aws-cognito';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, FederatedPrincipal, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { BlockPublicAccess, Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { Choice, Condition, Fail, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
dotenv.config();
export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const voiceTranslatorBucket = new Bucket(this, 'VoiceTranslatorBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
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

    // CloudFront
    const cfDistribution = new Distribution(this, 'CfDistribution', {
      defaultBehavior: {
        origin: new S3Origin(voiceTranslatorBucket),
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachedMethods: AllowedMethods.ALLOW_GET_HEAD,
        compress: false,
      },
      defaultRootObject: 'index.html',
      httpVersion: HttpVersion.HTTP1_1,
      enableIpv6: false,
      enabled: true,
      priceClass: PriceClass.PRICE_CLASS_ALL,
    });

    const cloudwatchPolicy = new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
          effect: Effect.ALLOW,
          resources: ['arn:aws:logs:*:*:*'],
        }),
      ],
    });

    // Lambda Role
    const transcribeLambdaRole = new Role(this, 'VoiceTranslatorLambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        TranscribeAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['transcribe:StartStreamTranscription', 'transcribe:StartTranscriptionJob'],
              effect: Effect.ALLOW,
              resources: ['*'],
            }),
          ],
        }),
        S3Access: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['s3:GetObject', 's3:PutObject', 's3:PutObjectAcl', 's3:ListBucket'],
              effect: Effect.ALLOW,
              resources: [`${voiceTranslatorBucket.bucketArn}/*`],
            }),
          ],
        }),
        CloudWatchPolicy: cloudwatchPolicy,
      },
    });

    const translatePollyLambdaRole = new Role(this, 'TranslatePollyLambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        TranslateAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['translate:TranslateText'],
              effect: Effect.ALLOW,
              resources: ['*'],
            }),
          ],
        }),
        S3Access: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['s3:GetObject', 's3:PutObject', 's3:PutObjectAcl'],
              effect: Effect.ALLOW,
              resources: [`${voiceTranslatorBucket.bucketArn}/*`],
            }),
          ],
        }),
        BucketLocation: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['s3:GetBucketLocation'],
              effect: Effect.ALLOW,
              resources: ['arn:aws:s3:::*'],
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
        CloudWatchPolicy: cloudwatchPolicy,
      },
    });

    const getTranscribeStatusRole = new Role(this, 'getTranscribeStatusRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        TranscribeAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['transcribe:GetTranscriptionJob'],
              effect: Effect.ALLOW,
              resources: ['*'],
            }),
          ],
        }),
        CloudWatchPolicy: cloudwatchPolicy,
      },
    });

    const transcribeLambda = new NodejsFunction(this,
      'VoiceTranslatorLambda', {
        handler: 'handler',
        entry: path.join(__dirname, 'lambda', 'transcribeJob.ts'),
        role: transcribeLambdaRole,
        runtime: Runtime.NODEJS_18_X,
        architecture: Architecture.ARM_64,
        memorySize: 1024,
        timeout: Duration.seconds(30),
        bundling: {
          minify: true,
          externalModules: ['aws-sdk'],
        },
      });

    const getTranscribeStatusLambda = new NodejsFunction(this,
      'getTranscribeStatusLambda', {
        handler: 'handler',
        entry: path.join(__dirname, 'lambda', 'getTranscribeStatus.ts'),
        role: getTranscribeStatusRole,
        runtime: Runtime.NODEJS_18_X,
        architecture: Architecture.ARM_64,
        memorySize: 128,
        timeout: Duration.seconds(30),
      });

    const translatePollyLambda = new NodejsFunction(this,
      'translatePollyLambda', {
        handler: 'handler',
        entry: path.join(__dirname, 'lambda', 'translatePollyJob.ts'),
        role: translatePollyLambdaRole,
        runtime: Runtime.NODEJS_18_X,
        architecture: Architecture.ARM_64,
        memorySize: 128,
        timeout: Duration.seconds(30),
        environment: {
          API_GRAPHQLAPIENDPOINT: process.env.API_GRAPHQLAPIENDPOINT || '',
          API_GRAPHQLAPIKEY: process.env.API_GRAPHQLAPIKEY || '',
          REGION: props.env?.region || 'us-east-1',
        },
      });

    const transcribeJob = new LambdaInvoke(this, 'transcribeLambda', {
      lambdaFunction: transcribeLambda,
      // inputPath: '$.guid',
      outputPath: '$.Payload',
    });

    const getTranscribeStatus = new LambdaInvoke(this, 'Get Transcribe Job Status', {
      lambdaFunction: getTranscribeStatusLambda,
      // inputPath: '$.guid',
      outputPath: '$.Payload',
    });

    const translatePollyJob = new LambdaInvoke(this, 'Start Translate / Polly Job Status', {
      lambdaFunction: translatePollyLambda,
      // inputPath: '$.guid',
      outputPath: '$.Payload',
    });

    const jobFailed = new Fail(this, 'Job Failed', {
      cause: 'AWS Transcription Job Failed',
      error: 'Transcription returned FAILED',
    });

    const unknownState = new Fail(this, 'Job unknownState', {
      cause: 'AWS Transcription Job Failed',
      error: 'Transcription returned unknownState',
    });

    const jobComplete = (new Choice(this, 'Job Complete?')
      .when(Condition.stringEquals('$.status', 'FAILED'), jobFailed)
      .when(Condition.stringEquals('$.status', 'COMPLETED'), translatePollyJob)
      .when(Condition.stringEquals('$.status', 'IN_PROGRESS'), getTranscribeStatus)
      .otherwise(unknownState));

    // Write a step function that will loop until the status input is SUCCEEDED
    const TranscribeTranslatePollyDefinition = transcribeJob.next(getTranscribeStatus).next(jobComplete);

    // create step function to handle the workflow
    const primaryStepFunction = new StateMachine(this, 'StepFunction', {
      definition: TranscribeTranslatePollyDefinition,
      timeout: Duration.minutes(5),
    });

    const startSfnRole = new Role(this, 'startSfnRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        SfnStart: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['states:StartExecution'],
              effect: Effect.ALLOW,
              resources: [primaryStepFunction.stateMachineArn],
            }),
          ],
        }),
        CloudWatchPolicy: cloudwatchPolicy,
      },
    });

    const startTranslationSfnLambda = new NodejsFunction(this,
      'startTranslationSfnLambda', {
        handler: 'handler',
        entry: path.join(__dirname, 'lambda', 'startSfnLambda.ts'),
        role: startSfnRole,
        runtime: Runtime.NODEJS_18_X,
        architecture: Architecture.ARM_64,
        memorySize: 128,
        timeout: Duration.seconds(30),
        bundling: {
          minify: true,
          externalModules: ['aws-sdk'],
        },
        environment: {
          STATE_MACHINE_ARN: primaryStepFunction.stateMachineArn,
          REGION: props.env?.region || 'us-east-1',
        },
      });

    // create dynamodb table
    const translationRecordingTable = new Table(this, 'TranslationRecordingTable', {
      partitionKey: {
        name: 'jobId',
        type: AttributeType.STRING,
      },
    });


    const appSync2LiveTranslationApi = new GraphqlApi(
      this,
      'AppSyncLiveTranslationApi',
      {
        schema: Schema.fromAsset(path.join(__dirname, 'graphql/schema.graphql')),
        name: 'AppSync2StepFunction-API',
        authorizationConfig: {
          defaultAuthorization: {
            authorizationType: AuthorizationType.API_KEY,
            apiKeyConfig: {
              name: 'AppSyncAPIKey',
              description: 'API Key for AppSyncLiveTranslationApi',
              expires: Expiration.after(Duration.days(365)),
            },
          },
        },
        logConfig: {
          fieldLogLevel: FieldLogLevel.ALL,
        },
      },
    );


    const translationRecordingDataSource = appSync2LiveTranslationApi.addDynamoDbDataSource(
      'translationRecordingDataSource',
      translationRecordingTable,
    );

    const startTranslationSfnDataSource = appSync2LiveTranslationApi.addLambdaDataSource(
      'startTranslationSfnDataSource',
      startTranslationSfnLambda,
      {
        name: 'startTranslationSfnDataSource',
        description: 'startTranslationSfnDataSource desc',
      },
    );

    translationRecordingDataSource.createResolver({
      typeName: 'Query',
      fieldName: 'getTranslationRecordings',
      requestMappingTemplate: MappingTemplate.fromFile(
        path.join(__dirname, 'graphql/mappingTemplates/Query.getTranslationRecordings.req.vtl'),
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        path.join(__dirname, 'graphql/mappingTemplates/Query.getTranslationRecordings.req.vtl'),
      ),
    });

    translationRecordingDataSource.createResolver({
      typeName: 'Query',
      fieldName: 'listTranslationRecordings',
      requestMappingTemplate: MappingTemplate.fromFile(
        path.join(__dirname, 'graphql/mappingTemplates/Query.listTranslationRecordings.req.vtl'),
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        path.join(__dirname, 'graphql/mappingTemplates/Query.listTranslationRecordings.req.vtl'),
      ),
    });

    translationRecordingDataSource.createResolver({
      typeName: 'Mutation',
      fieldName: 'createTranslationRecordings',
      requestMappingTemplate: MappingTemplate.fromFile(
        path.join(__dirname, 'graphql/mappingTemplates/Mutation.createTranslationRecordings.req.vtl'),
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        path.join(__dirname, 'graphql/mappingTemplates/Mutation.default.response.vtl'),
      ),
    });

    translationRecordingDataSource.createResolver({
      typeName: 'Mutation',
      fieldName: 'updateTranslationRecordings',
      requestMappingTemplate: MappingTemplate.fromFile(
        path.join(__dirname, 'graphql/mappingTemplates/Mutation.updateTranslationRecordings.req.vtl'),
      ),
      // $util.toJson($context.result)
      responseMappingTemplate: MappingTemplate.fromFile(
        path.join(__dirname, 'graphql/mappingTemplates/Mutation.default.response.vtl'),
      ),
    });

    startTranslationSfnDataSource.createResolver(
      {
        typeName: 'Mutation',
        fieldName: 'startTranslationSfn',
      },
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
              resources: [transcribeLambda.functionArn],
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
    new CfnOutput(this, 'CfnDistribution', {
      description: 'Domain name for our cloud front distribution',
      value: `https://${cfDistribution.distributionDomainName}/voice-translator.html`,
    });

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
      value: transcribeLambda.functionArn,
    });
    new CfnOutput(this, 'startSfnLambda', {
      description: 'startSfnLambda Lambda',
      value: startTranslationSfnLambda.functionArn,
    });

    new CfnOutput(this, 'graphql endpoint', {
      description: 'graphql endpoint',
      value: process.env.API_GRAPHQLAPIENDPOINT || '',
    });

  }
}

// for development, use account/region from cdk cli
const REGION = 'ap-south-1';

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: REGION,
};

const app = new App();

new MyStack(app, 'translation-walkie-talkie-dev', { env: devEnv });
// new MyStack(app, 'translation-walkie-talkie-prod', { env: prodEnv });

app.synth();