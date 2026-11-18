import { useState } from 'react';
import { formatCompact, formatNumber, formatPercent } from './format';
import { useFlipList } from './motion';

const SURFACE = '#f3f1ed';
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Shows a formatted number whose digits roll to their new values when it changes.
// Reels are keyed from the right, so the ones column stays the ones column as the number grows.
export function RollingNumber({ value }) {
    const text = String(value);
    const chars = [...text];

    return (
        <span className="dash-roll">
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">
                {chars.map((char, index) => {
                    const fromRight = chars.length - 1 - index;
                    if (char < '0' || char > '9') return <span key={`c${fromRight}`}>{char}</span>;
                    return (
                        <span key={`d${fromRight}`} className="dash-roll-reel">
                            <span
                                className="dash-roll-strip"
                                style={{ transform: `translateY(${-Number(char) * 10}%)`, transitionDelay: `${fromRight * 35}ms` }}
                            >
                                {DIGITS.map((digit) => (
                                    <span key={digit}>{digit}</span>
                                ))}
                            </span>
                        </span>
                    );
                })}
            </span>
        </span>
    );
}

export function Sparkline({ values, width = 60, height = 28, label }) {
    if (values.length < 2) return null;

    const pad = 5;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const x = (index) => pad + (index * (width - pad * 2)) / (values.length - 1);
    const y = (value) => (max === min ? height / 2 : pad + (1 - (value - min) / (max - min)) * (height - pad * 2));
    const points = values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
    const lastIndex = values.length - 1;

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="shrink-0 overflow-visible"
            role="img"
            aria-label={label}
        >
            <polyline
                className="dash-spark-line"
                pathLength="1"
                strokeDasharray="1"
                points={points}
                fill="none"
                stroke="var(--ink-2)"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            <circle cx={x(lastIndex)} cy={y(values[lastIndex])} r="3.5" fill="var(--accent)" stroke={SURFACE} strokeWidth="2" />
        </svg>
    );
}

export function Meter({ value, max, label }) {
    const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--track)]"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-label={label}
        >
            <div className="dash-grow-x h-full rounded-full bg-[var(--accent)] transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ width: `${percent}%` }} />
        </div>
    );
}

function tooltipPosition(index, count) {
    if (index <= 1) return 'left-0';
    if (index >= count - 2) return 'right-0';
    return 'left-1/2 -translate-x-1/2';
}

