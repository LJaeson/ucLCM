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
    const [targetTime, setTargetTime] = useState(null)
    const [restTime, setRestTime] = useState(null);
    const [qrcode, setQrcode] = useState("");
    // const [dummyState, setDummyState] = useState(true);

    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    // used to fetch the qrcode address from the server
    const fetchQrStatus = useCallback(async () => {
        try {
            const response = await fetch(`${ADDRESS}/qrcode`, {
                method: "GET",
                credentials: "include", 
            });

            if (response.ok) {
                const data = await response.json();
                
                if (!data.is_time) {
                    const finishTimestamp = Date.now() + (data.rest_time * 1000);
                    setTargetTime(finishTimestamp);
                    // setRestTime(data.rest_time);
                } else {
                    setQrcode(data.qrcode);
                }
            }
        } catch (error) {
            console.error("Could not fetch QR status:", error);
        }
    }, []);

    // when the page loads, retry fetch the qrcoe
    useEffect(() => {
        const loadInitialData = async () => {
            await fetchQrStatus();
        };

        loadInitialData();
    }, [fetchQrStatus]);

    // recursive setTimeout for the countdown
    useEffect(() => {
        // If there is no wait time, do nothing
        if (!targetTime) return;

        const timerId = setInterval(() => {
            const secondsLeft = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
            if (secondsLeft <= 0) {
                clearInterval(timerId);
                fetchQrStatus(); 
                setTargetTime(null);
            } else {
                setRestTime(secondsLeft);
                // setDummyState(prev => !prev); 
            }
        }, 1000);

        return () => clearInterval(timerId);
    }, [targetTime, fetchQrStatus]);

    // Video fadein logic
    useEffect(() => {
        const timer = setTimeout(() => setFadeIn(true), 50);
        return () => clearTimeout(timer);
    }, []);

    //if the video didnt display properly
    useEffect(() => {
        const fallbackTimer = setTimeout(() => {
            setVideoDone(true);
        }, 2500); 
        
        return () => clearTimeout(fallbackTimer);
    }, []);

    return (
        <div className='w-screen h-dvh bg-[#213C51] flex flex-col'>
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

                {/* Only show this div if videoDone is true */}
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