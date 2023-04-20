import { Check } from 'react-bootstrap-icons';

const StatusBoard = ({step}) => {
    step = step - 1;
    const stepText = 
    [
    ["Record", "Recording...","Recorded"],
    ["Upload", "Uploading...","Uploaded"],
    ["Transcribe", "Transcribing...","Transcribed"],
    ["Translate", "Translating...","Translated"]
    ];
    
   return (
    <>
    <div id="steps" className={(step === 5) ? "complete" : ""}>
    {stepText.map((s, i) => {   
            return (
            <p className={(step === i) ? "active" : (step > i) ? "complete" : "idle"} key={"step_"+i}>
                <span>{s[0]}</span><span><strong>{s[1]}</strong></span><span><Check color="var(--bs-success)" size={22}></Check>{s[2]}</span>
            </p>) 
        })}
    </div>    
    </>
   )
  
};

export default StatusBoard;
