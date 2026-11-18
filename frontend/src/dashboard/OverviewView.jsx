import { useMemo, useState } from 'react';
import { ColumnChart, KpiTile, LegendSwatch, Meter, RankedBars, RollingNumber, SegmentedBar, Sparkline, Tile } from './charts';
import { SESSION_OPTIONS } from './api';
import { formatNumber, formatPercent, longMonth, niceTicks, shortMonth } from './format';
import { useFlipList } from './motion';

const PART_DARK = { color: 'var(--dark)', textColor: '#ffffff' };
const PART_LIGHT = { color: 'var(--bar)', textColor: 'var(--ink)' };
const ATTENDEE_PREVIEW = 8;

// Four earthy tones repeated down the list, in an order where neighbours always stay easy to tell apart.
const TOPIC_COLOR_CYCLE = ['#e0672c', '#2a64a4', '#6f7e33', '#d9ab48'];

function countOf(list, name) {
    return list.find((item) => item.name === name)?.count || 0;
}

function KpiStrip({ analytics, scopeLabel, isFiltered }) {
    const summary = analytics.summary;
    const months = analytics.attendance_by_month || [];
    const frequency = analytics.attendance_frequency || [];
    const returningStudents = countOf(frequency, '2-5 times') + countOf(frequency, 'More than 5 times');

    return (
        <section aria-label="Key numbers">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5 xl:gap-5">
                <KpiTile
                    className="col-span-2 md:col-span-1"
                    label={`Check-ins · ${scopeLabel}`}
                    value={formatNumber(summary.total_checkins)}
                    visual={
                        <Sparkline
                            values={months.map((item) => item.count)}
                            label={`Monthly check-ins, last ${months.length} months`}
                        />
                    }
                    foot={<>Trend · last {months.length} months</>}
                />
                <KpiTile
                    label="Unique students"
                    value={formatNumber(summary.total_students)}
                    foot={
                        <>
                            <span className="text-[var(--ink)]"><RollingNumber value={formatPercent(returningStudents, summary.total_students)} /></span> came back
                        </>
                    }
                />
                <KpiTile
                    label="Signed sessions"
                    value={formatNumber(summary.total_signed)}
                    visual={
                        <div className="mb-1.5 w-12 shrink-0 xl:w-16">
                            <Meter value={summary.total_signed} max={summary.total_checkins} label="Signed share of check-ins" />
                        </div>
                    }
                    foot={
                        <>
                            <span className="text-[var(--ink)]"><RollingNumber value={formatPercent(summary.total_signed, summary.total_checkins)} /></span> of check-ins
                        </>
                    }
                />
                <KpiTile
                    label="Food collected"
                    value={formatNumber(summary.total_food_collected)}
                    visual={
                        <div className="mb-1.5 w-12 shrink-0 xl:w-16">
                            <Meter value={summary.total_food_collected} max={summary.total_checkins} label="Food share of check-ins" />
                        </div>
                    }
                    foot={
                        <>
                            <span className="text-[var(--ink)]"><RollingNumber value={formatPercent(summary.total_food_collected, summary.total_checkins)} /></span> of check-ins
                        </>
                    }
                />
                <KpiTile
                    label="Hoodies collected"
                    value={formatNumber(summary.total_hoodies_collected)}
                    foot={<>{isFiltered ? 'By students in this view' : 'All students, all time'}</>}
                />
            </div>
        </section>
    );
}

