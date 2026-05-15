import { useEffect, useState } from 'react';

const ADDRESS = import.meta.env.VITE_ADDRESS;

export default function AdminModifyPage () {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [zid, setZid] = useState('')
    const [userData, setUserData] = useState(null);


    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await fetch(`${ADDRESS}/admin/checkAdmin`, {
                    method: 'GET',
                    credentials: 'include',
                });

                

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Your admin session has expired. Please log in again.');
                    }
                    throw new Error('Failed to load analytics data.');
                }

            } catch (fetchError) {
                setError(fetchError.message || 'Could not load analytics.');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    return (
        <>
            <div className="w-screen h-screen bg-[#213C51] flex flex-col items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full">
                <h2 className="font-bebas text-3xl text-gray-800 tracking-widest text-center mb-6">
                    Modify
                </h2>

                {loading && <p className="text-sm text-slate-600">Checking access validation</p>}

                {!loading && error && <p className="text-red-500 text-center mb-4 font-medium">{error}</p>}

                {!loading && !error && (
                    <>
                        <div>
                            <div className='w-max gap-2 flex flex-row items-center justify-center '>
                                <input
                                    type='text'
                                    placeholder='zxxxxxxx'
                                    className="p-3 border-2 border-gray-200 rounded-lg focus:border-[#213C51] outline-none"
                                    value={zid}
                                    onChange={(e) => setZid(e.target.value)}
                                />

                                <button
                                    className="p-2 m-2 bg-[#213C51] text-white font-bold py-3 rounded-lg hover:bg-opacity-50 transition-all min-w-max"
                                    onClick={async () => {
                                        try {
                                            const params = new URLSearchParams();
                                            if (zid.trim()) {
                                                params.set('zid', zid.trim());
                                            }

                                            const response = await fetch(`${ADDRESS}/whoami${params.toString() ? `?${params.toString()}` : ''}`, {
                                                method: 'GET',
                                                credentials: 'include',
                                            });

                                            if (!response.ok) {
                                                throw new Error('Failed to fetch user data.');
                                            }

                                            const data = await response.json();

                                            if (!data.recorded) {
                                                throw new Error('No user found with that ZID.');
                                            }

                                            setUserData(data);

                                            console.log(data);
                                        } catch (fetchError) {
                                            setError(fetchError.message || 'Could not fetch user data.');
                                        }
                                    }}
                                >
                                    Check
                                </button>
                            </div>
                            <div>
                                {userData && (
                                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                                        <p><strong>Name:</strong> {userData.name}</p>
                                        <p><strong>ZID:</strong> {userData.zid}</p>
                                        <div className="mt-4">
                                            <p className="mb-2 font-medium">Total Signatures:</p>
                                            <input
                                                type='text'
                                                className="p-3 border-2 border-gray-200 rounded-lg focus:border-[#213C51] outline-none"
                                                value={userData.total_signature}
                                                onChange={(e) => setUserData({...userData, total_signature: e.target.value})}
                                            />
                                        </div>
                                        <div className="mt-4">
                                            <p className="mb-2 font-medium">Current Signatures:</p>
                                            <input
                                                type='text'
                                                className="p-3 border-2 border-gray-200 rounded-lg focus:border-[#213C51] outline-none"
                                                value={userData.current_signature}
                                                onChange={(e) => setUserData({...userData, current_signature: e.target.value})}
                                            />
                                        </div>
                                        <button
                                            className="mt-4 bg-[#213C51] text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-all"
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch(`${ADDRESS}/admin/modify`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        credentials: 'include',
                                                        body: JSON.stringify({
                                                            zid: userData.zid,
                                                            total_signature: userData.total_signature,
                                                            current_signature: userData.current_signature,
                                                        }),
                                                    });

                                                    if (!response.ok) {
                                                        throw new Error('Failed to update user data.');
                                                    }

                                                    alert('User data updated successfully!');
                                                } catch (updateError) {
                                                    setError(updateError.message || 'Could not update user data.');
                                                }
                                            }}
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                )}


                            </div>
                        </div>
                        {/* <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
                                className="mt-2 bg-[#213C51] text-white font-bold py-3 rounded-lg hover:bg-opacity-50 transition-all"
                            >
                                GAIN ACCESS
                            </button>
                        </form> */}
                    
                    
                    
                    </>
                )}

            </div>
        </div>
        </>
    )
}