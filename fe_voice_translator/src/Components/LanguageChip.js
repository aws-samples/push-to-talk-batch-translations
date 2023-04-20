import { CircleFlag } from "react-circle-flags";

const LanguageChip = ({language, mode}) => {
   return (
    <>
    {(mode === "selection") ?         
        <label className="d-block d-flex align-items-center justify-content-between">
            <CircleFlag countryCode={language.flag} height="40" />
            <strong className="flex-grow-1 text-center">{language.name}</strong>
        </label>
    : 
        <label>
            <CircleFlag countryCode={language.flag} height="20"/>
            <strong>{language.name}</strong> 
        </label>
    } 
    </>
   )
  
};

export default LanguageChip;