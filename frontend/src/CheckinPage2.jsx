import { useState, useEffect } from 'react';
import "tailwindcss";
import SelectionBox from './components/SelectionBox';
import ParticlesBg from './components/ParticlesBg';
import LightGradient from './components/LightGrandient';
import FlyingPentagon from './components/FlyingPentagon';
import Popup from './components/Popup';

const ADDRESS = import.meta.env.VITE_ADDRESS


export default function CheckinPage2({setFinish, setStart}) {
  const [selectedHelps, setselectedHelps] = useState([])
  const [helpsError, setHelpsError] = useState("");

  ///////////////////////question list/////////////////////////////

  const q2options = [
    { id: 1, title: 'Maths'},
    { id: 2, title: 'Physics'},
    { id: 3, title: 'Computing'},
    { id: 4, title: 'Engineering'},
    { id: 5, title: 'Commerce'},
    { id: 6, title: 'Chemistry'},
    { id: 7, title: 'Biology'},
    { id: 8, title: 'Academic English'},
  ]
  ///////////////////////end of question list/////////////////////////////

  const handleMultiToggle = (id) => {
    setHelpsError("");
    setselectedHelps(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };


  const [name, setName] = useState('');
  const [zid, setZid] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkExistingSession = async () => {
        try {
            const response = await fetch(`${ADDRESS}/whoami`, {
                method: "GET",
                credentials: "include", 
            });

            if (response.ok) {
                const data = await response.json();
                
                // auto-fill the states, to be remake
                if (data.recorded) {
                  setName(data.name);
                  setZid(data.zid);
                  console.log(`Welcome back, ${data.name}!`);
                }
            }
        } catch (error) {
            console.error("Could not check session:", error);
        }
    };

    checkExistingSession();
  }, []); 

    
  // This function runs when the button is clicked
  const handleCheckIn = async () => {
      if (selectedHelps.length === 0) {
      return setHelpsError("Please select at least one we can help with.");
    }

    try {
      const response = await fetch(`${ADDRESS}/existcheckin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          zid: zid,
          helps: selectedHelps,
          time: new Date().toISOString()
        }),
        credentials: "include",
      });

      if (response.ok) {
        setIsFinished(true);
        // const data = await response.json();
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "An unexpected error occurred.");
      }
    } catch (error) {
      console.log(error);
      setErrorMessage("Network error. Please check your internet connection.");
    }
  };




  return (
    <div className='w-screen flex justify-center flex-col'>
      {isFinished && <FlyingPentagon setFinish={setFinish} setStart={setStart} />}
      <LightGradient />
      {errorMessage && (
        <Popup errorMessage={errorMessage} setErrorMessage={setErrorMessage}/>
      )}
      <div className='self-center max-w-200 w-screen'>
        <div className="absolute inset-0 -z-10">
          <ParticlesBg />
        </div>
        {/* 
        <nav className="flex w-full bg-white/30 backdrop-blur-md border-b border-white/50 min-h-[12vh] backdrop-blur-md  top-0 z-50  flex-row-reverse relative overflow-hidden ">
          <ParticlesBg />

          <div className='flex flex-row-reverse items-center'>
            <div className="flex-shrink-0">
              <span className="inline-flex flex-row-reverse items-center min-w-[3.5rem] min-h-[3.5rem] bg-black font-bebas text-sm tracking-widest text-white text-sm leading-3">
                STUDY<br/>CLUB
              </span>
            </div>

          </div>
        </nav> */}


        <div className="flex flex-col gap-1 p-3">
          <div className='min-h-[12vh]'></div>
          <div className='flex self-center animate-fade-in [animation-fill-mode:both] [animation-delay:100ms]'>
            <h2 className="font-['Bebas_Neue'] text-center text-4xl font-medium">Welcome to Study Club!</h2>
          </div>
          <div className='min-h-[7vh]'></div>
          <div className='animate-fade-in [animation-fill-mode:both] [animation-delay:400ms] font-["Zain"]'>
            <SelectionBox 
                question={<>Hi, {name.trim().split(/\s+/)[0]}<br/>How can we help you today?</>}
                options =  {q2options}
                selectedIds = {selectedHelps}
                handleToggle = {handleMultiToggle}
                isMulti = {true}
            />

            {helpsError && (
              <p className={`text-red-500 text-sm mt-0.5 ml-2 font-medium transition-opacity duration-150 opacity-100`}>
                  {helpsError}
              </p>
            )}
            
          </div>
        </div>
        
        <div className='w-[100%] p-3 pb-5 animate-fade-in [animation-fill-mode:both] [animation-delay:700ms] font-["Zain"]'>
          <button 
            onClick={handleCheckIn}
            className="w-[100%] px-8 py-1.5 font-xl rounded-md bg-teal-500/20 text-[#00ac9a] font-bold transition duration-200 hover:bg-teal-500 hover:text-white border-2 border-teal-500 hover:border-teal-500"
          >
            Check in
          </button>
        </div>

        <div className='self-center flex items-center justify-center pb-5 animate-fade-in [animation-fill-mode:both] [animation-delay:1000ms] font-["Zain"]'>
          <p className='text-sm'><mark className='opacity-30 bg-transparent'>Made with </mark>❤️</p>
        </div>

      </div>
    </div>
  );

}