function MonthTile({ months, selectedMonths, onChangeMonths, currentMonth }) {
    const [anchorMonth, setAnchorMonth] = useState(null);
    const monthKeys = useMemo(() => months.map((item) => item.month), [months]);
    const total = months.reduce((sum, item) => sum + item.count, 0);
    const ticks = niceTicks(Math.max(...months.map((item) => item.count), 1), 4);
    const busiest = months.reduce((best, item) => (!best || item.count > best.count ? item : best), null);
    const hasPartial = monthKeys.includes(currentMonth);

    const handleColumnClick = (event, month) => {
        // shift-click extends the selection from the last clicked month to this one
        const anchorIndex = monthKeys.indexOf(anchorMonth);
        if (event.shiftKey && anchorIndex !== -1) {
            const clickedIndex = monthKeys.indexOf(month);
            const range = monthKeys.slice(Math.min(anchorIndex, clickedIndex), Math.max(anchorIndex, clickedIndex) + 1);
            onChangeMonths([...new Set([...selectedMonths, ...range])].sort());
            return;
        }
        setAnchorMonth(month);
        onChangeMonths(
            selectedMonths.includes(month)
                ? selectedMonths.filter((value) => value !== month)
                : [...selectedMonths, month].sort(),
        );
    };

    return (
        <Tile
            title="Check-ins by month"
            meta={
                busiest
                    ? `Busiest · ${shortMonth(busiest.month)} ${busiest.month.slice(0, 4)} · ${formatNumber(busiest.count)} · last ${months.length} months`
                    : 'No check-ins yet'
            }
            actions={
                <>
                    <div className="dash-label mr-1 hidden items-center gap-3 sm:flex" aria-hidden="true">
                        <span className="flex items-center gap-1.5">
                            <LegendSwatch className="bg-[var(--bar)]" /> Check-ins
                        </span>
                        <span className="flex items-center gap-1.5">
                            <LegendSwatch className="bg-[var(--accent)]" /> Selected
                        </span>
                        {hasPartial && (
                            <span className="flex items-center gap-1.5">
                                <LegendSwatch className="dash-hatch" /> To date
                            </span>
                        )}
                    </div>
                    <div className="dash-seg dash-mono text-[11px] uppercase tracking-wider">
                        <button
                            type="button"
                            onClick={() => {
                                setAnchorMonth(null);
                                onChangeMonths([...monthKeys].sort());
                            }}
                        >
                            Select all
                        </button>
                        <button
                            type="button"
                            disabled={selectedMonths.length === 0}
                            className="disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() => {
                                setAnchorMonth(null);
                                onChangeMonths([]);
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </>
            }
        >
            {months.length === 0 ? (
                <p className="py-16 text-center text-sm text-[var(--ink-3)]">No check-ins recorded yet.</p>
            ) : (
                <>
                    <ColumnChart
                        items={months.map((item) => ({ key: item.month, label: shortMonth(item.month), value: item.count }))}
                        ticks={ticks}
                        height={210}
                        selectedKeys={selectedMonths}
                        partialKey={currentMonth}
                        onColumnClick={handleColumnClick}
                        columnLabel={(item) =>
                            `${longMonth(item.key)}: ${formatNumber(item.value)} check-ins${item.key === currentMonth ? ' so far' : ''}`
                        }
                        renderTooltip={(item) => {
                            const isSelected = selectedMonths.includes(item.key);
                            return (
                                <>
                                    <p className="dash-label">
                                        {longMonth(item.key)}
                                        {item.key === currentMonth ? ' · to date' : ''}
                                    </p>
                                    <p className="dash-mono mt-0.5 text-lg font-medium leading-tight text-[var(--ink)]">
                                        {formatNumber(item.value)}
                                        <span className="ml-1 text-xs font-normal text-[var(--ink-3)]">check-ins</span>
                                    </p>
                                    <p className="text-xs text-[var(--ink-2)]">{formatPercent(item.value, total, 1)} of the last {months.length} months</p>
                                    <p className="mt-1.5 border-t border-[var(--line)] pt-1.5 text-[11px] text-[var(--ink-3)]">
                                        {isSelected ? 'Click to remove' : 'Click to add'} · Shift-click for a range
                                    </p>
                                </>
                            );
                        }}
                    />
                    <p className="dash-label mt-4">
                        {selectedMonths.length === 0
                            ? 'Showing all months · click months to combine them, shift-click for a range'
                            : `${selectedMonths.length} month${selectedMonths.length > 1 ? 's' : ''} selected · the whole board follows this selection`}
                    </p>
                </>
            )}
        </Tile>
    );
}

