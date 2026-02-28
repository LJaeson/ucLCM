import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "tailwindcss";

const ADDRESS = import.meta.env.VITE_ADDRESS;

export default function AdminLoginPage() {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await fetch(`${ADDRESS}:8000/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // CRITICAL: This allows the cookie to be saved!
                body: JSON.stringify({ name, password })
            });

            if (response.ok) {
                // If login succeeds, send them back to the scanner/dashboard!
                // For now, we'll just send them to a theoretical dashboard
                navigate("/admin/dashboard"); 
            } else {
                setError("Incorrect password.");
            }
        } catch (err) {
            setError("Could not connect to server.");
        }
    };

    return (
        <div className="w-screen h-screen bg-[#213C51] flex flex-col items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full">
                <h2 className="font-bebas text-3xl text-gray-800 tracking-widest text-center mb-6">
                    ADMIN ACCESS
                </h2>

                {error && <p className="text-red-500 text-center mb-4 font-medium">{error}</p>}

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <input 
                        type="text" 
                        placeholder="Your Name" 
                        className="p-3 border-2 border-gray-200 rounded-lg focus:border-[#213C51] outline-none"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="Top Secret Password" 
                        className="p-3 border-2 border-gray-200 rounded-lg focus:border-[#213C51] outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button 
                        type="submit" 
                        className="mt-2 bg-[#213C51] text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all"
                    >
                        GAIN ACCESS
                    </button>
                </form>
            </div>
        </div>
    );
}