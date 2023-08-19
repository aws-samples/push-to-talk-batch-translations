import React, { useEffect, useState } from "react";
import App from './App';
import Button from "@cloudscape-design/components/button"
import { BoxArrowRight } from 'react-bootstrap-icons';

const Intro = ({signOut}) => {
    const [showApp, setShowApp] = useState(false);
    const [appIsActive, setAppIsActive] = useState(true);

useEffect(() => {
    let timeoutSeconds = 120;
    let timeoutId;
    function resetTimer() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setAppIsActive(false), timeoutSeconds*1000); 
    }

    function handleActivity() {
      setAppIsActive(true);
      resetTimer();
    }

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, []);

  
  useEffect(() => {
    if (!appIsActive) {
      setShowApp(false);
      setAppIsActive(true);
    }
  }, [appIsActive]);

   
    return (        
    <div className="container-fluid">
    {(!showApp) ? (
        <>            
            
        <div className="row align-items-center" style={{"height":"90vh"}}>
        <div id="intro" className="col col-md-8">
            <img className="aws_logo" src="aws_logo.svg" alt="AWS"/>
            <h1 className="text-start">Translation Demo</h1>                    
            <h2 className="text-start">See how Amazon Transcribe, Amazon Translate, and Amazon Polly work together to form a simple translation app.</h2>
            <p><Button variant="primary" onClick={()=>setShowApp(true)}>Start Demo</Button>
            </p>
            <Button ariaExpanded ariaLabel="Sign Out" variant="link" id="signOut" onClick={signOut}><BoxArrowRight size={18}></BoxArrowRight></Button>        
        </div>        
        </div>
        </>
    ) : (
        <>
        <App showIntro={()=>setShowApp(false)} />
        </>
    )}        
    </div>

    )
};

export default Intro;