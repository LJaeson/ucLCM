import flyerImg from '../assets/kahoot_flyer.jpg';

const FLYER_LINK = "https://forms.cloud.microsoft/r/vNE3A9Np5A";

export default function FlyerPopup({ onClose }) {

    return (
        <div className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm p-4 animate-fade-in">

            {/* Flyer (9:16), sized so the flyer and the close button always fit on screen */}
            <a
                href={FLYER_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                style={{ width: 'min(100%, 420px, calc((100dvh - 6rem) * 9 / 16))' }}
            >
                <img
                    src={flyerImg}
                    alt="Kahoot Revision Night - tap to register"
                    className="block w-full h-auto rounded-xl shadow-2xl"
                />
            </a>

            {/* Close Button */}
            <button
                onClick={onClose}
                aria-label="Close flyer"
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-white/90 text-[#213C51] shadow-lg hover:bg-white transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 6l12 12M18 6L6 18" />
                </svg>
            </button>
        </div>
    )
}
