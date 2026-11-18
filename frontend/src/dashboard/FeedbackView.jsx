import { useEffect, useState } from 'react';
import { fetchAdminJson, isAbortError } from './api';
import { Collapse, ColumnChart, Meter, RankedBars, RollingNumber, Tile } from './charts';
import { formatDateTime, formatNumber, formatPercent, longMonth, shortMonth } from './format';
import { useHeldWhileClosed } from './motion';

const PAGE_SIZE = 20;

const QUESTION_LABELS = {
    message: 'Most helpful part',
    message2: 'Could do better',
    message3: 'Anything else',
};

function hasComments(item) {
    return [item.message, item.message2, item.message3].some((value) => (value || '').trim());
}

function Stars({ rating, size = 'text-sm' }) {
    const filled = Math.max(Math.min(Math.round(rating), 5), 0);
    return (
        <span className={`whitespace-nowrap leading-none tracking-[0.08em] ${size}`} aria-label={`${rating} out of 5 stars`}>
            <span className="text-[var(--ink)]">{'★'.repeat(filled)}</span>
            <span className="text-[var(--bar)]">{'★'.repeat(5 - filled)}</span>
        </span>
    );
}

function KpiCell({ label, value, suffix, visual, foot }) {
    return (
        <div className="dash-tile flex min-w-0 flex-col justify-between gap-4 p-4 xl:p-5">
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

function FeedbackCard({ item }) {
    const messages = ['message', 'message2', 'message3']
        .map((key) => ({ key, value: (item[key] || '').trim() }))
        .filter((entry) => entry.value);

    return (
        <article className="rounded-2xl bg-white/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div className="min-w-0">
                    <Stars rating={item.rating} />
                    <p className="mt-1.5 truncate text-sm font-medium text-[var(--ink)]">
                        {item.name}
                        <span className="dash-mono ml-2 text-xs font-normal text-[var(--ink-3)]">{item.zid}</span>
                    </p>
                </div>
                <p className="dash-mono text-[11px] text-[var(--ink-3)]">{formatDateTime(item.time)}</p>
            </div>
            <div className="dash-mono mt-2 flex flex-wrap gap-1.5 text-[11px] uppercase tracking-wider text-[var(--ink-2)]">
                <span className="rounded-md border border-[var(--line-strong)] px-1.5 py-0.5">{item.program}</span>
                <span className="rounded-md border border-[var(--line-strong)] px-1.5 py-0.5">{item.session}</span>
            </div>

            {messages.length === 0 ? (
                <p className="mt-3 text-sm italic text-[var(--ink-3)]">No written comments.</p>
            ) : (
                <dl className="mt-3 space-y-2.5 border-t border-[var(--line)] pt-3">
                    {messages.map((entry) => (
                        <div key={entry.key}>
                            <dt className="dash-label">{QUESTION_LABELS[entry.key]}</dt>
                            <dd className="mt-0.5 text-sm leading-relaxed text-[var(--ink)]">{entry.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </article>
    );
}

// months is a comma separated list of YYYY-MM values, empty when every month is included
export default function FeedbackView({
    months,
    timeInADay,
    selectedMonths,
    selectedRating,
    onToggleRating,
    onlyWithComments,
    onToggleOnlyWithComments,
    refreshTick,
    scopeLabel,
    ignoredFilters,
}) {
    const requestKey = `${months}|${timeInADay || ''}|${selectedRating || ''}|${refreshTick}`;
    const [result, setResult] = useState({ key: null, data: null, items: [], error: null });
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadMoreError, setLoadMoreError] = useState('');
    // the note keeps its wording while it folds away after the last ignored filter is removed
    const ignoredNote = useHeldWhileClosed(
        ignoredFilters.map((name) => ({ key: name, label: name })),
        ignoredFilters.length > 0,
    ).map((item) => item.label);

    useEffect(() => {
        const controller = new AbortController();
        const key = `${months}|${timeInADay || ''}|${selectedRating || ''}|${refreshTick}`;
        fetchAdminJson(
            '/admin/feedback',
            { month: months, timeInADay, rating: selectedRating, limit: PAGE_SIZE, offset: 0 },
            controller.signal,
        )
            .then((data) => setResult({ key, data, items: data.items || [], error: null }))
            .catch((error) => {
                if (isAbortError(error)) return;
                setResult((previous) => ({ ...previous, key, error }));
            });
        return () => controller.abort();
    }, [months, timeInADay, selectedRating, refreshTick]);

    const handleLoadMore = async () => {
        const key = result.key;
        try {
            setLoadingMore(true);
            setLoadMoreError('');
            const data = await fetchAdminJson('/admin/feedback', {
                month: months,
                timeInADay,
                rating: selectedRating,
                limit: PAGE_SIZE,
                offset: result.items.length,
            });
            // drop the page if the filters changed while it was loading
            setResult((previous) => (previous.key === key ? { ...previous, items: [...previous.items, ...(data.items || [])] } : previous));
        } catch (error) {
            setLoadMoreError(error.message || 'Could not load more feedback.');
        } finally {
            setLoadingMore(false);
        }
    };

    const isLoading = result.key !== requestKey;
    const { data, items, error } = result;

    if (!data) {
        return (
            <div className="dash-tile flex min-h-48 items-center justify-center p-8 text-center">
                {error && !isLoading ? (
                    <p className="text-sm text-[var(--down)]">{error.message}</p>
                ) : (
                    <p className="dash-label">Loading feedback…</p>
                )}
            </div>
        );
    }

    const summary = data.summary;
    const distribution = data.rating_distribution || [];
    const ratingByMonth = data.rating_by_month || [];
    const fiveStars = distribution.find((item) => item.rating === 5)?.count || 0;
    const visibleItems = onlyWithComments ? items.filter(hasComments) : items;

    return (
        <>
            <Collapse open={ignoredFilters.length > 0} className="pb-5">
                <p className="dash-tile px-4 py-2.5 text-sm text-[var(--ink-2)]">
                    Feedback can only be filtered by month and session, so the {ignoredNote.join(' and ')} filter
                    {ignoredNote.length > 1 ? 's are' : ' is'} not applied here.
                </p>
            </Collapse>
            <div className={`space-y-5 ${isLoading ? 'dash-refreshing' : ''}`} aria-busy={isLoading}>

                {error && (
                    <p className="dash-tile px-4 py-2.5 text-sm text-[var(--down)]" role="alert">
                        {error.message}
                    </p>
                )}

                <section aria-label="Feedback key numbers">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:gap-5">
                        <KpiCell label={`Responses · ${scopeLabel}`} value={formatNumber(summary.total_feedback)} foot="Ratings submitted" />
                        <KpiCell
                            label="Average rating"
                            value={Number(summary.average_rating || 0).toFixed(2)}
                            suffix="/ 5"
                            visual={<Stars rating={summary.average_rating || 0} size="text-base" />}
                            foot={`Across ${formatNumber(summary.total_feedback)} responses`}
                        />
                        <KpiCell
                            label="With comments"
                            value={formatNumber(summary.total_with_comments)}
                            visual={
                                <div className="mb-1.5 w-12 shrink-0 xl:w-16">
                                    <Meter value={summary.total_with_comments} max={summary.total_feedback} label="Share of responses with comments" />
                                </div>
                            }
                            foot={`${formatPercent(summary.total_with_comments, summary.total_feedback)} wrote something`}
                        />
                        <KpiCell
                            label="Five-star share"
                            value={formatPercent(fiveStars, summary.total_feedback)}
                            foot={`${formatNumber(fiveStars)} five-star ratings`}
                        />
                    </div>
                </section>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <Tile
                        title="Average rating by month"
                        meta={`All feedback · last ${ratingByMonth.length} months · selected months highlighted`}
                    >
                        {ratingByMonth.length === 0 ? (
                            <p className="py-16 text-center text-sm text-[var(--ink-3)]">No feedback yet.</p>
                        ) : (
                            <ColumnChart
                                items={ratingByMonth.map((item) => ({
                                    key: item.month,
                                    label: shortMonth(item.month),
                                    value: item.average,
                                    count: item.count,
                                }))}
                                ticks={[0, 1, 2, 3, 4, 5]}
                                height={190}
                                selectedKeys={selectedMonths}
                                formatValue={(value) => Number(value).toFixed(1)}
                                formatTick={(value) => String(value)}
                                columnLabel={(item) => `${longMonth(item.key)}: ${item.value} average from ${item.count} responses`}
                                renderTooltip={(item) => (
                                    <>
                                        <p className="dash-label">{longMonth(item.key)}</p>
                                        <p className="dash-mono mt-0.5 text-lg font-medium leading-tight text-[var(--ink)]">
                                            {Number(item.value).toFixed(2)}
                                            <span className="ml-1 text-xs font-normal text-[var(--ink-3)]">avg rating</span>
                                        </p>
                                        <p className="text-xs text-[var(--ink-2)]">{formatNumber(item.count)} responses</p>
                                    </>
                                )}
                            />
                        )}
                    </Tile>

                    <Tile title="Ratings" meta="Click a rating to filter responses">
                        <RankedBars
                            labelWidth="w-24"
                            activeKey={selectedRating}
                            onItemClick={onToggleRating}
                            items={distribution.map((item) => ({
                                key: item.rating,
                                label: <Stars rating={item.rating} />,
                                value: item.count,
                                meta: formatPercent(item.count, summary.total_feedback),
                            }))}
                        />
                    </Tile>
                </div>

                <Tile
                    title="Responses"
                    meta={
                        onlyWithComments
                            ? `${visibleItems.length} with comments in ${items.length} loaded · ${formatNumber(data.total_matching)} matching`
                            : `Showing ${items.length} of ${formatNumber(data.total_matching)} matching`
                    }
                    actions={
                        <>
                            {selectedRating && (
                                <button
                                    type="button"
                                    onClick={() => onToggleRating(selectedRating)}
                                    className="dash-btn flex items-center gap-1.5 px-2.5 py-1 text-sm"
                                >
                                    {selectedRating}-star only
                                    <span aria-hidden="true" className="text-[var(--ink-3)]">×</span>
                                    <span className="sr-only">, remove filter</span>
                                </button>
                            )}
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--ink-2)]">
                                <input
                                    type="checkbox"
                                    checked={onlyWithComments}
                                    onChange={onToggleOnlyWithComments}
                                    className="h-4 w-4 accent-[var(--accent)]"
                                />
                                Only with comments
                            </label>
                        </>
                    }
                >
                    {visibleItems.length === 0 ? (
                        <p className="py-10 text-center text-sm text-[var(--ink-3)]">
                            {items.length === 0 ? 'No feedback for these filters.' : 'None of the loaded responses have comments yet. Load more to keep looking.'}
                        </p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                            {visibleItems.map((item) => (
                                <FeedbackCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}

                    {loadMoreError && <p className="mt-3 text-sm text-[var(--down)]">{loadMoreError}</p>}

                    {items.length < data.total_matching && (
                        <button
                            type="button"
                            onClick={handleLoadMore}
                            disabled={loadingMore || isLoading}
                            className="dash-btn dash-mono mt-4 w-full py-2 text-[11px] uppercase tracking-wider"
                        >
                            {loadingMore ? 'Loading…' : `Load ${Math.min(PAGE_SIZE, data.total_matching - items.length)} more`}
                        </button>
                    )}
                </Tile>
            </div>
        </>
    );
}
