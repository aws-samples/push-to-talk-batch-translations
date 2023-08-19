import React from 'react';
import ReactDOM from 'react-dom/client';
import Intro from './Intro';
import reportWebVitals from './reportWebVitals';
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AmplifyProvider, Authenticator } from "@aws-amplify/ui-react";
import Button from "@cloudscape-design/components/button"
import { BoxArrowRight } from 'react-bootstrap-icons';
Amplify.configure(awsExports);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <>        
    <AmplifyProvider>
    <Authenticator>    
    {({ signOut, user }) => (        
        <Intro signOut={signOut}/>
    )}
    </Authenticator>
    </AmplifyProvider>
    </>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