function RegularsTile({ analytics, scopeLabel }) {
    const [showAll, setShowAll] = useState(false);
    const attendees = analytics.top_attendees || [];
    const frequency = [
        { key: 'once', label: 'Once', value: countOf(analytics.attendance_frequency || [], 'Once') },
        { key: 'some', label: '2–5×', value: countOf(analytics.attendance_frequency || [], '2-5 times') },
        { key: 'many', label: '6+×', value: countOf(analytics.attendance_frequency || [], 'More than 5 times') },
    ];
    const maxFrequency = Math.max(...frequency.map((item) => item.value), 1);
    const visibleAttendees = showAll ? attendees : attendees.slice(0, ATTENDEE_PREVIEW);
    const attendeeListRef = useFlipList();

    return (
        <Tile title="Regulars" meta={`Students · ${scopeLabel}`}>
            <div className="flex items-baseline justify-between">
                <p className="dash-label">Visit frequency</p>
                <p className="dash-label">Students</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-[2px]" role="img" aria-label={frequency.map((item) => `${item.label}: ${item.value} students`).join(', ')}>
                {frequency.map((item) => (
                    <div key={item.key} className="flex flex-col items-center">
                        <div className="flex h-16 w-full items-end px-2">
                            <div className="w-full">
                                <p className="dash-mono dash-tnum mb-1 text-center text-[11px] text-[var(--ink-2)]"><RollingNumber value={formatNumber(item.value)} /></p>
                                <div
                                    className={`dash-col-bar w-full rounded-t-[3px] transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${item.key === 'many' ? 'bg-[var(--dark)]' : 'bg-[var(--bar)]'}`}
                                    style={{ height: `${Math.max((item.value / maxFrequency) * 44, item.value > 0 ? 2 : 0)}px` }}
                                />
                            </div>
                        </div>
                        <p className="dash-mono mt-1.5 text-[11px] uppercase tracking-wider text-[var(--ink-3)]">{item.label}</p>
                    </div>
                ))}
            </div>

            <div className="mt-5 flex items-baseline justify-between border-t border-[var(--line)] pt-4">
                <p className="dash-label">Top attendees</p>
                <p className="dash-label">Sessions</p>
            </div>

            {attendees.length === 0 ? (
                <p className="py-6 text-sm text-[var(--ink-3)]">No attendees in this view.</p>
            ) : (
                <ol ref={attendeeListRef} className="relative mt-1">
                    {visibleAttendees.map((person, index) => (
                        <li key={person.zid} data-flip={person.zid} className="flex items-center gap-3 border-b border-[var(--line)] py-2.5 last:border-b-0">
                            <span className="dash-mono dash-tnum w-5 shrink-0 text-xs text-[var(--ink-3)]">{String(index + 1).padStart(2, '0')}</span>
                            <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink)]">{person.name}</span>
                            <span className="dash-mono hidden shrink-0 text-xs text-[var(--ink-3)] min-[400px]:inline">{person.zid}</span>
                            <span className="dash-mono dash-tnum w-11 shrink-0 rounded-md border border-[var(--line-strong)] py-0.5 text-center text-xs text-[var(--ink)]">
                                <RollingNumber value={person.sessions} />
                            </span>
                        </li>
                    ))}
                </ol>
            )}

            {attendees.length > ATTENDEE_PREVIEW && (
                <button
                    type="button"
                    onClick={() => setShowAll((value) => !value)}
                    className="dash-btn dash-mono mt-3 w-full py-1.5 text-[11px] uppercase tracking-wider"
                >
                    {showAll ? 'Show fewer' : `Show all ${attendees.length}`}
                </button>
            )}
        </Tile>
    );
}

