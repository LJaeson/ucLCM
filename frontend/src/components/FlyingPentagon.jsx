import { useState, useEffect } from 'react';

export default function FlyingPentagon({setFinish, setStart}) {
    const [one, setOne] = useState(false);
    const [two, setTwo] = useState(false);
    const [three, setThree] = useState(false);
    const [four, setFour] = useState(false);
    const [five, setFive] = useState(false);

    useEffect(() => {
        const timer1 = setTimeout(() => setOne(true), 250);
        
        const timer2 = setTimeout(() => setTwo(true), 400);
        
        const timer3 = setTimeout(() => setThree(true), 550);
        const timer4 = setTimeout(() => setFour(true), 650);
        const timer5 = setTimeout(() => setFive(true), 720);
        const timer6 = setTimeout(() => setFinish(false), 2000);
        const timer7 = setTimeout(() => setStart(true), 2000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
            clearTimeout(timer5);
            clearTimeout(timer6);
            clearTimeout(timer7);
        };
    }, []);

  return (
    <>
      <SendPentagon color="#E8FFD7" zIndex="z-40" />
      
      {one && <SendPentagon color="#93DA97" zIndex="z-50" />}
      {two && <SendPentagon color="#5E936C" zIndex="z-[60]" />}
      {three && <SendPentagon color="#3E5F44" zIndex="z-[70]" />}
      {four && <SendPentagon color="#2F5249" zIndex="z-[80]" />}
      {five && <SendPentagon color="#29455b" zIndex="z-[90]" />}
    </>
  );
}

function SendPentagon({ color, zIndex }) {
  return (
    <div className={`fixed inset-0 pointer-events-none ${zIndex} flex items-center justify-center overflow-hidden`}>
      <svg
        viewBox="0 0 100 100"
        className="w-64 h-64 animate-fly-in"
        style={{ fill: color }}
      >
        <polygon points="50,5 95,38 78,92 22,92 5,38" />
      </svg>
    </div>
  );
}