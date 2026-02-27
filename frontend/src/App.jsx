import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import "tailwindcss";
import CheckinPage from './CheckinPage1';
import SuccessPage from './SuccessPage';
import AdminStampPage from './AdminStampPage';


function Checkin() {
  const [checkinPage1, setCheckinPage1] = useState(true);
  const [successPage, setSuccessPage] = useState(false);

  return (
    <>
      {checkinPage1 && <CheckinPage setFinish={setCheckinPage1} setStart={setSuccessPage}/>}
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
            
            {/* The secret admin route. 
                The ":qrCodeString" is a dynamic parameter */}
            <Route path="/admin/stamp/:qrCodeString" element={<AdminStampPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