function ProgramsTile({ programs, activeProgram, onToggleProgram }) {
    const total = programs.reduce((sum, item) => sum + item.count, 0);
    const maxCount = Math.max(...programs.map((item) => item.count), 1);
    const hasActive = activeProgram !== null;
    const columns = 'grid grid-cols-[minmax(0,1.4fr)_4.5rem_minmax(0,1fr)_3.5rem] items-center gap-x-4';
    const programListRef = useFlipList();

    return (
        <Tile title="Programs" meta={`${programs.length} programs · click a name to filter the board`}>
            <div className={`${columns} dash-label border-b border-[var(--line)] px-2 pb-2`}>
                <span>Program</span>
                <span className="text-right">Check-ins</span>
                <span>Share</span>
                <span className="text-right">%</span>
            </div>

            {programs.length === 0 ? (
                <p className="py-6 text-sm text-[var(--ink-3)]">No check-ins in this view.</p>
            ) : (
                <ul ref={programListRef} className="relative">
                    {programs.map((item) => {
                        const isActive = activeProgram === item.name;
                        return (
                            <li key={item.name} data-flip={item.name} className="border-b border-[var(--line)]">
                                <button
                                    type="button"
                                    onClick={() => onToggleProgram(item.name)}
                                    aria-pressed={isActive}
                                    className={`${columns} w-full rounded-md px-2 py-3 text-left text-sm transition-colors hover:bg-[var(--tile-hover)] ${isActive ? 'bg-[var(--accent-soft)]' : ''}`}
                                >
                                    <span className="flex min-w-0 items-center gap-2.5">
                                        <span
                                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? 'bg-[var(--accent)]' : 'bg-[var(--bar-hover)]'}`}
                                            aria-hidden="true"
                                        />
                                        <span className={`truncate text-[var(--ink)] ${isActive ? 'font-medium' : ''}`} title={item.name}>{item.name}</span>
                                    </span>
                                    <span className="dash-mono dash-tnum text-right text-sm text-[var(--ink)]"><RollingNumber value={formatNumber(item.count)} /></span>
                                    <span className="h-1.5 rounded-full bg-[var(--track)]">
                                        <span
                                            className={`dash-grow-x block h-full rounded-full transition-[width,background-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isActive ? 'bg-[var(--accent)]' : hasActive ? 'bg-[var(--bar)]' : 'bg-[var(--dark)]'}`}
                                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                                        />
                                    </span>
                                    <span className="dash-mono dash-tnum text-right text-xs text-[var(--ink-2)]"><RollingNumber value={formatPercent(item.count, total, 1)} /></span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <div className={`${columns} px-2 pt-3 text-sm font-medium`}>
                <span>All programs</span>
                <span className="dash-mono dash-tnum text-right text-sm"><RollingNumber value={formatNumber(total)} /></span>
                <span />
                <span className="dash-mono text-right text-xs text-[var(--ink-2)]">100%</span>
            </div>
        </Tile>
    );
}

function BreakdownTile({ analytics, timeInADay, onToggleTime, scopeLabel }) {
    const sessions = analytics.session_checkins || [];
    const venues = analytics.venue_checkins || [];

    return (
        <Tile title="Breakdown" meta={scopeLabel} className="h-full">
            {/* side by side while the tile spans the whole row, stacked once it sits in its own column */}
            <div className="grid gap-x-8 lg:grid-cols-2 xl:grid-cols-1">
                <div>
                    <p className="dash-label mb-2.5">By session · click to filter</p>
                    <SegmentedBar
                        label="Check-ins by session"
                        activeKey={timeInADay}
                        onPartClick={onToggleTime}
                        parts={SESSION_OPTIONS.map((option, index) => ({
                            key: option.key,
                            name: option.name,
                            value: countOf(sessions, option.apiName),
                            ...(index === 0 ? PART_DARK : PART_LIGHT),
                        }))}
                    />
                </div>

                <div className="mt-6 border-t border-[var(--line)] pt-5 lg:mt-0 lg:border-t-0 lg:pt-0 xl:mt-6 xl:border-t xl:pt-5">
                    <p className="dash-label mb-2.5">By venue</p>
                    <SegmentedBar
                        label="Check-ins by venue"
                        parts={[
                            { key: 'blockhouse', name: 'Blockhouse', value: countOf(venues, 'Blockhouse'), ...PART_DARK },
                            { key: 'l5', name: 'L5', value: countOf(venues, 'L5'), ...PART_LIGHT },
                        ]}
                    />
                    <p className="mt-2 px-2 text-xs leading-relaxed text-[var(--ink-3)]">
                        Venue comes from the session timetable: Blockhouse on Mon &amp; Thu afternoons, L5 for the rest.
                    </p>
                </div>
            </div>
        </Tile>
    );
}

export default function OverviewView({
    analytics,
    scopeLabel,
    isFiltered,
    currentMonth,
    selectedMonths,
    onChangeMonths,
    timeInADay,
    onToggleTime,
    program,
    onToggleProgram,
    helpTopic,
    onToggleTopic,
}) {
    const topics = (analytics.help_topics || []).map((item, index) => ({
        key: item.name,
        label: item.name,
        value: item.count,
        color: TOPIC_COLOR_CYCLE[index % TOPIC_COLOR_CYCLE.length],
    }));

    return (
        <div className="space-y-5">
            <KpiStrip analytics={analytics} scopeLabel={scopeLabel} isFiltered={isFiltered} />

            <div className="grid gap-5 xl:grid-cols-[minmax(0,2.15fr)_minmax(0,1fr)]">
                <MonthTile
                    months={analytics.attendance_by_month || []}
                    selectedMonths={selectedMonths}
                    onChangeMonths={onChangeMonths}
                    currentMonth={currentMonth}
                />
                <RegularsTile analytics={analytics} scopeLabel={scopeLabel} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
                <ProgramsTile
                    programs={analytics.attendance_by_program || []}
                    activeProgram={program}
                    onToggleProgram={onToggleProgram}
                />
                <Tile title="Help topics" meta="Picked at check-in · click to filter">
                    <RankedBars items={topics} activeKey={helpTopic} onItemClick={onToggleTopic} labelWidth="w-40" />
                </Tile>
                <div className="lg:col-span-2 xl:col-span-1">
                    <BreakdownTile analytics={analytics} timeInADay={timeInADay} onToggleTime={onToggleTime} scopeLabel={scopeLabel} />
                </div>
            </div>
        </div>
    );
}
