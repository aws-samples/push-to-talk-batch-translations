import { useState, useEffect } from "react";
import { MicFill, SquareFill } from 'react-bootstrap-icons';
import Timer from './Timer';

const RecordButton = ({step, start, stop}) => {
    const seconds = 30;
    const [time, setTime] = useState(seconds+1);
    const [timerOn, setTimerOn] = useState(true);
  
    const handleStart = () => {
        setTime((prevTime) => prevTime - 1);
        setTimerOn(true);
        start();
    };
    
    const handleStop = () => {
        setTime(seconds+1);
        setTimerOn(false);
        stop();
    };
    
    
    useEffect(()=>{
                
    });

    var html;

    if (step === 0){ //ready to record
        html = <button className="circle mx-auto record" onClick={handleStart}><MicFill color="#ffffff" size={40} /></button>
    }
    else if (step === 1){ //recording
        html = <button className="circle mx-auto recording" onClick={handleStop}><Timer
        time={time}
        timerOn={timerOn}
        handleStart={handleStart}
        handleStop={handleStop}
      />
      <SquareFill color="#ffffff" size={36} />
      </button>
    }
    else if (step >= 2 && step !== 6){ // disabled: uploading, transcribing, translating, playing
        html = <button className="circle mx-auto" disabled><MicFill color="gray" size={40} /></button>
    }else if ( step === 6 ){ //enabled with audio already loaded
        html = <button className="circle mx-auto record short" onClick={handleStart}><MicFill color="#ffffff" size={40} /></button>
    }

    
return <>{html}</>
    
}




export default RecordButton;