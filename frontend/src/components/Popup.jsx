

export default function Popup({errorMessage, setErrorMessage}) {

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            
            {/* 2. The Actual Pop-up Box */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-pop-in flex flex-col items-center">
                
                {/* Big Red Warning Icon */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-black text-[#213C51] mb-2 font-['Nunito',_sans-serif]">
                Oooops!
                </h3>
                
                {/* The dynamic error message from FastAPI */}
                <p className="text-slate-600 font-medium mb-8 font-['Nunito',_sans-serif]">
                {errorMessage}
                </p>

                {/* Close Button */}
                <button 
                // Setting errorMessage back to "" automatically hides this whole modal!
                onClick={() => setErrorMessage("")}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200"
                >
                Got it
                </button>

            </div>
            </div>
        </>
    )
}