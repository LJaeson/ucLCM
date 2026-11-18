import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// Opening title sequence that doubles as the loading screen:
//   black screen, STUDY / CLUB rises in → black and type shrink into the logo →
//   "Study Club" slides out of the logo → "Hello {name}!" slides out from under it →
//   (holds while data loads) → the logo and name glide into the header → the dashboard is revealed.

const HEADER_MARK = 28; // header logo size in px; the centre lockup is k × the header lockup
const HEADER_LOCKUP_WIDTH = 140; // logo + gap + "Study Club" at 18px, used only to size k

// every duration and pause below is multiplied by this; lower is faster
const TEMPO = 0.75;

const EASE_LETTER = 'cubic-bezier(0.2, 0.9, 0.25, 1)';
const EASE_SHRINK = 'cubic-bezier(0.76, 0, 0.24, 1)';
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EASE_IN = 'cubic-bezier(0.55, 0, 0.75, 0.2)';
const EASE_MOVE = 'cubic-bezier(0.65, 0, 0.35, 1)';

// Letter origins in the logo's 168-unit space, measured from /studyClub.svg so the
// animated type lands exactly on the real logo before it cross-fades in.
const FONT_SIZE = 51.2;
const LETTERS = [
    { ch: 'S', x: 50.87, y: 82.1, line: 0 },
    { ch: 'T', x: 74.39, y: 82.1, line: 0 },
    { ch: 'U', x: 95.9, y: 82.1, line: 0 },
    { ch: 'D', x: 119.9, y: 82.1, line: 0 },
    { ch: 'Y', x: 143.54, y: 82.1, line: 0 },
    { ch: 'C', x: 51.06, y: 115, line: 1 },
    { ch: 'L', x: 74.9, y: 115, line: 1 },
    { ch: 'U', x: 96.1, y: 115, line: 1 },
    { ch: 'B', x: 119.9, y: 115, line: 1 },
];
// the type block inside the logo, as fractions of its side
const TYPE_BLOCK = { left: 0.3095, right: 0.9702, top: 0.2738, bottom: 0.6845 };

