import React, { useEffect, useState } from "react";
import { Amplify, API, graphqlOperation, Storage } from "aws-amplify";
import {
  AmplifyProvider,
  Authenticator,
} from "@aws-amplify/ui-react";
import { useReactMediaRecorder } from "react-media-recorder";
import { v4 as uuid } from 'uuid';

import aws_exports from "./aws-exports";

import "@aws-amplify/ui-react/styles.css";
import { createTranslationRecordings, startTranslationSfn } from "./graphql/mutations";
import { onUpdateTranslationRecordings } from "./graphql/subscriptions";
import "./App.css";
import Button from "@cloudscape-design/components/button"
import { Arrow90degLeft, BoxArrowRight } from 'react-bootstrap-icons';
import RecordButton from './Components/RecordButton';
import PlayButton from './Components/PlayButton';
import LanguageChip from './Components/LanguageChip';
import Transcription from './Components/Transcription';
import StatusBoard from './Components/StatusBoard';

Amplify.configure(aws_exports);

const bucket = aws_exports.aws_user_files_s3_bucket || 'amplify-audiotoawss3-dev-133151-deployment';


const App = () => {
  const [targetBlobUrl, setTargetBlobUrl] = useState('');
  const [sourceBlobUrl, setSourceBlobUrl] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState();
  const [targetLanguage, setTargetLanguage] = useState();
  const [transcription, updateTranscription] = useState('');
  const [translation, updateTranslation] = useState('');
  const [step, setStep] = useState(0);
  const [visualStep, setVisualStep] = useState(0);

  useEffect(() => {
    async function handleSubscription() {
      const sub = API.graphql(
          graphqlOperation(onUpdateTranslationRecordings)
      );
      await sub.subscribe({
        next: (params) => {
          if (params.value.data.onUpdateTranslationRecordings.transcription) {
            const { transcription, translatedText, pollyLocation } = params.value.data.onUpdateTranslationRecordings;
            if (transcription) {
              updateTranscription(transcription);
              setStep(3);
            }

            if (translatedText) {
              updateTranslation(translatedText);
              setStep(4);
            }

            if (pollyLocation && !targetBlobUrl) {
              getPollyFile(pollyLocation);
              setStep(5);
              setVisualStep(5);
            }

          }
        },
        error: (error) => console.warn(error)
      });
    }
    handleSubscription();

  }, []);

  useEffect(() => {
    if(targetBlobUrl){
      console.log('Playing, targetBlobUrl set: '+ targetBlobUrl);
      playback('target');
    }else{
      console.log('targetBlobUrl updated, and now empty.');
    }
  }, [targetBlobUrl]);

  async function getPollyFile(pollyLocation) {
    const file = await Storage.get(pollyLocation, { download: true });
    const blob = file.Body;
    if(!targetBlobUrl){
      console.log('targetBlobUrl is blank. Getting file: '+pollyLocation);
      setTargetBlobUrl(URL.createObjectURL(blob));
    }
  }

  function playback(which) {
    let audio = document.getElementById('audio_' + which);
    setStep(5);
    setVisualStep(5);
    console.log('PLAYBACK: '+targetBlobUrl);
    if(targetBlobUrl){
      audio.currentTime = 0;
      audio.play();
    }
  }

  function endPlayback() {
    setStep(6);
    setVisualStep(6);
  }

  async function pushRecordingToCloud(fileBlob) {
    if (fileBlob) {
      console.log('Making blob');
      setSourceBlobUrl(URL.createObjectURL(fileBlob));

      const key = `${uuid()}.wav`;
      const recordingInput = {
        jobId: key,
        bucket: bucket,
        key: `raw_input/${key}`,
        sourceLanguage: sourceLanguage.code,
        targetLanguage: targetLanguage.code,
      }
      try {
        await Storage.put(
          key,
          fileBlob,
          {
            contentType: 'audio/webm',
            customPrefix: {
              public: 'raw_input/',
            }
          })

        const graphqlCall = await API.graphql(
          graphqlOperation(
            createTranslationRecordings,
            { input: recordingInput },
            aws_exports.aws_appsync_apiKey
          )
        )
        console.log('Uploading...');

        const startStepFunction = await API.graphql(
          graphqlOperation(
            startTranslationSfn,
            { input: recordingInput },
            aws_exports.aws_appsync_apiKey
          )
        );
        console.log('Requesting translation...');
      } catch (err) {
        console.log('error: ', err)
      }
    }

  }

  const constraints = {
    audio: true,
    video: false,
    onStop: (blobUrl, blob) => {
      const file = new File([blob], uuid(), { type: "audio/wav" })
      pushRecordingToCloud(file);
    }
  };

  const { status, startRecording, stopRecording } = useReactMediaRecorder(
    constraints
  );

  const handleLanguageClick = (which, language) => {
    if(which === 'source'){
      setSourceLanguage(language);
    } else {
      setTargetLanguage(language);
      setStep(0);
      setVisualStep(0);
    }
  }

  const clickStart = (clickedLanguage) => {
    if (status === 'idle' || status === 'stopped') {
      startRecording();
      setStep(1);
      setVisualStep(1);
    }
  }
  const clickStop = () => {
    setStep(2);
    startStatusAnimation();
    stopRecording();
  }


  async function startStatusAnimation(){
    await delay(500);
    setVisualStep(2);
    await delay(5000);
    setVisualStep(3);
    await delay(5000);
    setVisualStep(4);
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const clearLanguages = () => {
    setSourceLanguage();
    setTargetLanguage();
  }


  const languages = [
        { flag: "ae", code : "ar", name : "Arabic, Modern Standard"},
        { flag: "za", code : "af", name : "Afrikaans"},
        { flag: "cn", code : "zh", name : "Chinese (Mandarin)"},
        { flag: "us", code : "en", name : "English, US"},
        { flag: "jp", code : "ja", name : "Japanese"},
        { flag: "fr", code : "fr", name : "French"},
        { flag: "il", code : "he", name : "Hebrew"},
        { flag: "ru", code : "ru", name : "Russian"},
        { flag: "es", code : "es", name : "Spanish"},
        { flag: "tr", code : "tr", name : "Turkish"}
  ];

  return (
    <>
    <div id="simulator">
      <Button variant="link" onClick={() => setVisualStep(0)}>0</Button>
      <Button variant="link" onClick={() => setVisualStep(1)}>1</Button>
      <Button variant="link" onClick={() => setVisualStep(2)}>2</Button>
      <Button variant="link" onClick={() => setVisualStep(3)}>3</Button>
      <Button variant="link" onClick={() => setVisualStep(4)}>4</Button>
      <Button variant="link" onClick={() => setVisualStep(5)}>5</Button>
      <Button variant="link" onClick={() => setVisualStep(6)}>6</Button>
      </div>

      <div className="container-fluid">

        <AmplifyProvider>
          <Authenticator>
            {({ signOut, user }) => (
              <>

                {user && (
                  <>
                    <div className="container-fluid px-0">
                      <div className="d-flex justify-content-between pt-3">
                        <div>
                          {(sourceLanguage && targetLanguage) &&
                            <Button variant="link" onClick={() => clearLanguages()}>
                              <Arrow90degLeft size={18}></Arrow90degLeft> Change Language</Button>
                          }
                        </div>
                        <div>
                          <Button variant="link" onClick={signOut}>Sign Out <BoxArrowRight size={18}></BoxArrowRight></Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}


                <h1>Voice Translator</h1>

                <div className="container px-4">
                  {(!targetLanguage) &&
                    <section className="language_selection mt-5 mb-5">
                      <h2>Select the input language</h2>
                      <div className="row">
                        {languages.map((lang) => (
                          <div className="col-md-4" key={lang.code}>
                            <div className={"language mx-auto " + (sourceLanguage?.code === lang.code && "active")} onClick={() => handleLanguageClick('source',lang)} >
                              <LanguageChip language={lang} mode="selection" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  }


                  {(sourceLanguage && !targetLanguage) &&
                    <section className="language_selection">
                      <h2>Select the translation language</h2>
                      <div className="row">
                        {languages.map((lang) => (
                          <div className="col-md-4" key={lang.code}>
                            <div className={"language mx-auto " + (sourceLanguage?.code === lang.code && "disabled")} onClick={() => handleLanguageClick('target',lang)}>
                              <LanguageChip language={lang} mode="selection" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  }


                  {(sourceLanguage && targetLanguage) &&
                    <section className="translation">
                      <div className="row flex-row">
                        <div className="col-mdx mb-4">
                          <div className="translator mx-auto text-center">
                            <LanguageChip language={sourceLanguage} mode="recording" />
                            <RecordButton step={step} stop={() => clickStop()} start={() => { clickStart(targetLanguage) }} />
                          </div>

                          {(step >= 3) &&
                            <div>
                              <audio id="audio_source" src={sourceBlobUrl} controls />
                            </div>
                          }
                        </div>
                        {(step <= 3) &&
                        <StatusBoard step={visualStep}></StatusBoard>
                        }
                        {(step >= 4) &&
                            <div>
                              <Transcription text={transcription} which="source" />
                              <hr/>
                              <Transcription text={translation} which="target" />
                              <audio id="audio_target" src={targetBlobUrl} onEnded={() => endPlayback()} controls />
                            </div>
                          }

                        <div className="col-mdx">
                          <div className="translator recorder mx-auto text-center">
                            <LanguageChip language={targetLanguage} mode="recording" />
                            <PlayButton step={step} playback={() => playback('target')} />
                          </div>

                        </div>
                      </div>
                    </section>
                  }
                </div>

              </>

            )}
          </Authenticator>
        </AmplifyProvider>
      </div>

    </>
  )
};

export default App;