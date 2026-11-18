import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom'; 
import "tailwindcss";

const ADDRESS = import.meta.env.VITE_ADDRESS

// Farewell themes for peer leaders who are leaving, keyed by the first name
// they type at admin login (lowercase). Shown only on a successful stamp.
const FAREWELL_THEMES = {
    stephy: {
        background: "#FF8882",
        lines: [
            "Thank you Stephy!",
            "Thanks for everything you done in Study Club",
            "多謝你嘅付出!",
        ],
    },
    issac: {
        background: "#93DA97",
        lines: [
            "Thank you Issac!",
            "You will doing soo good in your future study",
            "نشكركم على مساهمتكم",
        ],
    },
};
FAREWELL_THEMES.isaac = FAREWELL_THEMES.issac;

function findFarewellTheme(leaderName) {
    const firstName = leaderName.trim().split(/\s+/)[0].toLowerCase();
    return FAREWELL_THEMES[firstName] ?? null;
}

export default function AdminStampPage() {
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("Verifying student...");
    const [leaderName, setLeaderName] = useState("");
    const hasProcessed = useRef(false);
    
    const { qrCodeString } = useParams(); 

    useEffect(() => {
        if (hasProcessed.current) return;
        hasProcessed.current = true;

        const processStamp = async () => {
            try {
                if (!qrCodeString) {
                    setStatus("error");
                    setMessage("Invalid QR Code link.");
                    return;
                }

            
                const [response, me] = await Promise.all([
                    fetch(`${ADDRESS}/admin/scan/${qrCodeString}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include"
                    }),
                    // who is scanning; only used for the farewell theme, so failures are ignored
                    fetch(`${ADDRESS}/admin/me`, { credentials: "include" })
                        .then((res) => (res.ok ? res.json() : null))
                        .catch(() => null),
                ]);

                const data = await response.json();

                setLeaderName(me?.name ?? "");
                setStatus(data.status);
                setMessage(data.message);

            } catch (error) {
                console.error(error);
                setStatus("error");
                setMessage("Could not connect to the database.");
            }
        };

        processStamp();
    }, [qrCodeString]); // Add qrCodeString to the dependency array

    const farewell = status === "success" ? findFarewellTheme(leaderName) : null;

    return (
        <div
            className="w-screen h-screen bg-[#213C51] flex flex-col items-center justify-center p-6 text-center transition-colors duration-700"
            style={farewell ? { backgroundColor: farewell.background } : undefined}
        >
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full">
                
                {status === "loading" && (
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-[#213C51] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h2 className="text-xl font-bold text-gray-700">Verifying...</h2>
                    </div>
                )}

                {status !== "loading" && (
                    <>
                        <div className={`text-7xl mb-4 ${
                            status === 'success' ? 'text-green-500' : 
                            status === 'warning' ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                            {status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌'}
                        </div>
                        
                        <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-wide">
                            {status === 'success' ? 'Signature Granted' : 
                             status === 'warning' ? 'Attention' : 'Error'}
                        </h2>
                        
                        <p className="text-gray-600 text-lg font-medium">{message}</p>
                    </>
                )}
            </div>

            {farewell && (
                <div className="mt-8 max-w-sm w-full text-white">
                    {farewell.lines.map((line, i) => (
                        <p
                            key={line}
                            dir="auto"
                            className={i === 0 ? "text-3xl font-black mb-3" : "text-lg font-bold mt-1"}
                        >
                            {line}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}