import { useState } from 'react';
import "tailwindcss";
import CheckinPage from './CheckinPage1';
import SuccessPage from './SuccessPage';


// const 

export default function CheckInForm() {
  const [checkinPage1, setCheckinPage1] = useState(true);
  const [successPage, setSuccessPage] = useState(false);


  return (
    <>
      {checkinPage1 && <CheckinPage setFinish={setCheckinPage1} setStart={setSuccessPage}/>}
      {successPage && <SuccessPage/>}
    </>
  );
}

