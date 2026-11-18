const integerFormat = new Intl.NumberFormat('en-US');

export function formatNumber(value) {
    return integerFormat.format(Number(value) || 0);
}

export function formatCompact(value) {
    if (value >= 1000) {
        const thousands = value / 1000;
        return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}k`;
    }
    return String(value);
}

export function formatPercent(part, whole, digits = 0) {
    if (!whole) return '0%';
    return `${((part / whole) * 100).toFixed(digits)}%`;
}

export function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthDate(value) {
    const [year, month] = value.split('-');
    return new Date(Number(year), Number(month) - 1, 1);
}

export function shortMonth(value) {
    return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(monthDate(value));
}

export function longMonth(value) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(monthDate(value));
}

export function addMonths(value, offset) {
    const date = monthDate(value);
    date.setMonth(date.getMonth() + offset);
    return monthKey(date);
}

export function formatClock(date) {
    if (!date) return '--:--';
    return new Intl.DateTimeFormat('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

export function formatDateTime(isoString) {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

// round tick steps to 1, 2, 2.5 or 5 times a power of ten so the axis reads cleanly
export function niceTicks(maxValue, targetCount = 3) {
    if (maxValue <= 0) return [0, 1];
    const rough = maxValue / targetCount;
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rough);
    const top = Math.ceil(maxValue / step) * step;
    const ticks = [];
    for (let value = 0; value <= top + step / 2; value += step) ticks.push(Math.round(value * 100) / 100);
    return ticks;
}
