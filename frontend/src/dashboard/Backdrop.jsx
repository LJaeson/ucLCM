// Slow abstract shapes that sit behind the glass tiles: hairlines with a sliding block,
// a half disc on a hinge, bars that fade into each other, and a rising curve.
const BAR_ROWS = [
    { pivot: '64%', delay: '0s', green: true },
    { pivot: '58%', delay: '-3s', green: true },
    { pivot: '38%', delay: '-6s', green: false },
    { pivot: '70%', delay: '-9s', green: true },
];

export default function Backdrop() {
    return (
        <div className="dash-backdrop" aria-hidden="true">
            <div className="dash-motif dash-motif-lines">
                {[0, 25, 50, 75, 100].map((left) => (
                    <span key={left} className="dash-motif-line" style={{ left: `${left}%` }} />
                ))}
                <div className="dash-motif-slider">
                    <span className="dash-motif-block" />
                </div>
            </div>

            <svg className="dash-motif dash-motif-orb" viewBox="0 0 200 200" overflow="visible">
                <defs>
                    <radialGradient id="dash-orb-fill" cx="0.42" cy="0.5" r="0.72">
                        <stop offset="0" stopColor="#95a35f" />
                        <stop offset="0.65" stopColor="#b6bf8d" />
                        <stop offset="1" stopColor="#d9dccb" />
                    </radialGradient>
                </defs>
                <path
                    d="M100,-24 A124,124 0 0 0 100,224"
                    fill="none"
                    stroke="rgba(29,28,26,0.3)"
                    strokeWidth="0.9"
                    strokeDasharray="0.6 4"
                    strokeLinecap="round"
                />
                <g className="dash-motif-orb-swing">
                    <path d="M100,12 A88,88 0 0 0 100,188 Z" fill="url(#dash-orb-fill)" />
                    <line x1="100" y1="12" x2="100" y2="188" stroke="#3d3b36" strokeWidth="0.8" />
                    <circle cx="100" cy="188" r="2.6" fill="#8d9a5a" />
                </g>
            </svg>

            <div className="dash-motif dash-motif-bars">
                {BAR_ROWS.map((row) => (
                    <div
                        key={row.delay}
                        className={`dash-motif-bar ${row.green ? 'has-green' : ''}`}
                        style={{ '--pivot': row.pivot, animationDelay: row.delay }}
                    />
                ))}
            </div>

            <svg className="dash-motif dash-motif-curve" viewBox="0 0 100 300" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="dash-curve-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#93a35b" stopOpacity="0.95" />
                        <stop offset="0.55" stopColor="#b59a55" stopOpacity="0.9" />
                        <stop offset="0.78" stopColor="#e0702e" stopOpacity="0.9" />
                        <stop offset="1" stopColor="#e0702e" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d="M0,300 C66,300 94,230 100,0 L100,300 Z" fill="url(#dash-curve-fill)" />
            </svg>
        </div>
    );
}