function centreScale() {
    const width = typeof window === 'undefined' ? 1280 : window.innerWidth;
    return Math.min(3, Math.max(1.6, (0.8 * width) / HEADER_LOCKUP_WIDTH));
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Lets the timeline await a prop that turns true later (data loaded, name known).
function useFlagWaiter(flag) {
    const flagRef = useRef(flag);
    const waitersRef = useRef([]);

    useEffect(() => {
        flagRef.current = flag;
        if (flag) {
            waitersRef.current.forEach((resolve) => resolve());
            waitersRef.current = [];
        }
    }, [flag]);

    return useCallback(
        () => (flagRef.current ? Promise.resolve() : new Promise((resolve) => waitersRef.current.push(resolve))),
        [],
    );
}

export default function IntroSequence({ ready, greetingName, nameReady, brandMarkRef, rootRef, onDone }) {
    const [k] = useState(centreScale);
    const overlayRef = useRef(null);
    const blackRef = useRef(null);
    const lockupRef = useRef(null);
    const typeRef = useRef(null);
    const logoRef = useRef(null);
    const wordRef = useRef(null);
    const greetingRef = useRef(null);
    const loaderRef = useRef(null);
    const onDoneRef = useRef(onDone);
    const waitForData = useFlagWaiter(ready);
    const waitForName = useFlagWaiter(nameReady);

    useEffect(() => {
        onDoneRef.current = onDone;
    }, [onDone]);

    // place the type big and centred before the first frame is painted
    useLayoutEffect(() => {
        const mark = HEADER_MARK * k;
        const scale = Math.max(
            2,
            Math.min(
                (0.3 * window.innerHeight) / ((TYPE_BLOCK.bottom - TYPE_BLOCK.top) * mark),
                (0.7 * window.innerWidth) / ((TYPE_BLOCK.right - TYPE_BLOCK.left) * mark),
            ),
        );
        const offsetX = ((TYPE_BLOCK.left + TYPE_BLOCK.right) / 2 - 0.5) * mark;
        const offsetY = ((TYPE_BLOCK.top + TYPE_BLOCK.bottom) / 2 - 0.5) * mark;
        typeRef.current.dataset.start = `translate(${-offsetX}px, ${-offsetY}px) scale(${scale})`;
        typeRef.current.style.transform = typeRef.current.dataset.start;
    }, [k]);

    useEffect(() => {
        let cancelled = false;
        const running = new Set();
        // reduced motion is an accessibility setting, not a skip: the sequence still holds for data
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const speed = reduceMotion ? 0 : TEMPO;
        const html = document.documentElement;
        const previousOverflow = html.style.overflow;
        html.style.overflow = 'hidden';
        window.scrollTo(0, 0);

        const play = (element, keyframes, { duration, delay = 0, easing = 'linear', fill = 'both' }) => {
            const animation = element.animate(keyframes, { duration: duration * speed, delay: delay * speed, easing, fill });
            running.add(animation);
            animation.finished.then(() => running.delete(animation), () => running.delete(animation));
            return animation;
        };
        const settle = (animations) => Promise.all(animations.map((animation) => animation.finished)).catch(() => {});

        async function sequence() {
            const mark = HEADER_MARK * k;
            const gap = 10 * k;
            const black = blackRef.current;
            const type = typeRef.current;
            const lockup = lockupRef.current;
            const logo = logoRef.current;
            const word = wordRef.current;
            const greeting = greetingRef.current;
            const letters = [...type.querySelectorAll('.dash-intro-letter')];

            // fonts first, so nothing re-flows mid-move; never block for long
            await Promise.race([
                Promise.all([document.fonts.load(`${FONT_SIZE}px "Bebas Neue"`), document.fonts.load('600 54px Geist')]),
                wait(1200),
            ]);
            if (cancelled) return;

            // 1. STUDY / CLUB rises letter by letter
            await settle(
                letters.map((letter, index) =>
                    play(letter, [{ transform: 'translateY(48px)' }, { transform: 'translateY(0px)' }], {
                        duration: 700,
                        delay: index * 45,
                        easing: EASE_LETTER,
                    }),
                ),
            );
            if (cancelled) return;
            await wait(220 * speed);
            if (cancelled) return;

            // 2. the black and the type zoom down into the logo, uncovering the background
            const insetY = (window.innerHeight - mark) / 2;
            const insetX = (window.innerWidth - mark) / 2;
            await settle([
                play(black, [
                    { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
                    { clipPath: `inset(${insetY}px ${insetX}px ${insetY}px ${insetX}px round ${mark / 4}px)` },
                ], { duration: 950, easing: EASE_SHRINK }),
                play(type, [{ transform: type.dataset.start }, { transform: 'translate(0px, 0px) scale(1)' }], {
                    duration: 950,
                    easing: EASE_SHRINK,
                }),
            ]);
            if (cancelled) return;

            // 3. hand over to the real logo image, which sits exactly underneath
            await settle([play(logo, [{ opacity: 0 }, { opacity: 1 }], { duration: 180 })]);
            if (cancelled) return;
            black.style.visibility = 'hidden';
            type.style.visibility = 'hidden';

            // 4. "Study Club" slides out of the logo while the logo makes room
            const wordWidth = word.offsetWidth;
            const shiftX = -(gap + wordWidth) / 2;
            const centred = `translate(${shiftX}px, 0px)`;
            await settle([
                play(lockup, [{ transform: 'translate(0px, 0px)' }, { transform: centred }], { duration: 800, easing: EASE_OUT }),
                play(word, [{ transform: `translateX(${-(wordWidth + gap)}px)` }, { transform: 'translateX(0px)' }], {
                    duration: 800,
                    easing: EASE_OUT,
                }),
            ]);
            if (cancelled) return;

            // 5. "Hello {name}!" slides out from under the word, and the group lifts to stay centred
            await waitForName();
            if (cancelled) return;
            const lift = greeting.offsetHeight / 2;
            const greeted = `translate(${shiftX}px, ${-lift}px)`;
            await settle([
                play(lockup, [{ transform: centred }, { transform: greeted }], { duration: 650, easing: EASE_OUT }),
                play(greeting, [{ transform: 'translateY(-105%)' }, { transform: 'translateY(0%)' }], {
                    duration: 650,
                    delay: 60,
                    easing: EASE_OUT,
                }),
            ]);
            if (cancelled) return;
            await wait(750 * speed);
            if (cancelled) return;

            // 6. still loading: hold here with a quiet progress line
            await new Promise((resolve) => {
                let shown = false;
                const reveal = setTimeout(() => {
                    shown = true;
                    play(loaderRef.current, [{ opacity: 0, transform: 'translate(-50%, 6px)' }, { opacity: 1, transform: 'translate(-50%, 0px)' }], {
                        duration: 400,
                        easing: EASE_OUT,
                    });
                }, 0);
                waitForData().then(async () => {
                    clearTimeout(reveal);
                    if (shown) await settle([play(loaderRef.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 })]);
                    resolve();
                });
            });
            if (cancelled) return;

            // 7. the greeting tucks back under the word as the pair glides into the header
            const target = brandMarkRef.current?.getBoundingClientRect();
            play(greeting, [{ transform: 'translateY(0%)' }, { transform: 'translateY(-105%)' }], { duration: 380, easing: EASE_IN });
            if (target) {
                const startLeft = window.innerWidth / 2 - mark / 2;
                const startTop = window.innerHeight / 2 - mark / 2;
                await settle([
                    play(lockup, [
                        { transform: greeted },
                        { transform: `translate(${target.left - startLeft}px, ${target.top - startTop}px) scale(${target.width / mark})` },
                    ], { duration: 950, delay: 120, easing: EASE_MOVE }),
                ]);
                if (cancelled) return;
            }

            // 8. reveal the dashboard underneath
            await reveal();
        }

        function reveal() {
            const root = rootRef.current;
            const t = (ms) => (reduceMotion ? 0 : ms * TEMPO);
            const rise = reduceMotion ? [{ opacity: 0 }, { opacity: 1 }] : null;
            const animations = [];
            const add = (element, keyframes, options) => {
                animations.push(
                    element.animate(keyframes, {
                        fill: 'backwards',
                        ...options,
                        duration: reduceMotion ? 200 : options.duration * TEMPO,
                        delay: t(options.delay || 0),
                    }),
                );
            };

            const header = root.querySelector('header');
            if (header) add(header, [{ backgroundColor: 'rgba(234, 233, 230, 0)', backdropFilter: 'blur(0px)' }, {}], { duration: 600, easing: 'ease-out' });
            root.querySelectorAll('[data-intro="header"]').forEach((element, index) => {
                add(element, rise || [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], {
                    duration: 550,
                    delay: index * 70,
                    easing: EASE_OUT,
                });
            });
            const backdrop = root.querySelector('.dash-backdrop');
            if (backdrop) add(backdrop, [{ opacity: 0 }, {}], { duration: 1600, delay: 200, easing: 'ease-out' });

            root.querySelectorAll('main .dash-tile, main [aria-label="Active filters"]').forEach((element, index) => {
                add(element, rise || [{ opacity: 0, transform: 'translateY(22px) scale(0.985)' }, { opacity: 1, transform: 'none' }], {
                    duration: 750,
                    delay: 120 + Math.min(index, 10) * 60,
                    easing: EASE_OUT,
                });
            });
            if (!reduceMotion) {
                root.querySelectorAll('main .dash-col-bar').forEach((element, index) => {
                    add(element, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 700, delay: 420 + index * 40, easing: EASE_OUT });
                });
                root.querySelectorAll('main .dash-grow-x').forEach((element, index) => {
                    add(element, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 800, delay: 520 + Math.min(index, 20) * 28, easing: EASE_OUT });
                });
                root.querySelectorAll('main .dash-spark-line').forEach((element) => {
                    add(element, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1100, delay: 450, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' });
                });
            }
            const footer = root.querySelector('footer');
            if (footer) add(footer, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 700, easing: 'ease-out' });

            // the animations above already hold their first frame, so lifting the overlay now cannot flash
            overlayRef.current.style.display = 'none';
            html.style.overflow = previousOverflow;
            animations.forEach((animation) => running.add(animation));
            return settle(animations).then(() => {
                if (!cancelled) onDoneRef.current();
            });
        }

        sequence();

        return () => {
            cancelled = true;
            running.forEach((animation) => animation.cancel());
            running.clear();
            html.style.overflow = previousOverflow;
        };
    }, [k, brandMarkRef, rootRef, waitForData, waitForName]);

    return (
        <div ref={overlayRef} className="dash-intro" style={{ '--k': k }} role="status">
            <span className="sr-only">Loading the admin dashboard</span>
            <div ref={blackRef} className="dash-intro-black" aria-hidden="true" />

            <div ref={lockupRef} className="dash-intro-lockup" aria-hidden="true">
                <div className="dash-intro-mark">
                    <svg ref={typeRef} className="dash-intro-type" viewBox="0 0 168 168">
                        <defs>
                            <clipPath id="dash-intro-line-0">
                                <rect x="-40" y="-200" width="260" height="284" />
                            </clipPath>
                            <clipPath id="dash-intro-line-1">
                                <rect x="-40" y="70" width="260" height="47" />
                            </clipPath>
                        </defs>
                        {[0, 1].map((line) => (
                            <g key={line} clipPath={`url(#dash-intro-line-${line})`}>
                                {LETTERS.filter((letter) => letter.line === line).map((letter) => (
                                    <text
                                        key={`${letter.ch}-${letter.x}`}
                                        className="dash-intro-letter"
                                        x={letter.x}
                                        y={letter.y}
                                        fontSize={FONT_SIZE}
                                    >
                                        {letter.ch}
                                    </text>
                                ))}
                            </g>
                        ))}
                    </svg>
                    <img ref={logoRef} src="/studyClub.svg" alt="" className="dash-intro-logo" />
                </div>
                <div className="dash-intro-slot">
                    <span ref={wordRef} className="dash-intro-word">
                        Study Club
                    </span>
                </div>
                {/* clipped at the word's baseline, so the greeting appears to slide out from under it */}
                <div className="dash-intro-greeting-slot">
                    <span ref={greetingRef} className="dash-intro-greeting">
                        {greetingName ? `Hello ${greetingName}!` : 'Hello!'}
                    </span>
                </div>
            </div>

            <div ref={loaderRef} className="dash-intro-loader" aria-hidden="true">
                <span className="dash-intro-track" />
                <span className="dash-label">Loading analytics</span>
            </div>
        </div>
    );
}
