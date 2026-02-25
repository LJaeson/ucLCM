import { useState } from 'react';
import "tailwindcss";
import SelectionBox from './components/SelectionBox';
import ParticlesBg from './components/ParticlesBg';
import LightGradient from './components/LightGrandient';


// const 

export default function CheckInForm() {
  const [selectedProgram, setSelectedProgram] = useState();
  const [selectedHelps, setselectedHelps] = useState([])

  ///////////////////////question list/////////////////////////////
  const q1options = [
    { id: 1, title: 'Diploma'},
    { id: 2, title: 'Foundation Studies'},
    { id: 3, title: 'Academic English Progrma'},
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
  };

  const handleMultiToggle = (id) => {
    setselectedHelps(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };


  const [name, setName] = useState('');
  const [zid, setZid] = useState('');
  // const [program, setProgram] = useState('');


  const [status, setStatus] = useState('');

  // This function runs when the button is clicked
  const handleCheckIn = async () => {
    try {
      // 1. Send the POST request to Python
      const response = await fetch("http://localhost:8000/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // 2. Package the data as a JSON string
        body: JSON.stringify({ 
          student_name: name, 
          student_zid: zid 
        }),
      });

      // 3. Wait for Python to reply
      if (response.ok) {
        const data = await response.json();
        setStatus(data.message); // e.g., "Check-in recorded!"
      }
    } catch (error) {
      setStatus("Failed to connect to the server.");
      print(error);
    }
  };

  return (
    <div className='w-screen flex justify-center flex-col'>
      <LightGradient />
      <div className='self-center max-w-200 w-screen'>
        <ParticlesBg/>
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
          <div className='flex self-center'>
            <h2 className="font-['Bebas_Neue'] text-center text-4xl font-medium">Welcome to Study Club!</h2>
          </div>
          <div className='min-h-[7vh]'></div>
          <div >
            <h3 className="p-1 pb-0 font-medium text-slate-700">Whats your name?</h3>
            <div className='p-1.5'>
              <input 
                type="text" 
                // placeholder="Enter your name"
                className="text-xl w-full bg-transparent border-b-2 border-gray-300 px-2 py-1 outline-none focus:border-black transition-colors"
              />
            </div>
            <h3 className="p-1 font-medium text-slate-700">Whats your zid?</h3>
            <div className='p-1.5'>
              <input 
                type="text" 
                placeholder="zxxxxxxx"
                className="text-xl w-full bg-transparent border-b-2 border-gray-300 px-2 py-1 outline-none focus:border-black transition-colors"
              />
            </div>
          </div>
          <SelectionBox 
            question={"Program?"}
            options =  {q1options}
            selectedIds = {selectedProgram}
            handleToggle = {handleSingleToggle}
            isMulti = {false}
          />
          <SelectionBox 
            question={"How can we help you today?"}
            options =  {q2options}
            selectedIds = {selectedHelps}
            handleToggle = {handleMultiToggle}
            isMulti = {true}
          />
        </div>



      </div>
      
    
    </div>
  );
}




// import { useState } from 'react';
// Add the specific filename at the end

// export default function QuizPage() {
//   const [selectedIds, setSelectedIds] = useState([]);

//   const services = [
//     { id: 1, title: 'UX Consultation', desc: '' },
//     { id: 2, title: 'Usability Audit', desc: 'Our usability fellas will tap all day long...' }
//   ];

//   const handleToggle = (id) => {
//     setSelectedIds(prev => 
//       prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
//     );
//   };

//   return (
//     <div className="flex flex-col gap-3 p-6">
//       {services.map(s => (
//         <SelectionBox 
//           key={s.id}
//           title={s.title}
//           desc={s.desc}
//           isSelected={selectedIds.includes(s.id)}
//           onToggle={() => handleToggle(s.id)}
//         />
//       ))}
//     </div>
//   );
// }





// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
