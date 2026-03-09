import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import "tailwindcss";

const ADDRESS = import.meta.env.VITE_ADDRESS;

export default function Passport() {

    const [isExpanded, setIsExpanded] = useState(false);
    const [qrcode, setQrcode] = useState("");
    const [currentStamps, setCurrentStamps] = useState(0);
    const TOTAL_STAMPS = 20;

    useEffect(() => {
        const myFunction = async () => {
            try {
                const response = await fetch(`${ADDRESS}/status/stamps`, {
                    method: "GET",
                    credentials: "include",
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setCurrentStamps(data.count);
                    if (data.finished) {
                        setQrcode(data.qrcode);
                    } 
                } else {
                    console.error("Server rejected the stamp request.");
                }
            } catch (error) {
                console.log("Network error:", error);
            }
        }

        myFunction();
    }, []);

    return(
        <>
            <div 
                className={`animate-fade-in fixed z-40 w-24 h-10 bg-transparent flex items-center justify-center cursor-pointer transition-opacity duration-300 rounded-md
                    ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                `}
                onClick={() => setIsExpanded(true)}
            >
                <div className="font-['Zain'] text-sm tracking-widest font-medium text-white">
                    Passport
                </div>
            </div>

            <div 
                className={`fixed inset-0 w-dvw h-dvh z-60 bg-[#213C51] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out
                    ${isExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                `}
            >
                {/* Close Button */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(false);
                    }}
                    className="absolute top-8 right-8 text-white/70 hover:text-white font-bold tracking-wider transition-colors"
                >
                    CLOSE
                </button>

                {/* Content inside the Modal */}
                {isExpanded && 
                (
                    qrcode
                    ?
                    <div className='flex flex-col gap-8 items-center'>
                        <div className="text-white font-['Nunito',_sans-serif] font-medium text-lg tracking-wide">
                            Please find us to redeem your prize!
                        </div>

                        {/* QR CODE */}
                        <div className="mt-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm shadow-lg">
                            <QRCodeSVG 
                                value={qrcode} 
                                size={140} 
                                bgColor="transparent" 
                                fgColor="#ffffff" 
                                level="L" 
                            />
                        </div>
                    </div>
                    :
                    <div className='flex flex-col gap-8 items-center'>
                        <div className="text-white font-['Zain'] font-medium text-lg tracking-wide">
                            Collect 20 stamps to redeem a prize!
                        </div>

                        {/* The Stamp Grid */}
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-5 md:gap-6">
                            {Array.from({ length: TOTAL_STAMPS }).map((_, index) => {
                                const isFilled = index < currentStamps;
                                
                                return (
                                    <div 
                                        key={index}
                                        className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-500 ease-out opacity-0
                                            ${isFilled 
                                                ? 'bg-white scale-100' 
                                                : 'border-2 border-white/50 bg-transparent'
                                            }
                                            ${isExpanded ? 'animate-pop-in' : ''}
                                        `}
                                        style={{ animationDelay: `${300 + (index * 40)}ms` }}
                                    >
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
                }
            </div>
        </>
    );
}




