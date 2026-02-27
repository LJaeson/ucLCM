import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import "tailwindcss";
import finishLogo from './assets/finish_logo_v1.webm';

const ADDRESS = import.meta.env.VITE_ADDRESS

export default function SuccessPage() {
    // for the qrcode
    const [videoDone, setVideoDone] = useState(false);
    const [restTime, setRestTime] = useState(null);
    const [qrcode, setQrcode] = useState("");

    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        // padStart adds a leading zero if the number is less than 10
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const getQrCode = async () => {
        console.log("count1");
        try {
            const response = await fetch(`${ADDRESS}:8000/qrcode`, {
                method: "GET",
                credentials: "include", 
            });

            if (response.ok) {
                const data = await response.json();
                
                if (!data.is_time) {
                    setRestTime(data.rest_time)
                } else {
                    setQrcode(data.qrcode)
                }
            }
        } catch (error) {
            console.error("Could not check session:", error);
        }
        console.log(qrcode);
    }

    useEffect(() => {
        const getQrCode1 = async () => {
            try {
                const response = await fetch(`${ADDRESS}:8000/qrcode`, {
                    method: "GET",
                    credentials: "include", 
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    if (!data.is_time) {
                        setRestTime(data.rest_time)
                    } else {
                        setQrcode(data.qrcode)
                    }
                }
            } catch (error) {
                console.error("Could not check session:", error);
            }
        }
        getQrCode1();
    }, []);

    useEffect(() => {
        // If there is no wait time, do nothing
        if (restTime <= 0 || restTime === null) return;

        // Start the clock
        const timerId = setInterval(() => {
            setRestTime((prevTime) => {
                if (prevTime <= 1) {
                    // TIME IS UP! 
                    clearInterval(timerId);
                    
                    // Automatically fetch the QR code now that the wait is over!
                    getQrCode(); 
                    
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        // Cleanup the timer if the user leaves the page early
        return () => clearInterval(timerId);
        
    }, [restTime]);


    return (
        <div className='w-screen h-screen bg-[#213C51] flex flex-col'>
            <div className='self-center max-w-200 w-screen'>
                <div className='flex w-[100%] justify-center pt-[12vh] pb-[1vh]'>
                    <video 
                        className="w-[40vw] max-w-md h-auto"
                        autoPlay 
                        muted 
                        playsInline
                        onEnded={() => setVideoDone(true)}
                    >
                        <source src={finishLogo} type="video/webm" />
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
                            <p className="mt-4">
                                Please come back to us after <span className="font-mono text-xl">{formatTime(restTime)}</span> to get a stamp.
                            </p>
                        ) : qrcode ? (
                            <div className="mt-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm shadow-lg">
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
                            <p className="mt-4 animate-pulse">Checking your status...</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}