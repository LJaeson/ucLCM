import { useState, useEffect } from 'react';
import "tailwindcss";

// 1. Grab the IP address variable just like the other pages
const ADDRESS = import.meta.env.VITE_ADDRESS;

export default function FoodDrawer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waveUp, setWaveUp] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true)

  const [isMounted, setIsMounted] = useState(false);

  const handleCollectFood = async (e) => {
    e.stopPropagation(); // Still critical to stop the background from glitching!
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      const response = await fetch(`${ADDRESS}/checkin/food`, {
        method: "PATCH",
        credentials: "include", 
      });

      if (response.ok) {
        setIsCollected(true);
      } else {
        console.error("Server rejected the food request.");
      }
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const myFunction = async () =>  {
        try {
            const response = await fetch(`${ADDRESS}/status/food`, {
            method: "GET",
            credentials: "include", 
        });

        if (response.ok) {
            const data = await response.json();
            setIsConnecting(false);
            setIsCollected(data.food);
        } else {
            setIsCollected(true);
            console.error("Server rejected the food request.");
        }
        } catch (error) {
        console.error("Network error:", error);
        }
    }
  
    myFunction();
  }, []);

  //for the first time loading the button the fade in 
  useEffect(() => {
      const timer = setTimeout(() => setIsMounted(true), 50);
      return () => clearTimeout(timer);
  }, []);

  // for the animation
    useEffect(() => {
        const currentDelay = waveUp ? 1500 : 3000;

        const timerId = setTimeout(() => {
        setWaveUp((prev) => !prev);
        }, currentDelay);

        return () => clearTimeout(timerId);

    }, [waveUp]);

  return (
    <>
        {/* BACKGROUND LAYER */}
        <div
        className={`fixed z-40 transition-all ease-in-out flex flex-col items-center justify-center shadow-2xl
            ${isExpanded 
            ? 'duration-700 w-screen h-dvh left-1/2 -translate-x-1/2 bottom-0 translate-y-0 rounded-t-[0vw] cursor-default' 
            : waveUp 
                ? 'duration-[1500ms] w-[200vw] h-[200vw] left-1/2 -translate-x-1/2 bottom-0 translate-y-[calc(200vw-15vh)] rounded-t-[100vw] cursor-pointer'
                : 'duration-[1500ms] w-[200vw] h-[200vw] left-1/2 -translate-x-1/2 bottom-0 translate-y-[calc(200vw-13vh)] rounded-t-[100vw] cursor-pointer'
            }
            ${isConnecting ? 'bg-orange-600/50' : isCollected ? 'bg-red-500/50' : 'bg-[#00bca8]/50'}
            
            
            ${isMounted ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={() => {
            if (!isExpanded) setIsExpanded(true);
        }}
        >
        </div>

        
        {/* FOREGROUND LAYER */}
        <div
        className={`fixed z-50 transition-all ease-in-out flex flex-col items-center justify-center shadow-2xl
            ${isExpanded 
            ? 'duration-700 w-screen h-dvh left-1/2 -translate-x-1/2 bottom-0 translate-y-0 rounded-t-[0vw] cursor-default' 
            : waveUp
                ? 'duration-[1500ms] w-[200vw] h-[200vw] left-1/2 -translate-x-1/2 bottom-0 translate-y-[calc(200vw-10vh)] rounded-t-[100vw] cursor-pointer'
                : 'duration-[1500ms] w-[200vw] h-[200vw] left-1/2 -translate-x-1/2 bottom-0 translate-y-[calc(200vw-9vh)] rounded-t-[100vw] cursor-pointer'
            }
            ${isConnecting ? 'bg-orange-600' : isCollected ? 'bg-red-500' : 'bg-[#00bca8]'}
            
            {/* 4. ADD THE OPACITY TOGGLE HERE */}
            ${isMounted ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={() => {
            if (!isExpanded) setIsExpanded(true);
        }}
        >
        
            <div className={`absolute top-[2%] text-white text-sm tracking-widest font-bold transition-opacity duration-300 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                GRAB FOOD
            </div>

            <div className={`flex flex-col items-center transition-opacity duration-500 delay-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                
                {isExpanded && !isCollected && (
                <button 
                    // 4. Swap the old click logic for your new fetch function!
                    onClick={handleCollectFood}
                    disabled={isSubmitting}
                    className={`w-40 h-40 bg-white rounded-full font-bold text-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] font-['Zain'] transition-transform ${
                    isSubmitting ? 'text-gray-400 cursor-not-allowed scale-95' : 'text-[#213C51] hover:scale-105'
                    }`}
                >
                    {isSubmitting ? 'Wait...' : 'Collect'}
                </button>
                )}

                {isExpanded && isCollected && (
                <h2 className="text-white font-['Bebas_Neue'] text-5xl tracking-wider animate-fade-in [animation-duration:800ms]">
                    You have collected food!
                </h2>
                )}

                {isExpanded && !isCollected && (
                    <p className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[95vw] text-center text-white font-['Zain'] text-sm tracking-widest animate-fade-in [animation-duration:800ms]">
                        Do you know? We provide you FREE FOOD while you are studying!!!!!
                    </p>
                )}
                
                {isExpanded && (
                <button 
                    onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                    }}
                    className="absolute top-8 right-8 text-white/70 hover:text-white font-bold tracking-wider"
                >
                    CLOSE
                </button>
                )}
            </div>
        </div>
        
    </>
    
  );
}