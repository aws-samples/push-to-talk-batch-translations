import { MicFill, SquareFill } from 'react-bootstrap-icons';

const StatusBoard = ({step}) => {
    step = step - 1;
    
    
   return (
    <>  
    <div id="steps" className="mx-auto">
    
    
    <div className="architecture_icons container-fluid px-0 mt-4">
        <div className={"d-flex flex-row justify-content-around step_"+step}>
            {(step === 1 || step === 2 || step === 3) && 
            <>
            <img src="amazon_transcribe.png" alt="Amazon Transcribe Icon" />
            <img src="amazon_translate.png" alt="Amazon Translate Icon"  />
            <img src="amazon_polly.png" alt="Amazon Polly Icon"  />
            </>
            }
        </div>
    </div>

    <div className="mt-5 text-center mx-auto row" aria-live="polite">
    <h2 id="header_step" tabIndex="-1">
    {(step === -1) &&
        <p>Record your voice by clicking the <MicFill color="#000000" size={25} />record button.</p>
    }
    {(step === 0) &&
        <p>Speak out loud, then click <SquareFill color="#000000" size={18} /> stop when done.</p>
    }    
    {(step === 1) &&
        <p>Transcribing your voice into text with <strong>Amazon Transcribe</strong>.</p>
    }
    {(step === 2) &&
        <p>Translating the text with <strong>Amazon Translate</strong>.</p>
    }
    {(step === 3) &&
        <p>Generating an audio clip using <strong>Amazon Polly</strong>.</p>
    }    
    {(step === 4) &&
        <p>Playing the generated audio.</p>
    }
    {(step === 5) &&
        <p>Done.</p>
    }</h2>
    </div>

            
    <div className="mt-2 text-center mx-auto row" aria-live="polite">
    
        {(step === 1) &&
            <small>Transcribe can automatically transcribe audio and video into text, making it easy to create transcripts of your voice.</small>
        }
        {(step === 2) &&
            <small>Translate can translate text from one language to another, making it possible to communicate with people from all over the world.</small>
        }
        {(step === 3) &&
            <small>Polly can generate human-like speech from text, making it possible to create audiobooks, podcasts, and other audio content.</small>
        }
    </div>
    
    </div>
    </>
   )
  
};

export default StatusBoard;
