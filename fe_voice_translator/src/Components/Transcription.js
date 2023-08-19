const Transcription = ({text, which}) => {
   return (
    <>
        <div>
            <div className={which +" transcription"}>{text}</div>
        </div>
    </>
   )

};

export default Transcription;
