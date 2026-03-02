import { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import "tailwindcss";
import finishLogoWebm from './assets/finish_logo_v1.webm';
import finishLogoMov from './assets/finish_logo_v1.mov';
import FoodDrawer from './components/FoodDrawer';

const ADDRESS = import.meta.env.VITE_ADDRESS;

export default function SuccessPage() {
    const [videoDone, setVideoDone] = useState(false);
    const [fadeIn, setFadeIn] = useState(false);
    const [restTime, setRestTime] = useState(null);
    const [qrcode, setQrcode] = useState("");

    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    // 1. One single, reusable fetch function wrapped in useCallback
    const fetchQrStatus = useCallback(async () => {
        try {
            const response = await fetch(`${ADDRESS}/qrcode`, {
                method: "GET",
                credentials: "include", 
            });

            if (response.ok) {
                const data = await response.json();
                
                if (!data.is_time) {
                    setRestTime(data.rest_time);
                } else {
                    setQrcode(data.qrcode);
                }
            }
        } catch (error) {
            console.error("Could not fetch QR status:", error);
        }
    }, []);

    // 2. Fetch immediately when the page loads
    useEffect(() => {
        const loadInitialData = async () => {
            await fetchQrStatus();
        };

        loadInitialData();
    }, [fetchQrStatus]);

    // 3. Clean, recursive setTimeout for the countdown
    useEffect(() => {
        // If there is no wait time, do nothing
        if (restTime === null || restTime <= 0) return;

        const timerId = setTimeout(() => {
            if (restTime <= 1) {
                // TIME IS UP! Fetch the new QR code
                fetchQrStatus();
                setRestTime(0);
            } else {
                // Tick down by 1 second
                setRestTime((prev) => prev - 1);
            }
        }, 1000);

        // Cleanup if the user leaves the page
        return () => clearTimeout(timerId);
        
    }, [restTime, fetchQrStatus]);

    // 4. Video fade-in logic
    useEffect(() => {
        const timer = setTimeout(() => setFadeIn(true), 50);
        return () => clearTimeout(timer);
    }, []);

    //if the video didnt pls properly
    useEffect(() => {
        const fallbackTimer = setTimeout(() => {
            setVideoDone(true);
        }, 3000); 
        
        return () => clearTimeout(fallbackTimer);
    }, []);

    return (
        <div className='w-screen h-screen bg-[#213C51] flex flex-col'>
            <div className='self-center max-w-200 w-screen'>
                <div className='flex w-[100%] justify-center pt-[12vh] pb-[1vh]'>
                    <video 
                        className={`w-[40vw] max-w-md h-auto transition-opacity duration-1200 ease-in-out ${
                            fadeIn ? 'opacity-100' : 'opacity-0'
                        }`}
                        autoPlay 
                        muted 
                        playsInline
                        onEnded={() => {
                            setVideoDone(true);
                            // setTimeout(() => setDrawerFade(true), 10);
                        }}
                    >
                        <source src={finishLogoMov} type='video/quicktime; codecs="hvc1"' />
                        <source src={finishLogoWebm} type="video/webm" />
                        Your browser does not support the video tag.
                    </video>
                </div>

                {/* 3. Conditional rendering: Only show this div if videoDone is true */}
                {videoDone && (
                    <div className='flex flex-col items-center'>
                        <h2 className="animate-fade-in font-bebas text-white text-4xl mt-6 tracking-widest">
                            THANK YOU!
                        </h2>

                        {restTime > 0 ? (
                            <p className="mt-4 animate-fade-in text-white align-middle px-5 font-['Nunito',_sans-serif] font-medium text-sm">
                                Please come back to us after <span>{formatTime(restTime)}</span> to get a stamp.
                            </p>
                        ) : qrcode ? (
                            <div className="mt-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm shadow-lg animate-fade-in">
                                <QRCodeSVG 
                                    value={qrcode} 
                                    size={140} 
                                    bgColor="transparent" 
                                    fgColor="#ffffff" 
                                    level="L" 
                                />
                            </div>

                        ) : (
                            // A fallback in case the data is still loading
                            <p className="mt-4 animate-pulse text-white">Checking your status...</p>
                        )}

                    </div>
                )}
            </div>

            {videoDone && (
                // <div className={`transition-opacity duration-[1200ms] ease-in-out ${drawerFade ? 'opacity-100' : 'opacity-0'}`}>
                    <FoodDrawer/>
                // </div>
            )}
        </div>
    );
}