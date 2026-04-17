import { useEffect, useMemo, useState } from 'react';

const ADDRESS = import.meta.env.VITE_ADDRESS;

function MetricCard({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
    );
}

function HorizontalBarChart({ title, data, maxItems = 8, barColor = 'bg-sky-600', barColors = [] }) {
    const displayData = useMemo(() => data.slice(0, maxItems), [data, maxItems]);
    const maxValue = useMemo(() => Math.max(...displayData.map((item) => item.count), 1), [displayData]);

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            <div className="mt-4 space-y-3">
                {displayData.length === 0 ? (
                    <p className="text-sm text-slate-500">No data available.</p>
                ) : (
                    displayData.map((item, index) => {
                        const itemBarColor = barColors.length > 0 ? barColors[index % barColors.length] : barColor;

                        return (
                        <div key={item.name}>
                            <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                                <span className="truncate pr-2">{item.name}</span>
                                <span>{item.count}</span>
                            </div>
                            <div className="h-2 rounded bg-slate-100">
                                <div
                                    className={`h-2 rounded ${itemBarColor}`}
                                    style={{ width: `${Math.max((item.count / maxValue) * 100, 2)}%` }}
                                />
                            </div>
                        </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function VerticalBars({ title, data, selectedMonth, onSelectMonth }) {
    const maxValue = useMemo(() => Math.max(...data.map((item) => item.count), 1), [data]);

    const formatMonth = (monthValue) => {
        const [year, month] = monthValue.split('-');
        const date = new Date(Number(year), Number(month) - 1, 1);
        return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            {data.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No data available.</p>
            ) : (
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6 xl:grid-cols-12">
                    {data.map((item) => (
                        <button
                            key={item.month}
                            type="button"
                            onClick={() => onSelectMonth(item.month)}
                            className="flex flex-col items-center justify-end"
                        >
                            <div className="mb-2 text-[10px] text-slate-500">{item.count}</div>
                            <div className="flex h-36 w-full items-end rounded bg-slate-100 px-1">
                                <div
                                    className={`w-full rounded ${selectedMonth === item.month ? 'bg-indigo-600' : 'bg-sky-600'}`}
                                    style={{ height: `${Math.max((item.count / maxValue) * 100, 4)}%` }}
                                />
                            </div>
                            <div className={`mt-2 text-[10px] ${selectedMonth === item.month ? 'font-semibold text-indigo-700' : 'text-slate-600'}`}>
                                {formatMonth(item.month)}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                setError('');
                const analyticsUrl = new URL(`${ADDRESS}/admin/analytics`);
                if (selectedMonth) {
                    analyticsUrl.searchParams.set('month', selectedMonth);
                }

                const response = await fetch(analyticsUrl.toString(), {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Your admin session has expired. Please log in again.');
                    }
                    throw new Error('Failed to load analytics data.');
                }

                const data = await response.json();
                setAnalytics(data);
            } catch (fetchError) {
                setError(fetchError.message || 'Could not load analytics.');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [selectedMonth]);

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                    </div>
                </div>

                {loading && <p className="text-sm text-slate-600">Loading analytics...</p>}

                {!loading && error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!loading && !error && analytics && (
                    <div className="space-y-6">
                        {selectedMonth && (
                            <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                                <span>Filtered to {selectedMonth}</span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedMonth(null)}
                                    className="rounded-md border border-indigo-300 px-2 py-1 font-medium hover:bg-indigo-100"
                                >
                                    Clear
                                </button>
                            </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                            <MetricCard label="Total Check-ins" value={analytics.summary.total_checkins} />
                            <MetricCard label="Unique Students" value={analytics.summary.total_students} />
                            <MetricCard label="Signed Sessions" value={analytics.summary.total_signed} />
                            <MetricCard label="Food Collected" value={analytics.summary.total_food_collected} />
                            <MetricCard label="Hoodies Collected" value={analytics.summary.total_hoodies_collected} />
                        </div>

                        <VerticalBars
                            title="Attendance by Month"
                            data={analytics.attendance_by_month || []}
                            selectedMonth={selectedMonth}
                            onSelectMonth={(monthValue) =>
                                setSelectedMonth((currentMonth) => (currentMonth === monthValue ? null : monthValue))
                            }
                        />

                        <div className="grid gap-4 lg:grid-cols-2">
                            <HorizontalBarChart
                                title="Attendance by Program"
                                data={analytics.attendance_by_program || []}
                                maxItems={6}
                                barColors={['bg-emerald-600', 'bg-sky-600', 'bg-amber-500', 'bg-rose-500', 'bg-violet-600', 'bg-cyan-600']}
                            />
                            <HorizontalBarChart
                                title="Attendance Frequency"
                                data={analytics.attendance_frequency || []}
                                maxItems={3}
                            />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <HorizontalBarChart
                                title="Afternoon vs Evening Check-ins"
                                data={analytics.session_checkins || []}
                                maxItems={2}
                            />
                            <HorizontalBarChart
                                title="Blockhouse vs L5 Check-ins"
                                data={analytics.venue_checkins || []}
                                maxItems={2}
                            />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <HorizontalBarChart
                                title="Top Help Topics"
                                data={analytics.help_topics || []}
                                maxItems={10}
                                barColors={['bg-amber-500', 'bg-emerald-600', 'bg-sky-600', 'bg-rose-500', 'bg-violet-600', 'bg-cyan-600']}
                            />

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-800">Top Attendees</h3>
                                <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-slate-500">
                                                <th className="py-2 pr-4 font-medium">zID</th>
                                                <th className="py-2 pr-4 font-medium">Name</th>
                                                <th className="py-2 font-medium">Sessions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(analytics.top_attendees || []).map((person) => (
                                                <tr key={person.zid} className="border-b border-slate-50">
                                                    <td className="py-2 pr-4 text-slate-700">{person.zid}</td>
                                                    <td className="py-2 pr-4 text-slate-700">{person.name}</td>
                                                    <td className="py-2 font-semibold text-slate-900">{person.sessions}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}