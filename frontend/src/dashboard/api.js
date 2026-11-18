const ADDRESS = import.meta.env.VITE_ADDRESS;

// timeInADay values the API accepts, with the labels it uses in session_checkins
export const SESSION_OPTIONS = [
    { key: 'afternoon', name: 'Afternoon · 2–5pm', apiName: 'Afternoon (2-5pm)' },
    { key: 'evening', name: 'Evening · 5–8pm', apiName: 'Evening (5-8pm)' },
];

export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

function buildUrl(path, params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') search.set(key, String(value));
    });
    const query = search.toString() ? `?${search.toString()}` : '';

    if (ADDRESS && /^https?:\/\//.test(ADDRESS)) {
        return `${ADDRESS}${path}${query}`;
    }
    return `/api${path}${query}`;
}

export async function fetchAdminJson(path, params, signal) {
    const response = await fetch(buildUrl(path, params), {
        method: 'GET',
        credentials: 'include',
        signal,
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new ApiError('Your admin session has expired. Please log in again.', 401);
        }
        if (response.status === 403) {
            throw new ApiError('This account does not have access to the admin dashboard.', 403);
        }
        throw new ApiError(`Could not load dashboard data (error ${response.status}).`, response.status);
    }

    return response.json();
}

export function isAbortError(error) {
    return error?.name === 'AbortError';
}
