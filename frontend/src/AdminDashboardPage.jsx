import { useState } from 'react';
import ClassicDashboard from './dashboard/ClassicDashboard';
import NewDashboard from './dashboard/NewDashboard';

const VERSION_STORAGE_KEY = 'adminDashboardVersion';

function readStoredVersion() {
    try {
        return localStorage.getItem(VERSION_STORAGE_KEY) === 'classic' ? 'classic' : 'new';
    } catch {
        return 'new';
    }
}

// A small corner triangle that flips between the redesigned and the classic dashboard.
function VersionToggle({ version, onToggle }) {
    const target = version === 'new' ? 'classic' : 'new';
    const label = `Switch to the ${target} dashboard`;
    const color = version === 'new' ? '#e0672c' : '#94a3b8';

    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={label}
            title={label}
            className="group fixed bottom-0 left-0 z-50 h-9 w-9 focus:outline-none"
        >
            <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-[18px] w-[18px] opacity-70 transition-all duration-150 group-hover:h-6 group-hover:w-6 group-hover:opacity-100 group-focus-visible:h-6 group-focus-visible:w-6 group-focus-visible:opacity-100"
                style={{ background: color, clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}
            />
            <span className="pointer-events-none absolute bottom-2 left-8 whitespace-nowrap rounded-md bg-slate-900/85 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {target} view
            </span>
        </button>
    );
}

export default function AdminDashboardPage() {
    const [version, setVersion] = useState(readStoredVersion);

    const handleToggle = () => {
        const nextVersion = version === 'new' ? 'classic' : 'new';
        setVersion(nextVersion);
        try {
            localStorage.setItem(VERSION_STORAGE_KEY, nextVersion);
        } catch {
            // storage can be unavailable (private mode); the switch still works for this visit
        }
    };

    return (
        <>
            {version === 'new' ? <NewDashboard /> : <ClassicDashboard />}
            <VersionToggle version={version} onToggle={handleToggle} />
        </>
    );
}
