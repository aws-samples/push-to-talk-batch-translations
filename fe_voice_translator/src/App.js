import React, {useEffect, useState} from "react";
import {Amplify, API, graphqlOperation, Storage} from "aws-amplify";
import {
    AmplifyProvider,
    Authenticator,
} from "@aws-amplify/ui-react";
import {useReactMediaRecorder} from "react-media-recorder";
import {v4 as uuid} from 'uuid';

import aws_exports from "./aws-exports";

import "@aws-amplify/ui-react/styles.css";
import {createTranslationRecordings, startTranslationSfn} from "./graphql/mutations";
import {onUpdateTranslationRecordings} from "./graphql/subscriptions";
import "./App.css";
import Button from "@cloudscape-design/components/button"
import {Arrow90degLeft} from 'react-bootstrap-icons';
import RecordButton from './Components/RecordButton';
import PlayButton from './Components/PlayButton';
import LanguageChip from './Components/LanguageChip';
import Transcription from './Components/Transcription';
import StatusBoard from './Components/StatusBoard';

Amplify.configure(aws_exports);

const bucket = aws_exports.aws_user_files_s3_bucket || 'amplify-audiotoawss3-dev-133151-deployment';

const App = ({showIntro}) => {
    const [targetBlobUrl, setTargetBlobUrl] = useState('');
    const [sourceBlobUrl, setSourceBlobUrl] = useState('');
    const [sourceLanguage, setSourceLanguage] = useState();
    const [targetLanguage, setTargetLanguage] = useState();
    const [transcription, updateTranscription] = useState('');
    const [translation, updateTranslation] = useState('');
    const [step, setStep] = useState(0);
    const [visualStep, setVisualStep] = useState(0);
    const [pollyLocationUrl, setPollyLocationUrl] = useState('');

    useEffect(() => {

        const sub = API.graphql(
            graphqlOperation(onUpdateTranslationRecordings),
        );

        sub.subscribe({
            next: (params) => {
                // console.log(params.value.data, "onupdate")
                if (params.value.data.onUpdateTranslationRecordings.transcription) {
                    const {
                        transcription,
                        translatedText,
                        pollyLocation
                    } = params.value.data.onUpdateTranslationRecordings;
                    if (transcription) {
                        updateTranscription(transcription);
                        setStep(3);
                    }
                    if (translatedText) {
                        updateTranslation(translatedText);
                        setStep(4);
                    }

                    if (pollyLocation && !targetBlobUrl) {
                        if(pollyLocationUrl !== pollyLocation) {
                            setPollyLocationUrl(pollyLocation);
                            getPollyFile(pollyLocation).then(() => {
                                setStep(5);
                                setVisualStep(5);
                            });
                        }
                    }
                }
            },
            error: (error) => console.warn(error)
        });
    }, []);

    useEffect(() => {
        if (targetBlobUrl) {
            console.log('Playing, targetBlobUrl set: ' + targetBlobUrl);
            playback('target');
        } else {
            console.log('targetBlobUrl updated, and now empty.');
        }
    }, [targetBlobUrl]);

    useEffect(() => {
        if (sourceLanguage && targetLanguage) {
            document.querySelector('#header_step').focus();
        } else {
            if (sourceLanguage) {
                document.querySelector('#header_output').focus();
            } else {
                document.querySelector('#header_input').focus();
            }
        }
    }, [sourceLanguage, targetLanguage]);


    async function getPollyFile(pollyLocation) {
        try {
            const file = await Storage.get(pollyLocation, {download: true});
            const blob = file.Body;
            if (!targetBlobUrl) {
                console.log('targetBlobUrl is blank. Getting file: ' + pollyLocation);
                setTargetBlobUrl(URL.createObjectURL(blob));
            }
        } catch (err) {
            console.log('error: ', err)
        }
    }

    function playback(which) {
        let audio = document.getElementById('audio_' + which);
        setStep(5);
        setVisualStep(5);
        console.log('PLAYBACK: ' + targetBlobUrl);
        if (targetBlobUrl && audio) {
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
                await API.graphql(
                    graphqlOperation(
                        createTranslationRecordings,
                        {input: recordingInput},
                        aws_exports.aws_appsync_apiKey
                    )
                )
                console.log('Uploading...');
                await API.graphql(
                    graphqlOperation(
                        startTranslationSfn,
                        {input: recordingInput},
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
            const file = new File([blob], uuid(), {type: "audio/wav"})
            pushRecordingToCloud(file);
        }
    };

    const {status, startRecording, stopRecording} = useReactMediaRecorder(
        constraints
    );

    const handleLanguageClick = (which, language) => {
        if (which === 'source') {
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


    async function startStatusAnimation() {
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


    const inputLanguages = [
        {flag: "ae", code: "ar", name: "Arabic (MSA)"},
        {flag: "af", code: "af", name: "Afrikaans"},
        {flag: "cn", code: "zh", name: "Mandarin"},
        {flag: "us", code: "en", name: "English, US"},
        {flag: "jp", code: "ja", name: "Japanese"},
        {flag: "fr", code: "fr", name: "French"},
        {flag: "il", code: "he", name: "Hebrew"},
        {flag: "ru", code: "ru", name: "Russian"},
        {flag: "es", code: "es", name: "Spanish"},
        {flag: "tr", code: "tr", name: "Turkish"},
    ];
    const outputLanguages = [
        {flag: "ae", code: "ar", name: "Arabic (MSA)"},
        {flag: "af", code: "af", name: "Afrikaans"},
        {flag: "cn", code: "zh", name: "Mandarin"},
        {flag: "us", code: "en", name: "English, US"},
        {flag: "jp", code: "ja", name: "Japanese"},
        {flag: "fr", code: "fr", name: "French"},
        {flag: "ru", code: "ru", name: "Russian"},
        {flag: "es", code: "es", name: "Spanish"},
        {flag: "tr", code: "tr", name: "Turkish"},
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

                {(sourceLanguage && targetLanguage) && (
                    <Button variant="link" onClick={() => clearLanguages()}>
                        <Arrow90degLeft size={18}></Arrow90degLeft> Change Language</Button>
                )
                }
                {(!sourceLanguage) &&
                    <Button variant="link" onClick={showIntro}><Arrow90degLeft size={18}></Arrow90degLeft> Back</Button>
                }
                {(sourceLanguage && !targetLanguage) &&
                    <Button variant="link" onClick={() => setSourceLanguage()}><Arrow90degLeft
                        size={18}></Arrow90degLeft> Back</Button>
                }
                <AmplifyProvider>
                    <Authenticator>
                        {({signOut, user}) => (
                            <>

                                <div className="container-fluid">
                                    <div className="row d-flex align-items-center" style={{'height': '90vh'}}>

                                        {(!targetLanguage && !sourceLanguage) &&
                                            <section className="language_selection">
                                                <h1 id="header_input" className="mb-5" tabIndex="-1">Select the input
                                                    language</h1>
                                                <div className="row">
                                                    {inputLanguages.map((lang) => (
                                                        <div className="col-md-4" key={lang.code}>
                                                            <button type="submit"
                                                                    className={"language mx-auto " + (sourceLanguage?.code === lang.code && "active")}
                                                                    onClick={() => handleLanguageClick('source', lang)}>
                                                                <LanguageChip language={lang} mode="selection"/>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        }


                                        {(sourceLanguage && !targetLanguage) &&
                                            <section className="language_selection">
                                                <h1 id="header_output" className="mb-5" tabIndex="-1">Select the
                                                    translation language</h1>
                                                <div className="row">
                                                    {outputLanguages.map((lang) => (
                                                        (sourceLanguage?.code !== lang.code) &&
                                                        <div className="col-md-4" key={lang.code}>
                                                            <button type="submit" className="language mx-auto"
                                                                    onClick={() => handleLanguageClick('target', lang)}>
                                                                <LanguageChip language={lang} mode="selection"/>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        }


                                        {(sourceLanguage && targetLanguage) &&
                                            <section className="translation">

                                                <div className="row flex-row">


                                                    <div
                                                        className="col-md-4 col-lg-6 align-items-center d-flex px-2 order-2">

                                                        <StatusBoard step={visualStep}></StatusBoard>
                                                    </div>


                                                    <div className="col-md-4 col-lg-3 order-1">
                                                        <div className="translator mx-auto text-center">
                                                            <LanguageChip language={sourceLanguage} mode="recording"/>
                                                            <RecordButton step={step} stop={() => clickStop()}
                                                                          start={() => {
                                                                              clickStart(targetLanguage)
                                                                          }}/>
                                                        </div>

                                                        {(step >= 3) &&
                                                            <div>
                                                                <audio id="audio_source" src={sourceBlobUrl} controls/>
                                                            </div>
                                                        }

                                                        {(step >= 4) &&
                                                            <Transcription text={transcription} which="source"/>
                                                        }

                                                    </div>


                                                    <div className="col-md-4 col-lg-3 order-3">
                                                        <div className="translator recorder mx-auto text-center">
                                                            <LanguageChip language={targetLanguage} mode="recording"/>
                                                            <PlayButton step={step}
                                                                        playback={() => playback('target')}/>
                                                        </div>

                                                        {(step >= 4) &&
                                                            <>
                                                                <Transcription text={translation} which="target"/>
                                                                <audio id="audio_target" src={targetBlobUrl}
                                                                       onEnded={() => endPlayback()} controls/>
                                                            </>
                                                        }

                                                    </div>
                                                </div>
                                            </section>
                                        }
                                    </div>
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