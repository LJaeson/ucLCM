import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "tailwindcss";
import CheckinPage from './CheckinPage1';
import CheckinPage2 from './CheckinPage2';
import SuccessPage from './SuccessPage';
import AdminStampPage from './AdminStampPage';
import AdminLoginPage from './AdminLoginPage';
import AdminRedeemPage from './AdminRedeemPage';
import AdminLoginSuccessPage from './AdminLoginSuccessPage';

const ADDRESS = import.meta.env.VITE_ADDRESS;

function Checkin() {
  const [isLoading, setIsLoading] = useState(true);
  
  const [checkinPage1, setCheckinPage1] = useState(false);
  const [checkinPage2, setCheckinPage2] = useState(false);
  const [successPage, setSuccessPage] = useState(false);

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const response = await fetch(`${ADDRESS}/whoami`, {
          method: "GET",
          credentials: "include", 
        });

        if (response.ok) {
          const data = await response.json();
          
          //session not recorded, new user
          if (!data.recorded) {
            setCheckinPage1(true); 
          } else {

            // session recorded, already checkin
            if (data.checkined) {
              setSuccessPage(true);  

            // session recorded, havnt checkin
            } else {
              setCheckinPage2(true)
            }
          }
        } else {
          setCheckinPage1(true); 
        }
      } catch (error) {
        console.error("Could not check session:", error);
        setCheckinPage1(true); // Fallback to form if network is down
      } finally {
        // Turn off the loading screen no matter what happened
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []); // Empty array means this only runs once on load

  // 5. Show a smooth loading screen while waiting for the network
  if (isLoading) {
    return (
        <div className="w-screen h-screen bg-[#213C51] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold text-white mt-4">Checking status...</h2>
            </div>
        </div>
    );
  }

  return (
    <>
      {checkinPage1 && <CheckinPage setFinish={setCheckinPage1} setStart={setSuccessPage}/>}
      {checkinPage2 && <CheckinPage2 setFinish={setCheckinPage2} setStart={setSuccessPage}/>}
      {successPage && <SuccessPage/>}
    </>
  )
}

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
            {/* Default route: The student lands here to check in */}
            <Route path="/" element={<Checkin/>} />
            {/* <Route path="/" element={<CheckinPage2/>} /> */}

            {/* for counting visitor */}
            <Route path="/scan" element={<Navigate to="/" replace />} />

            {/* the admin login page */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            
            {/* The secret admin route.  */}
            <Route path="/admin/stamp/:qrCodeString" element={<AdminStampPage />} />

            {/* The secret admin .  */}
            <Route path="/admin/redeem/:qrCodeString" element={<AdminRedeemPage />} />

            {/* admin login success page */}
            <Route path="/admin/dashboard" element={<AdminLoginSuccessPage/>} />
        </Routes>
      </BrowserRouter>
      <Analytics/>
      <SpeedInsights/>
    </>
  );
}