// Vertical columns on one shared baseline. Columns are buttons when onColumnClick is given,
// and every column shows the same tooltip on hover and keyboard focus.
export function ColumnChart({
    items,
    ticks,
    height = 240,
    selectedKeys = [],
    partialKey = null,
    onColumnClick,
    renderTooltip,
    formatValue = formatNumber,
    formatTick = formatCompact,
    columnLabel,
}) {
    const [activeKey, setActiveKey] = useState(null);
    const top = ticks[ticks.length - 1] || 1;
    const hasSelection = selectedKeys.length > 0;

    return (
        // the plot grows to fill its tile; height is the minimum
        <div className="flex flex-1 flex-col pt-6">
            <div className="flex flex-1" style={{ minHeight: height }}>
                <div className="relative w-8 shrink-0" aria-hidden="true">
                    {ticks.map((tick) => (
                        <span
                            key={tick}
                            className="dash-mono dash-tnum absolute right-2 translate-y-1/2 text-[11px] text-[var(--ink-3)]"
                            style={{ bottom: `${(tick / top) * 100}%` }}
                        >
                            {formatTick(tick)}
                        </span>
                    ))}
                </div>

                <div className="relative min-w-0 flex-1">
                    {ticks.map((tick) => (
                        <div
                            key={tick}
                            aria-hidden="true"
                            className={`absolute inset-x-0 h-px ${tick === 0 ? 'bg-[var(--line-strong)]' : 'bg-[var(--line)]'}`}
                            style={{ bottom: `${(tick / top) * 100}%` }}
                        />
                    ))}

                    <div className="absolute inset-0 flex items-end">
                        {items.map((item, index) => {
                            const isSelected = selectedKeys.includes(item.key);
                            const isPartial = item.key === partialKey;
                            const isActive = activeKey === item.key;
                            const percent = Math.min((item.value / top) * 100, 100);

                            let fill = 'bg-[var(--bar)] group-hover:bg-[var(--bar-hover)]';
                            if (isSelected && isPartial) fill = 'dash-hatch-accent';
                            else if (isSelected) fill = 'bg-[var(--accent)]';
                            else if (isPartial) fill = 'dash-hatch';
                            else if (hasSelection) fill = 'bg-[var(--bar-muted)] group-hover:bg-[var(--bar)]';

                            const valueTone = isSelected
                                ? 'text-[var(--ink)]'
                                : hasSelection
                                    ? 'text-[var(--ink-3)]'
                                    : 'text-[var(--ink-2)]';

                            const Column = onColumnClick ? 'button' : 'div';

                            return (
                                <div key={item.key} className="relative flex h-full min-w-0 flex-1 justify-center px-[3px] sm:px-2">
                                    <Column
                                        {...(onColumnClick
                                            ? {
                                                type: 'button',
                                                onClick: (event) => onColumnClick(event, item.key),
                                                'aria-pressed': isSelected,
                                            }
                                            : { tabIndex: 0 })}
                                        aria-label={columnLabel?.(item)}
                                        onMouseEnter={() => setActiveKey(item.key)}
                                        onMouseLeave={() => setActiveKey(null)}
                                        onFocus={() => setActiveKey(item.key)}
                                        onBlur={() => setActiveKey(null)}
                                        className={`group flex h-full w-full max-w-[56px] flex-col items-center justify-end ${onColumnClick ? 'cursor-pointer' : 'cursor-default'}`}
                                    >
                                        <span className={`dash-mono dash-tnum mb-1.5 text-[10px] sm:text-[11px] ${valueTone}`}>
                                            <RollingNumber value={formatValue(item.value)} />
                                        </span>
                                        <span
                                            className={`dash-col-bar block w-full rounded-t-[3px] transition-[height,background-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${fill}`}
                                            style={{ height: `${percent}%`, minHeight: item.value > 0 ? 2 : 0 }}
                                        />
                                    </Column>

                                    {isActive && renderTooltip && (
                                        <div
                                            role="tooltip"
                                            className={`dash-fade-in pointer-events-none absolute z-20 w-max min-w-36 max-w-52 rounded-lg border border-[var(--line)] bg-white/95 px-3 py-2 shadow-lg ${tooltipPosition(index, items.length)}`}
                                            style={{ bottom: `calc(${percent}% + 30px)` }}
                                        >
                                            {renderTooltip(item)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex pl-8 pt-2" aria-hidden="true">
                {items.map((item) => {
                    const isSelected = selectedKeys.includes(item.key);
                    return (
                        <div
                            key={item.key}
                            className={`dash-mono min-w-0 flex-1 truncate text-center text-[10px] uppercase sm:text-[11px] sm:tracking-wider ${isSelected ? 'font-semibold text-[var(--ink)]' : 'text-[var(--ink-3)]'}`}
                        >
                            {item.label}
                            {item.key === partialKey ? '*' : ''}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// One whole split into parts, with a legend underneath. Parts become filters when onPartClick is given.
export function SegmentedBar({ parts, activeKey = null, onPartClick, unit = 'check-ins', label }) {
    const total = parts.reduce((sum, part) => sum + part.value, 0);
    const visibleParts = parts.filter((part) => part.value > 0);
    const hasActive = activeKey !== null;

    return (
        <div>
            {total === 0 ? (
                <div className="flex h-7 items-center rounded bg-[var(--track)] px-2 text-xs text-[var(--ink-3)]">No {unit} yet</div>
            ) : (
                <div className="flex h-7 w-full gap-[2px]" role="img" aria-label={`${label}: ${parts.map((part) => `${part.name} ${part.value}`).join(', ')}`}>
                    {visibleParts.map((part) => {
                        const share = part.value / total;
                        const dimmed = hasActive && activeKey !== part.key;
                        return (
                            <div
                                key={part.key}
                                title={`${part.name}: ${formatNumber(part.value)} ${unit} (${formatPercent(part.value, total)})`}
                                className="flex h-full min-w-[4px] items-center overflow-hidden rounded px-2 transition-[width,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                                style={{ width: `${share * 100}%`, background: part.color, opacity: dimmed ? 0.3 : 1 }}
                            >
                                {share >= 0.14 && (
                                    <span className="dash-mono dash-tnum text-[11px] font-medium" style={{ color: part.textColor }}>
                                        <RollingNumber value={formatPercent(part.value, total)} />
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <ul className="mt-3 space-y-1">
                {parts.map((part) => {
                    const isActive = activeKey === part.key;
                    const content = (
                        <>
                            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: part.color }} aria-hidden="true" />
                            <span className={`min-w-0 flex-1 truncate text-left ${isActive ? 'font-medium text-[var(--ink)]' : 'text-[var(--ink-2)]'}`}>
                                {part.name}
                            </span>
                            <span className="dash-mono dash-tnum text-xs text-[var(--ink)]"><RollingNumber value={formatNumber(part.value)} /></span>
                            <span className="dash-mono dash-tnum w-11 text-right text-xs text-[var(--ink-3)]"><RollingNumber value={formatPercent(part.value, total)} /></span>
                        </>
                    );

                    return (
                        <li key={part.key}>
                            {onPartClick ? (
                                <button
                                    type="button"
                                    onClick={() => onPartClick(part.key)}
                                    aria-pressed={isActive}
                                    className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--tile-hover)] ${isActive ? 'bg-[var(--accent-soft)]' : ''}`}
                                >
                                    {content}
                                </button>
                            ) : (
                                <div className="flex items-center gap-2.5 px-2 py-1.5 text-sm">{content}</div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

// A ranked list of horizontal bars. Rows become filters when onItemClick is given.
export function RankedBars({ items, activeKey = null, onItemClick, emptyText = 'No data for this view.', labelWidth = 'w-32' }) {
    const maxValue = Math.max(...items.map((item) => item.value), 1);
    const hasActive = activeKey !== null;
    const listRef = useFlipList();

    if (items.length === 0) {
        return <p className="py-6 text-sm text-[var(--ink-3)]">{emptyText}</p>;
    }

    return (
        <ul ref={listRef} className="relative space-y-0.5">
            {items.map((item) => {
                const isActive = activeKey === item.key;
                // rows with their own colour keep it when filtered; the rest fade so the active row stands out
                const hasColor = Boolean(item.color);
                const fill = hasColor ? '' : isActive ? 'bg-[var(--accent)]' : hasActive ? 'bg-[var(--bar)]' : 'bg-[var(--dark)]';
                const colorStyle = hasColor ? { background: item.color, opacity: hasActive && !isActive ? 0.3 : 1 } : {};
                const content = (
                    <>
                        <span className={`${labelWidth} flex shrink-0 items-center gap-2 truncate text-left ${isActive ? 'font-medium text-[var(--ink)]' : 'text-[var(--ink-2)]'}`}>
                            {hasColor && (
                                <span
                                    className="h-2 w-2 shrink-0 rounded-full transition-[opacity,background-color] duration-500"
                                    style={colorStyle}
                                    aria-hidden="true"
                                />
                            )}
                            <span className="truncate">{item.label}</span>
                        </span>
                        <span className={`${hasColor ? 'h-2' : 'h-1.5'} min-w-0 flex-1 rounded-full bg-[var(--track)]`}>
                            <span
                                className={`dash-grow-x block h-full rounded-full transition-[width,opacity,background-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${fill}`}
                                style={{ width: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 2 : 0)}%`, ...colorStyle }}
                            />
                        </span>
                        <span className="dash-mono dash-tnum w-12 shrink-0 text-right text-xs text-[var(--ink)]"><RollingNumber value={formatNumber(item.value)} /></span>
                        {item.meta !== undefined && (
                            <span className="dash-mono dash-tnum w-12 shrink-0 text-right text-xs text-[var(--ink-3)]">{typeof item.meta === 'string' ? <RollingNumber value={item.meta} /> : item.meta}</span>
                        )}
                    </>
                );

                return (
                    <li key={item.key} data-flip={String(item.key)}>
                        {onItemClick ? (
                            <button
                                type="button"
                                onClick={() => onItemClick(item.key)}
                                aria-pressed={isActive}
                                className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-[var(--tile-hover)] ${isActive ? 'bg-[var(--accent-soft)]' : ''}`}
                            >
                                {content}
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 px-2 py-2 text-sm">{content}</div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

// Opens and closes by height so whatever sits below glides instead of jumping.
// Closed content is inert, so it can't be tabbed into while hidden.
export function Collapse({ open, children, className = '', label }) {
    return (
        <div className="dash-collapse" data-open={open} inert={!open}>
            <div className="dash-collapse-inner">
                <div className={className} aria-label={label}>
                    {children}
                </div>
            </div>
        </div>
    );
}

// A key number with its label, an optional small visual (trend line, meter) and a foot line.
export function KpiTile({ label, value, suffix, visual, foot, className = '' }) {
    return (
        <div className={`dash-tile flex min-w-0 flex-col justify-between gap-4 p-4 xl:p-5 ${className}`}>
            <p className="dash-label truncate">{label}</p>
            <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-2">
                <p className="dash-mono whitespace-nowrap text-[24px] font-medium leading-none tracking-[-0.03em] text-[var(--ink)] xl:text-[28px]">
                    <RollingNumber value={value} />
                    {suffix && <span className="ml-1.5 text-base font-normal tracking-normal text-[var(--ink-3)]">{suffix}</span>}
                </p>
                {visual}
            </div>
            <p className="dash-label min-h-4 truncate text-[var(--ink-2)]">{foot}</p>
        </div>
    );
}

export function Tile({ title, meta, actions, children, className = '' }) {
    return (
        <section className={`dash-tile flex min-w-0 flex-col p-5 xl:p-6 ${className}`}>
            {(title || meta || actions) && (
                <header className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0">
                        {title && <h2 className="text-[15px] font-medium tracking-[-0.01em] text-[var(--ink)]">{title}</h2>}
                        {meta && <p className="dash-label mt-1">{meta}</p>}
                    </div>
                    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
                </header>
            )}
            {children}
        </section>
    );
}

export function LegendSwatch({ className = '', style }) {
    return <span className={`inline-block h-2.5 w-2.5 rounded-[3px] ${className}`} style={style} aria-hidden="true" />;
}
