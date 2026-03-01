import { useState, useEffect } from 'react';
import "tailwindcss";
import SelectionBox from './components/SelectionBox';
import ParticlesBg from './components/ParticlesBg';
import LightGradient from './components/LightGrandient';
import FlyingPentagon from './components/FlyingPentagon';

const ADDRESS = import.meta.env.VITE_ADDRESS

export default function CheckinPage({setFinish, setStart}) {
  const [selectedProgram, setSelectedProgram] = useState();
  const [selectedHelps, setselectedHelps] = useState([])

  ///////////////////////question list/////////////////////////////
  const q1options = [
    { id: 1, title: 'Diploma'},
    { id: 2, title: 'Foundation Studies'},
    { id: 3, title: 'Academic English Program'},
    { id: 4, title: 'Pre-Masters'}
  ];

  const q2options = [
    { id: 1, title: 'Maths'},
    { id: 2, title: 'Physics'},
    { id: 3, title: 'Computing'},
    { id: 4, title: 'Engineering'},
    { id: 5, title: 'Commerce'},
    { id: 6, title: 'Chemistry'},
    { id: 7, title: 'Biology'},
    { id: 8, title: 'None specific'},
  ]
  ///////////////////////end of question list/////////////////////////////
  const handleSingleToggle = (id) => {
    setSelectedProgram(id); // Just save the string
    setFormError("");
  };

  const handleMultiToggle = (id) => {
    setselectedHelps(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };


  const [name, setName] = useState('');
  const [zid, setZid] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [nameError, setNameError] = useState("");
  const [zidError, setZidError] = useState("");
  const [formError, setFormError] = useState("");

  // Checks the name and updates the error state
  const validateName = (currentName) => {
    const cleanName = currentName.trim().split(/\s+/)[0];
    if (!cleanName) {
      setNameError("Please enter your name.");
      return false;
    }
    setNameError(""); // Clear the error if it's valid!
    return true;
  };

  // Checks the zID and updates the error state
  const validateZid = (currentZid) => {
    if (!/(^z\d{7}$)|(^\d{7})/i.test(currentZid.trim())) {
      setZidError("Format must be z1234567.");
      return false;
    }
    setZidError(""); // Clear the error if it's valid!
    return true;
  };

  useEffect(() => {
    const checkExistingSession = async () => {
        try {
            const response = await fetch(`${ADDRESS}:8000/whoami`, {
                method: "GET",
                credentials: "include", 
            });

            if (response.ok) {
                const data = await response.json();
                
                // auto-fill the states, to be remake
                if (data.recorded) {
                  setName(data.name);
                  setZid(data.zid);
                }
            }
        } catch (error) {
            console.error("Could not check session:", error);
        }
    };

    checkExistingSession();
  }, []); 

    
  // This function runs when the button is clicked
  const handleCheckIn = async (e) => {
    if (e) e.preventDefault();

    const isNameValid = validateName(name);
    const isZidValid = validateZid(zid);

    if (!selectedProgram) {
      return setFormError("Please select your program.");
    }

    if (!isNameValid || !isZidValid) {
      return
    }

    // formating the zid
    let formatttedZid = zid.trim().toLowerCase();
    if (!formatttedZid.startsWith('z')){
      formatttedZid = `z${formatttedZid}`;
    }


    try {
      const response = await fetch(`${ADDRESS}:8000/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name: name, 
          zid: formatttedZid,
          program: selectedProgram,
          helps: selectedHelps,
          time: new Date().toISOString()
        }),
        credentials: "include",
      });

      if (response.ok) {
        setIsFinished(true);
        // const data = await response.json();
      }
    } catch (error) {
      console.log(error);
    }
  };




  return (
    <div className='w-screen flex justify-center flex-col'>
      {isFinished && <FlyingPentagon setFinish={setFinish} setStart={setStart} />}
      <LightGradient />
      <div className='self-center max-w-200 w-screen'>
        <div className="absolute inset-0 -z-10">
          <ParticlesBg />
        </div>
        
        {/* <nav className="flex w-full bg-white/30 backdrop-blur-md border-b border-white/50 min-h-[12vh] backdrop-blur-md  top-0 z-50  flex-row-reverse relative overflow-hidden ">
          <ParticlesBg />

          <div className='flex flex-row-reverse items-center'>
            <div className="flex-shrink-0">
              <span className="inline-flex flex-row-reverse items-center min-w-[3.5rem] min-h-[3.5rem] bg-black font-bebas text-no tracking-widest text-white leading-[11px]">
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
          <div className='mb-[-20px]' >
            <div className="animate-fade-in [animation-fill-mode:both] [animation-delay:300ms]">
              <h3 className="p-1 pb-0 font-medium text-slate-700">Whats your name?</h3>
              <div className='p-1.5 pb-[0px]'>
                <input 
                  type="text" 
                  // placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={(e)=> validateName(e.target.value)}
                  maxLength={50}
                  className={`text-xl w-full bg-transparent border-b-2 border-gray-300 px-2 py-1 outline-none transition-colors 
                    ${
                      nameError
                      ? 'border-red-500 focus:border-red-600'
                      : 'border-gray-300 focus:border-black text-gray-900'
                    }
                  `}
                />
                <p className={`text-red-500 text-sm mt-0.5 ml-2 font-medium transition-opacity duration-150 ${nameError ? 'opacity-100' : 'opacity-0'}`}>
                    {nameError || '\u00A0'} 
                </p>
              </div>
            </div>

            <div className="animate-fade-in [animation-fill-mode:both] [animation-delay:500ms]">
              <h3 className="p-1 pt-[0px] mt-[-5px] font-medium text-slate-700">Whats your zid?</h3>
              <div className='p-1.5 pb-[0px]'>
                <input 
                  type="text" 
                  value={zid}
                  onChange={(e) => setZid(e.target.value)}
                  onBlur={(e) => validateZid(e.target.value)}
                  placeholder="zxxxxxxx"
                  className={`text-xl w-full bg-transparent border-b-2 border-gray-300 px-2 py-1 outline-none transition-colors
                    ${
                      zidError
                      ? 'border-red-500 focus:border-red-600'
                      : 'border-gray-300 focus:border-black text-gray-900'
                    }
                  `}
                />
                <p className={`text-red-500 text-sm mt-0.5 ml-2 font-medium transition-opacity duration-150 ${zidError ? 'opacity-100' : 'opacity-0'}`}>
                    {zidError || '\u00A0'}
                </p>
              </div>
            </div>
          </div>

          <div className="animate-fade-in [animation-fill-mode:both] [animation-delay:700ms]">
            <SelectionBox 
              question={"Program?"}
              options =  {q1options}
              selectedIds = {selectedProgram}
              handleToggle = {handleSingleToggle}
              isMulti = {false}
            />

            {formError && (
              <p className={`text-red-500 text-sm mt-0.5 ml-2 font-medium transition-opacity duration-150 opacity-100`}>
                  {formError}
              </p>
            )}
          </div>

          
          <div className="animate-fade-in [animation-fill-mode:both] [animation-delay:900ms]">
            <SelectionBox 
              question={"How can we help you today?"}
              options =  {q2options}
              selectedIds = {selectedHelps}
              handleToggle = {handleMultiToggle}
              isMulti = {true}
            />
          </div>
        </div>
        
        <div className='w-[100%] p-3 pb-5 animate-fade-in [animation-fill-mode:both] [animation-delay:1100ms]'>
          <button 
            onClick={handleCheckIn}
            className="w-[100%] px-8 py-2 rounded-md bg-teal-500/20 text-[#00ac9a] font-bold transition duration-200 hover:bg-teal-500 hover:text-white border-2 border-teal-500 hover:border-teal-500"
          >
            Check in
          </button>
        </div>

        <div className='self-center flex items-center justify-center pb-5 animate-fade-in [animation-fill-mode:both] [animation-delay:1300ms]'>
          <p className='text-sm'><mark className='opacity-30 bg-transparent'>Made with </mark>❤️</p>
        </div>

      </div>
    </div>
  );

}