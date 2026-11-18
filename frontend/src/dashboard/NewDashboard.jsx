import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SESSION_OPTIONS, fetchAdminJson, isAbortError } from './api';
import Backdrop from './Backdrop';
import { Collapse } from './charts';
import FeedbackView from './FeedbackView';
import IntroSequence from './IntroSequence';
import OverviewView from './OverviewView';
import { addMonths, currentSydneyMonth, formatClock, formatNumber, longMonth } from './format';
import { useFlipList, useHeldWhileClosed } from './motion';
import './dashboard.css';

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap';
const AUTO_REFRESH_MS = 60_000;

// the opening sequence plays once per page load, not when switching back from the classic view
let introPlayed = false;

const PRESETS = [
    { key: 'all', label: 'All', scope: 'All time' },
    { key: 'month', label: 'This month', scope: 'This month' },
    { key: 'quarter', label: '3 mo', scope: 'Last 3 months' },
    { key: 'ytd', label: 'YTD', scope: 'Year to date' },
];

function presetMonths(preset, currentMonth) {
    if (preset === 'month') return [currentMonth];
    if (preset === 'quarter') return [addMonths(currentMonth, -2), addMonths(currentMonth, -1), currentMonth];
    if (preset === 'ytd') {
        const monthNumber = Number(currentMonth.slice(5));
        return Array.from({ length: monthNumber }, (_, index) => `${currentMonth.slice(0, 4)}-${String(index + 1).padStart(2, '0')}`);
    }
    return [];
}

function sameMonths(left, right) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}

function describeMonths(selectedMonths) {
    if (selectedMonths.length === 1) return longMonth(selectedMonths[0]);
    if (selectedMonths.length <= 3) return selectedMonths.map(longMonth).join(' + ');
    return `${selectedMonths.length} months (${longMonth(selectedMonths[0])} – ${longMonth(selectedMonths[selectedMonths.length - 1])})`;
}

function initialTab() {
    return typeof window !== 'undefined' && window.location.hash === '#feedback' ? 'feedback' : 'overview';
}

function useAnalytics({ months, timeInADay, program, helpTopic, refreshTick }) {
    const paramsKey = `${months}|${timeInADay || ''}|${program || ''}|${helpTopic || ''}`;
    const requestKey = `${paramsKey}|${refreshTick}`;
    const [result, setResult] = useState({ key: null, paramsKey: null, data: null, error: null, updatedAt: null });

    useEffect(() => {
        const controller = new AbortController();
        const loadedParamsKey = `${months}|${timeInADay || ''}|${program || ''}|${helpTopic || ''}`;
        const key = `${loadedParamsKey}|${refreshTick}`;
        fetchAdminJson('/admin/analytics', { month: months, timeInADay, program, helpTopic }, controller.signal)
            .then((data) => setResult({ key, paramsKey: loadedParamsKey, data, error: null, updatedAt: new Date() }))
            .catch((error) => {
                if (isAbortError(error)) return;
                // keep the last good data on screen, still dimmed as belonging to the old filters,
                // and report the failure next to it
                setResult((previous) => ({ ...previous, key, error }));
            });
        return () => controller.abort();
    }, [months, timeInADay, program, helpTopic, refreshTick]);

    return {
        ...result,
        isLoading: result.key !== requestKey,
        // a filter change dims the board; a background refresh of the same view does not
        isChangingView: result.paramsKey !== paramsKey,
    };
}

const CHIP_ENTER = [
    { opacity: 0, transform: 'scale(0.88)' },
    { opacity: 1, transform: 'none' },
];

// the signed-in admin's own name, for the greeting and the header; null when unknown
function useAdminName() {
    const [admin, setAdmin] = useState({ loaded: false, name: null });

    useEffect(() => {
        const controller = new AbortController();
        fetchAdminJson('/admin/me', {}, controller.signal)
            .then((data) => setAdmin({ loaded: true, name: (data?.name || '').trim() || null }))
            .catch((error) => {
                if (!isAbortError(error)) setAdmin({ loaded: true, name: null });
            });
        return () => controller.abort();
    }, []);

    return admin;
}

