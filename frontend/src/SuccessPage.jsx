import { useState } from 'react';
import "tailwindcss";
import finishLogo from './assets/finish_logo_v1.webm';

export default function SuccessPage() {
    // 1. Create a state to track the video status
    const [videoDone, setVideoDone] = useState(false);

    return (
        <div className='w-screen h-screen bg-[#213C51] flex flex-col'>
            <div className='self-center max-w-200 w-screen'>
                <div className='flex w-[100%] justify-center pt-[12vh] pb-[1vh]'>
                    <video 
                        className="w-[40vw] max-w-md h-auto"
                        autoPlay 
                        muted 
                        playsInline
                        // 2. Trigger the state change when the video ends
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
                        <p>Please come back to us after TIME to get and stamp</p>
                    </div>
                )}
            </div>
        </div>
    );
}