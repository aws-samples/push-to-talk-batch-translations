import { VolumeUpFill } from 'react-bootstrap-icons';

const PlayButton = ({step, playback}) => {
    let html;
    if (step <= 4){ //not playing
        html = <button className="circle mx-auto" disabled><VolumeUpFill color="var(--gray)" size={46} /></button>
    }else if(step === 5){ //currently playing
        html = <button aria-label="Restart Playback" className="circle mx-auto playing" onClick={playback}><VolumeUpFill color="#ffffff" size={46} /></button>
    }else{ //ready to play
        html = <button aria-label="Play Translation" className="circle mx-auto play" onClick={playback}><VolumeUpFill color="#ffffff" size={46} /></button>
    }
    return <>{html}</>
};

export default PlayButton;