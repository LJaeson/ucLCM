import { useEffect } from 'react';

export default function FlyingPentagon({setFinish, setStart}) {
    useEffect(() => {
        
        const timer6 = setTimeout(() => setFinish(false), 2000);
        const timer7 = setTimeout(() => setStart(true), 2000);

        return () => {
            clearTimeout(timer6);
            clearTimeout(timer7);
        };
    }, []);


    return (
        <>
            <SendPentagon color="#E8FFD7" zIndex="z-10" delay="0"/>
            <SendPentagon color="#93DA97" zIndex="z-20" delay="250" />
            <SendPentagon color="#5E936C" zIndex="z-30" delay="400"/>
            <SendPentagon color="#3E5F44" zIndex="z-40" delay="550"/>
            <SendPentagon color="#2F5249" zIndex="z-50" delay="650" />
            <SendPentagon color="#213C51" zIndex="z-[60]" delay="720" />
        </>
    );
}

function SendPentagon({ color, zIndex, delay }) {
  return (
    <div className={`fixed inset-0 pointer-events-none ${zIndex} flex items-center justify-center overflow-hidden`}>
      <svg
        viewBox="0 0 100 100"
        className="w-64 h-64 animate-fly-in transform-gpu"
        style={{ fill: color, animationDelay: `${delay}ms` }}
      >
        <polygon points="50,5 95,38 78,92 22,92 5,38" />
      </svg>
    </div>
  );
}