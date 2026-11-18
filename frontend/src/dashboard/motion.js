import { useLayoutEffect, useRef, useState } from 'react';

const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
const DEFAULT_ENTER = [
    { opacity: 0, transform: 'translateY(6px)' },
    { opacity: 1, transform: 'none' },
];

// Slides items to their new places when a filter re-sorts or reflows them (rows in a list,
// chips in a wrapping row), and animates in items that just joined. Items need a data-flip
// key; attach the returned ref to their parent.
export function useFlipList({ enter = DEFAULT_ENTER } = {}) {
    const listRef = useRef(null);
    const positionsRef = useRef(null);
    const enterRef = useRef(enter);

    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list) {
            positionsRef.current = null;
            return;
        }
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const previous = positionsRef.current;
        const next = new Map();

        for (const item of list.children) {
            const key = item.dataset.flip;
            if (!key) continue;
            // offset* ignore transforms, so an item still mid-slide is measured where it will land
            const position = { left: item.offsetLeft, top: item.offsetTop };
            next.set(key, position);
            if (!previous || reduceMotion) continue;

            const before = previous.get(key);
            if (!before) {
                // start a beat late so neighbours have begun moving out of the way first
                item.animate(enterRef.current, { duration: 450, delay: 90, easing: EASE_OUT, fill: 'backwards' });
            } else if (before.left !== position.left || before.top !== position.top) {
                // a slight fade mid-way keeps items that pass each other from reading as a pile-up
                item.animate(
                    [
                        { transform: `translate(${before.left - position.left}px, ${before.top - position.top}px)`, opacity: 1 },
                        { opacity: 0.5, offset: 0.35 },
                        { transform: 'none', opacity: 1 },
                    ],
                    { duration: 650, easing: EASE_OUT },
                );
            }
        }
        positionsRef.current = next;
    });

    return listRef;
}

// While a collapsing section closes, keep showing the items it last had instead of letting
// them vanish before the height animation runs. Items are { key, label } pairs.
export function useHeldWhileClosed(items, open) {
    const signature = items.map((item) => `${item.key}:${item.label}`).join('|');
    const [held, setHeld] = useState({ signature, items });
    if (open && held.signature !== signature) {
        setHeld({ signature, items });
    }
    return open ? items : held.items;
}