function FilterChip({ children, onRemove, flipKey }) {
    return (
        <span
            data-flip={flipKey}
            className="flex items-center gap-1 rounded-lg border border-[var(--line-strong)] bg-white/55 py-0.5 pl-2.5 pr-1 text-sm text-[var(--ink)]"
        >
            {children}
            <button
                type="button"
                onClick={onRemove}
                className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--ink-3)] hover:bg-white hover:text-[var(--ink)]"
                aria-label={`Remove filter: ${typeof children === 'string' ? children : ''}`}
            >
                ×
            </button>
        </span>
    );
}

function ErrorPanel({ error, onRetry }) {
    return (
        <div className="dash-tile mx-auto mt-10 max-w-md p-6 text-center">
            <p className="text-[17px] font-medium">Couldn’t load the dashboard</p>
            <p className="mt-2 text-sm text-[var(--ink-2)]">{error.message}</p>
            <div className="mt-5 flex justify-center gap-2">
                {error.status === 401 || error.status === 403 ? (
                    <Link to="/admin/login" className="dash-btn px-3 py-1.5 text-sm">
                        Go to admin login
                    </Link>
                ) : null}
                <button type="button" onClick={onRetry} className="dash-btn px-3 py-1.5 text-sm">
                    Try again
                </button>
            </div>
        </div>
    );
}

