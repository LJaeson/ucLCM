import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom'; 
import "tailwindcss";

const ADDRESS = import.meta.env.VITE_ADDRESS

export default function AdminStampPage() {
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("Verifying student...");
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

            
                const response = await fetch(`${ADDRESS}:8000/scan/${qrCodeString}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-admin-token": "my-super-secret-admin-password" 
                    }
                });

                const data = await response.json();
                
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

    return (
        <div className="w-screen h-screen bg-[#213C51] flex flex-col items-center justify-center p-6 text-center">
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
        </div>
    );
}