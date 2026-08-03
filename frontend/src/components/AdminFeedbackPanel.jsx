import { useCallback, useEffect, useState } from 'react';

const ADDRESS = import.meta.env.VITE_ADDRESS;

const PAGE_SIZE = 20;

const QUESTION_LABELS = {
    message: 'Most helpful part',
    message2: 'Could do better',
    message3: 'Anything else',
};

function buildFeedbackUrl({ month, timeInADay, rating, limit, offset }) {
    const params = new URLSearchParams();
    if (month) params.set('month', month);
    if (timeInADay) params.set('timeInADay', timeInADay);
    if (rating) params.set('rating', String(rating));
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    const query = `?${params.toString()}`;

    if (ADDRESS && /^https?:\/\//.test(ADDRESS)) {
        return `${ADDRESS}/admin/feedback${query}`;
    }

    return `/api/admin/feedback${query}`;
}

function formatTime(isoString) {
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

function Stars({ rating }) {
    return (
        <span className="whitespace-nowrap text-base leading-none" aria-label={`${rating} out of 5`}>
            <span className="text-amber-500">{'★'.repeat(Math.max(Math.min(rating, 5), 0))}</span>
            <span className="text-slate-300">{'★'.repeat(Math.max(5 - rating, 0))}</span>
        </span>
    );
}

function MetricCard({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
    );
}

function RatingDistribution({ data, selectedRating, onSelectRating }) {
    const maxValue = Math.max(...data.map((item) => item.count), 1);

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">Rating Distribution</h3>
            <div className="mt-4 space-y-3">
                {data.map((item) => {
                    const isActive = selectedRating === item.rating;
                    return (
                        <button
                            key={item.rating}
                            type="button"
                            onClick={() => onSelectRating(item.rating)}
                            className="group block w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                        >
                            <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                                <span className={`truncate pr-2 ${isActive ? 'font-semibold text-indigo-700' : ''}`}>{item.name}</span>
                                <span className={isActive ? 'font-semibold text-indigo-700' : ''}>{item.count}</span>
                            </div>
                            <div className={`h-2 rounded ${isActive ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                                <div
                                    className={`h-2 rounded bg-amber-500 ${isActive ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                                    style={{ width: `${Math.max((item.count / maxValue) * 100, 2)}%` }}
                                />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function RatingTrend({ data }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">Average Rating by Month</h3>
            {data.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No data available.</p>
            ) : (
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6 xl:grid-cols-12">
                    {data.map((item) => {
                        const [year, month] = item.month.split('-');
                        const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(
                            new Date(Number(year), Number(month) - 1, 1),
                        );
                        return (
                            <div key={item.month} className="flex flex-col items-center justify-end">
                                <div className="mb-2 text-[10px] text-slate-500">{item.average}</div>
                                <div className="flex h-36 w-full items-end rounded bg-slate-100 px-1">
                                    <div
                                        className="w-full rounded bg-amber-500"
                                        style={{ height: `${Math.max((item.average / 5) * 100, 4)}%` }}
                                    />
                                </div>
                                <div className="mt-2 text-[10px] text-slate-600">{monthLabel}</div>
                                <div className="text-[10px] text-slate-400">{item.count}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function FeedbackCard({ item }) {
    const messages = ['message', 'message2', 'message3']
        .map((key) => ({ key, value: (item[key] || '').trim() }))
        .filter((entry) => entry.value);

    return (
        <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <Stars rating={item.rating} />
                    <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                    <span className="text-xs text-slate-500">{item.zid}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">{item.program}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">{item.session}</span>
                    <span>{formatTime(item.time)}</span>
                </div>
            </div>

            {messages.length === 0 ? (
                <p className="mt-2 text-sm italic text-slate-400">No written comments.</p>
            ) : (
                <dl className="mt-2 space-y-1.5">
                    {messages.map((entry) => (
                        <div key={entry.key}>
                            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                {QUESTION_LABELS[entry.key]}
                            </dt>
                            <dd className="text-sm text-slate-700">{entry.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    );
}

export default function AdminFeedbackPanel({ month = null, timeInADay = null }) {
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [items, setItems] = useState([]);
    const [selectedRating, setSelectedRating] = useState(null);
    const [onlyWithComments, setOnlyWithComments] = useState(false);

    const fetchFeedback = useCallback(async (offset) => {
        const response = await fetch(
            buildFeedbackUrl({ month, timeInADay, rating: selectedRating, limit: PAGE_SIZE, offset }),
            { method: 'GET', credentials: 'include' },
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Your admin session has expired. Please log in again.');
            }
            throw new Error('Failed to load feedback data.');
        }

        return response.json();
    }, [month, timeInADay, selectedRating]);

    useEffect(() => {
        let isCurrent = true;

        const loadFirstPage = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await fetchFeedback(0);
                if (!isCurrent) return;
                setFeedback(data);
                setItems(data.items || []);
            } catch (fetchError) {
                if (!isCurrent) return;
                setError(fetchError.message || 'Could not load feedback.');
            } finally {
                if (isCurrent) setLoading(false);
            }
        };

        loadFirstPage();
        return () => {
            isCurrent = false;
        };
    }, [fetchFeedback]);

    const handleLoadMore = async () => {
        try {
            setLoadingMore(true);
            const data = await fetchFeedback(items.length);
            setItems((currentItems) => [...currentItems, ...(data.items || [])]);
        } catch (fetchError) {
            setError(fetchError.message || 'Could not load more feedback.');
        } finally {
            setLoadingMore(false);
        }
    };

    const visibleItems = onlyWithComments
        ? items.filter((item) => [item.message, item.message2, item.message3].some((value) => (value || '').trim()))
        : items;

    return (
        <section className="mt-10 border-t border-slate-200 pt-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-900">Session Feedback</h2>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={onlyWithComments}
                            onChange={(event) => setOnlyWithComments(event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300"
                        />
                        Only with comments
                    </label>
                    {selectedRating && (
                        <button
                            type="button"
                            onClick={() => setSelectedRating(null)}
                            className="rounded-md border border-indigo-300 px-2 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                            Clear {selectedRating}-star filter
                        </button>
                    )}
                </div>
            </div>

            {loading && <p className="text-sm text-slate-600">Loading feedback...</p>}

            {!loading && error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}

            {!loading && !error && feedback && (
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <MetricCard label="Total Feedback" value={feedback.summary.total_feedback} />
                        <MetricCard label="Average Rating" value={`${feedback.summary.average_rating} / 5`} />
                        <MetricCard label="With Comments" value={feedback.summary.total_with_comments} />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <RatingDistribution
                            data={feedback.rating_distribution || []}
                            selectedRating={selectedRating}
                            onSelectRating={(rating) =>
                                setSelectedRating((currentRating) => (currentRating === rating ? null : rating))
                            }
                        />
                        <RatingTrend data={feedback.rating_by_month || []} />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-800">Responses</h3>
                            <span className="text-xs text-slate-500">
                                Showing {visibleItems.length} of {feedback.total_matching}
                            </span>
                        </div>

                        <div className="mt-4 space-y-3">
                            {visibleItems.length === 0 ? (
                                <p className="text-sm text-slate-500">No feedback found for these filters.</p>
                            ) : (
                                visibleItems.map((item) => <FeedbackCard key={item.id} item={item} />)
                            )}
                        </div>

                        {items.length < feedback.total_matching && (
                            <button
                                type="button"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loadingMore ? 'Loading...' : 'Load more'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
