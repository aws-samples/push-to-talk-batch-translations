const Transcription = ({text, which}) => {    
   return (
    <>
    <div>
        {/* <button className="playback mx-auto d-block" onClick={playback}><VolumeUpFill fill="#ffffff" size="30"></VolumeUpFill></button>
         */}
        <div className={which +" transcription"}>{text}</div>
    </div>
    </>
   )
  
};

export default Transcription;
