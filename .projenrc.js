const { awscdk } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  name: 'translation-walkie-talkie',

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
  gitignore: [
    'fe_voice_translator/node_modules',
    'fe_voice_translator/build',
    'fe_voice_translator/.pnp',
    'fe_voice_translator/.pnp.js',
    'fe_voice_translator/coverage',
    'fe_voice_translator/.DS_Store',
    'fe_voice_translator/.env.local',
    'fe_voice_translator/.env.development.local',
    'fe_voice_translator/.env.test.local',
    'fe_voice_translator/.env.production.local',
    'fe_voice_translator/npm-debug.log*',
    'fe_voice_translator/yarn-debug.log*',
    'fe_voice_translator/yarn-error.log*',
    'fe_voice_translator/amplify/\#current-cloud-backend',
    'fe_voice_translator/amplify/.config/local-*',
    'fe_voice_translator/amplify/logs',
    'fe_voice_translator/amplify/mock-data',
    'fe_voice_translator/amplify/mock-api-resources',
    'fe_voice_translator/amplify/backend/amplify-meta.json',
    'fe_voice_translator/amplify/backend/.temp',
    'fe_voice_translator/build/',
    'fe_voice_translator/dist/',
    'fe_voice_translator/node_modules/',
    'fe_voice_translator/aws-exports.js',
    'fe_voice_translator/awsconfiguration.json',
    'fe_voice_translator/amplifyconfiguration.json',
    'fe_voice_translator/amplifyconfiguration.dart',
    'fe_voice_translator/amplify-build-config.json',
    'fe_voice_translator/amplify-gradle-config.json',
    'fe_voice_translator/amplifytools.xcconfig',
    'fe_voice_translator/.secret-*',
    'fe_voice_translator/**.sample',
    'fe_voice_translator/src/aws-exports.js',
    'fe_voice_translator/src/awsconfiguration.json',
    '.idea',
  ],
});
project.synth();