export default function NewDashboard() {
    const [currentMonth] = useState(currentSydneyMonth);
    const rootRef = useRef(null);
    const brandMarkRef = useRef(null);
    const [showIntro, setShowIntro] = useState(() => !introPlayed);
    const admin = useAdminName();
    const [tab, setTab] = useState(initialTab);
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [presetChoice, setPresetChoice] = useState('all');
    const [timeInADay, setTimeInADay] = useState(null);
    const [program, setProgram] = useState(null);
    const [helpTopic, setHelpTopic] = useState(null);
    const [selectedRating, setSelectedRating] = useState(null);
    const [onlyWithComments, setOnlyWithComments] = useState(false);
    const [manualTick, setManualTick] = useState(0);
    const [autoTick, setAutoTick] = useState(0);

    // the API takes one or more months as a comma separated list
    const months = selectedMonths.join(',');
    const analytics = useAnalytics({ months, timeInADay, program, helpTopic, refreshTick: manualTick + autoTick });

    useEffect(() => {
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') setAutoTick((value) => value + 1);
        }, AUTO_REFRESH_MS);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const { pathname, search } = window.location;
        window.history.replaceState(window.history.state, '', tab === 'feedback' ? `${pathname}${search}#feedback` : `${pathname}${search}`);
    }, [tab]);

    // prefer the preset that was clicked when several expand to the same months (YTD in January)
    const activePreset = sameMonths(presetMonths(presetChoice, currentMonth), selectedMonths)
        ? presetChoice
        : (PRESETS.find((preset) => sameMonths(presetMonths(preset.key, currentMonth), selectedMonths))?.key ?? 'custom');
    const sessionOption = SESSION_OPTIONS.find((option) => option.key === timeInADay);
    const monthScope =
        activePreset === 'custom'
            ? selectedMonths.length === 1
                ? longMonth(selectedMonths[0])
                : `${selectedMonths.length} months`
            : PRESETS.find((preset) => preset.key === activePreset).scope;
    const scopeLabel = sessionOption ? `${monthScope} · ${sessionOption.key}` : monthScope;
    const isFiltered = selectedMonths.length > 0 || Boolean(timeInADay || program || helpTopic);

    const toggle = (setter) => (value) => setter((current) => (current === value ? null : value));
    const clearAll = () => {
        setSelectedMonths([]);
        setTimeInADay(null);
        setProgram(null);
        setHelpTopic(null);
        setSelectedRating(null);
    };

    const ignoredFeedbackFilters = [program && 'program', helpTopic && 'help topic'].filter(Boolean);

    // the filter row keeps its last chips while it folds away, and chips slide as others come and go
    const filterChips = [
        selectedMonths.length > 0 && { key: 'months', label: describeMonths(selectedMonths) },
        sessionOption && { key: 'session', label: sessionOption.name },
        program && { key: 'program', label: program },
        helpTopic && { key: 'topic', label: `Topic: ${helpTopic}` },
    ].filter(Boolean);
    const shownChips = useHeldWhileClosed(filterChips, isFiltered);
    const chipListRef = useFlipList({ enter: CHIP_ENTER });
    const removeFilter = {
        months: () => setSelectedMonths([]),
        session: () => setTimeInADay(null),
        program: () => setProgram(null),
        topic: () => setHelpTopic(null),
    };
    const { data, error, updatedAt } = analytics;
    // the intro holds on the logo until the first answer (data or an error) is back
    const firstLoadDone = Boolean(data) || Boolean(error && !analytics.isLoading);

    useEffect(() => {
        introPlayed = true;
    }, []);

    return (
        <div ref={rootRef} className={showIntro ? 'dash z-[60]' : 'dash'}>
            <link rel="stylesheet" href={FONT_URL} precedence="default" />
            <Backdrop />

            <header className="dash-header z-30 md:sticky md:top-0">
                <div className="mx-auto flex w-full max-w-[1440px] px-4 sm:px-6 lg:px-[4vw] flex-wrap items-center gap-x-6 gap-y-3 py-4">
                    <div className="flex items-center gap-2.5">
                        <img ref={brandMarkRef} src="/studyClub.svg" alt="" width="28" height="28" className="h-7 w-7 shrink-0 rounded-[7px]" />
                        <h1 className="text-lg font-semibold tracking-[-0.035em]">Study Club</h1>
                        <span className="dash-label max-w-48 truncate" data-intro="header" title={admin.name || undefined}>
                            [ {admin.name || 'Admin'} ]
                        </span>
                    </div>

                    <nav className="dash-seg text-sm" role="tablist" aria-label="Dashboard sections" data-intro="header">
                        {[
                            { key: 'overview', label: 'Overview' },
                            { key: 'feedback', label: 'Feedback' },
                        ].map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                role="tab"
                                aria-selected={tab === item.key}
                                onClick={() => setTab(item.key)}
                                className="px-4!"
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="flex flex-1 flex-wrap items-center justify-end gap-x-3 gap-y-2" data-intro="header">
                        <div className="dash-seg dash-mono text-xs" role="group" aria-label="Date range">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.key}
                                    type="button"
                                    aria-pressed={activePreset === preset.key}
                                    onClick={() => {
                                        setPresetChoice(preset.key);
                                        setSelectedMonths(presetMonths(preset.key, currentMonth));
                                    }}
                                >
                                    {preset.label}
                                </button>
                            ))}
                            {activePreset === 'custom' && (
                                <button type="button" aria-pressed="true" title="Months picked on the chart" className="dash-pop-in">
                                    Custom
                                </button>
                            )}
                        </div>

                        <label className="flex items-center gap-2 rounded-[10px] border border-[var(--line-strong)] bg-white/40 py-1.5 pl-3 pr-2">
                            <span className="dash-label">Session</span>
                            <select
                                value={timeInADay || ''}
                                onChange={(event) => setTimeInADay(event.target.value || null)}
                                className="dash-select text-sm text-[var(--ink)] focus:outline-none"
                            >
                                <option value="">All sessions</option>
                                {SESSION_OPTIONS.map((option) => (
                                    <option key={option.key} value={option.key}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <button
                            type="button"
                            onClick={() => setManualTick((value) => value + 1)}
                            className="flex items-center gap-2 rounded-[10px] px-2 py-1.5 hover:bg-white/50"
                            title="Refresh now"
                        >
                            <span className={analytics.isLoading ? 'dash-live-dot' : 'h-[7px] w-[7px] rounded-full bg-[var(--accent)]'} aria-hidden="true" />
                            <span className="dash-mono text-xs uppercase tracking-wider text-[var(--ink)]">
                                {analytics.isLoading && data ? 'Updating' : `Updated ${formatClock(updatedAt)}`}
                            </span>
                            <span className="sr-only">, refresh now</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-[1340px] px-4 sm:px-6 lg:px-[4vw] pb-12 pt-5">
                <Collapse open={isFiltered} label="Active filters" className="pb-5 pt-1">
                    <div ref={chipListRef} className="relative flex flex-wrap items-center gap-2">
                        <span className="dash-label mr-1">Filtered to</span>
                        {shownChips.map((chip) => (
                            <FilterChip key={chip.key} flipKey={chip.key} onRemove={removeFilter[chip.key]}>
                                {chip.label}
                            </FilterChip>
                        ))}
                        <button
                            type="button"
                            data-flip="clear"
                            onClick={clearAll}
                            className="dash-mono ml-1 rounded-md px-2 py-1 text-xs uppercase tracking-wider text-[var(--ink-2)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
                        >
                            Clear all
                        </button>
                    </div>
                </Collapse>

                {tab === 'overview' && (
                    <>
                        {!data && error && !analytics.isLoading && <ErrorPanel error={error} onRetry={() => setManualTick((value) => value + 1)} />}
                        {!data && !error && (
                            <div className="dash-tile flex min-h-64 items-center justify-center">
                                <p className="dash-label">Loading analytics…</p>
                            </div>
                        )}
                        {data && (
                            <>
                                {error && (
                                    <div className="dash-tile mb-5 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm" role="alert">
                                        <span className="text-[var(--down)]">{error.message} Showing the last loaded numbers.</span>
                                        <button type="button" onClick={() => setManualTick((value) => value + 1)} className="dash-btn px-2.5 py-1 text-sm">
                                            Retry
                                        </button>
                                    </div>
                                )}
                                <div className={analytics.isChangingView ? 'dash-refreshing' : undefined} aria-busy={analytics.isLoading}>
                                    <OverviewView
                                        analytics={data}
                                        scopeLabel={scopeLabel}
                                        isFiltered={isFiltered}
                                        currentMonth={currentMonth}
                                        selectedMonths={selectedMonths}
                                        onChangeMonths={setSelectedMonths}
                                        timeInADay={timeInADay}
                                        onToggleTime={toggle(setTimeInADay)}
                                        program={program}
                                        onToggleProgram={toggle(setProgram)}
                                        helpTopic={helpTopic}
                                        onToggleTopic={toggle(setHelpTopic)}
                                    />
                                </div>
                            </>
                        )}
                    </>
                )}

                {tab === 'feedback' && (
                    <FeedbackView
                        months={months}
                        timeInADay={timeInADay}
                        selectedMonths={selectedMonths}
                        selectedRating={selectedRating}
                        onToggleRating={toggle(setSelectedRating)}
                        onlyWithComments={onlyWithComments}
                        onToggleOnlyWithComments={() => setOnlyWithComments((value) => !value)}
                        refreshTick={manualTick}
                        scopeLabel={scopeLabel}
                        ignoredFilters={ignoredFeedbackFilters}
                    />
                )}
            </main>

            <footer className="mx-auto flex w-full max-w-[1440px] px-4 sm:px-6 lg:px-[4vw] flex-wrap items-center justify-between gap-2 py-5 pl-12 sm:pl-12">
                <p className="dash-label">
                    [ Study Club ]{data ? ` · ${formatNumber(data.summary.total_checkins)} check-ins in view` : ''} · updated {formatClock(updatedAt)}
                </p>
                <p className="dash-label">Auto-refresh 60s</p>
            </footer>
            {showIntro && (
                <IntroSequence
                    ready={firstLoadDone}
                    greetingName={admin.name}
                    nameReady={admin.loaded}
                    brandMarkRef={brandMarkRef}
                    rootRef={rootRef}
                    onDone={() => setShowIntro(false)}
                />
            )}
        </div>
    );
}
